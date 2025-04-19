"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = exports.register = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_config_1 = __importDefault(require("../db/db.config"));
const JWT_SECRET = process.env.JWT_SECRET || 'skillmatches_secret';
// Register
const register = async (req, res) => {
    try {
        const { name, email, password, user_type } = req.body;
        const existingUserQuery = await db_config_1.default.query('SELECT * FROM users WHERE email = $1', [email]);
        if (existingUserQuery.rows.length > 0) {
            res.status(400).json({ message: 'User already exists' });
            return;
        }
        const password_hash = await bcryptjs_1.default.hash(password, 10);
        const newUserQuery = await db_config_1.default.query('INSERT INTO users (name, email, password_hash, user_type) VALUES ($1, $2, $3, $4) RETURNING id, name, email, user_type', [name, email, password_hash, user_type]);
        res.status(201).json({
            message: 'User registered successfully',
            user: newUserQuery.rows[0],
        });
    }
    catch (error) {
        console.error('Registration Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.register = register;
// Login
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const userQuery = await db_config_1.default.query('SELECT * FROM users WHERE email = $1', [email]);
        const user = userQuery.rows[0];
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        const isMatch = await bcryptjs_1.default.compare(password, user.password_hash);
        if (!isMatch) {
            res.status(401).json({ message: 'Invalid credentials' });
            return;
        }
        const token = jsonwebtoken_1.default.sign({ id: user.id, user_type: user.user_type }, JWT_SECRET, { expiresIn: '1d' });
        res.status(200).json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                user_type: user.user_type,
            },
        });
    }
    catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.login = login;
