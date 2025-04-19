"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUsersByType = exports.getUserById = exports.getAllUsers = void 0;
const db_config_1 = __importDefault(require("../db/db.config"));
// Get all users
const getAllUsers = async (req, res) => {
    try {
        const result = await db_config_1.default.query('SELECT id, name, email, user_type, created_at FROM users');
        res.status(200).json({ users: result.rows });
    }
    catch (error) {
        console.error('Get Users Error:', error);
        res.status(500).json({ message: 'Error fetching users' });
    }
};
exports.getAllUsers = getAllUsers;
// Get a user by ID
const getUserById = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await db_config_1.default.query('SELECT id, name, email, user_type, created_at FROM users WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json({ user: result.rows[0] });
    }
    catch (error) {
        console.error('Get User Error:', error);
        res.status(500).json({ message: 'Error fetching user' });
    }
};
exports.getUserById = getUserById;
// Get users by user type (e.g., "employer", "job_seeker", "admin")
const getUsersByType = async (req, res) => {
    try {
        const { user_type } = req.params;
        const result = await db_config_1.default.query('SELECT id, name, email, user_type, created_at FROM users WHERE user_type = $1', [user_type]);
        res.status(200).json({ users: result.rows });
    }
    catch (error) {
        console.error('Get Users By Type Error:', error);
        res.status(500).json({ message: 'Error fetching users by type' });
    }
};
exports.getUsersByType = getUsersByType;
