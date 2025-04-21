"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.changePassword = exports.getCurrentUser = exports.login = exports.register = void 0;
const asyncHandlers_1 = __importDefault(require("../middlewares/asyncHandlers"));
const db_config_1 = __importDefault(require("../db/db.config"));
const errorMiddlewares_1 = require("../middlewares/errorMiddlewares");
const helpers_1 = require("../utils/helpers");
// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
exports.register = (0, asyncHandlers_1.default)(async (req, res) => {
    const { email, password, role } = req.body;
    if (!email || !password) {
        throw new errorMiddlewares_1.AppError('Please provide email and password', 400);
    }
    // Check if email already exists
    const userExists = await db_config_1.default.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userExists.rows.length > 0) {
        throw new errorMiddlewares_1.AppError('User already exists', 400);
    }
    // Validate role
    const validRoles = ['jobseeker', 'employer', 'admin'];
    const userRole = role || 'jobseeker'; // Default to jobseeker
    if (!validRoles.includes(userRole)) {
        throw new errorMiddlewares_1.AppError('Invalid role', 400);
    }
    // Hash password
    const hashedPassword = await (0, helpers_1.hashPassword)(password);
    // Create user
    const result = await db_config_1.default.query('INSERT INTO users (email, password, role, created_at, updated_at) VALUES ($1, $2, $3, NOW(), NOW()) RETURNING id, email, role, created_at', [email, hashedPassword, userRole]);
    const newUser = result.rows[0];
    // Create profile based on role
    if (userRole === 'jobseeker') {
        await db_config_1.default.query('INSERT INTO jobseeker_profiles (user_id, full_name, created_at, updated_at) VALUES ($1, $2, NOW(), NOW())', [newUser.id, '']);
    }
    // Generate token
    const token = (0, helpers_1.generateToken)(newUser);
    res.status(201).json((0, helpers_1.formatSuccess)({
        id: newUser.id,
        email: newUser.email,
        role: newUser.role,
        token
    }, 'User registered successfully'));
});
// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = (0, asyncHandlers_1.default)(async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        throw new errorMiddlewares_1.AppError('Please provide email and password', 400);
    }
    // Find user
    const result = await db_config_1.default.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
        throw new errorMiddlewares_1.AppError('Invalid credentials', 401);
    }
    const user = result.rows[0];
    // Check password
    const isPasswordValid = await (0, helpers_1.comparePassword)(password, user.password);
    if (!isPasswordValid) {
        throw new errorMiddlewares_1.AppError('Invalid credentials', 401);
    }
    // Generate token
    const token = (0, helpers_1.generateToken)(user);
    res.json((0, helpers_1.formatSuccess)({
        id: user.id,
        email: user.email,
        role: user.role,
        token
    }, 'Login successful'));
});
// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
exports.getCurrentUser = (0, asyncHandlers_1.default)(async (req, res) => {
    const userId = req.user.id;
    const result = await db_config_1.default.query('SELECT id, email, role, created_at FROM users WHERE id = $1', [userId]);
    if (result.rows.length === 0) {
        throw new errorMiddlewares_1.AppError('User not found', 404);
    }
    res.json((0, helpers_1.formatSuccess)(result.rows[0], 'Current user retrieved successfully'));
});
// @desc    Change password
// @route   PUT /api/auth/password
// @access  Private
exports.changePassword = (0, asyncHandlers_1.default)(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;
    if (!currentPassword || !newPassword) {
        throw new errorMiddlewares_1.AppError('Please provide current and new password', 400);
    }
    // Get current user with password
    const result = await db_config_1.default.query('SELECT * FROM users WHERE id = $1', [userId]);
    if (result.rows.length === 0) {
        throw new errorMiddlewares_1.AppError('User not found', 404);
    }
    const user = result.rows[0];
    // Verify current password
    const isPasswordValid = await (0, helpers_1.comparePassword)(currentPassword, user.password);
    if (!isPasswordValid) {
        throw new errorMiddlewares_1.AppError('Current password is incorrect', 401);
    }
    // Hash new password
    const hashedPassword = await (0, helpers_1.hashPassword)(newPassword);
    // Update password
    await db_config_1.default.query('UPDATE users SET password = $1, updated_at = NOW() WHERE id = $2', [hashedPassword, userId]);
    res.json((0, helpers_1.formatSuccess)(null, 'Password updated successfully'));
});
