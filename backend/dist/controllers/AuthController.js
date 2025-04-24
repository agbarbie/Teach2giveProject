"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.linkCompany = exports.changePassword = exports.getCurrentUser = exports.login = exports.register = void 0;
const asyncHandlers_1 = __importDefault(require("../middlewares/asyncHandlers"));
const db_config_1 = __importDefault(require("../db/db.config"));
const errorMiddlewares_1 = require("../middlewares/errorMiddlewares");
const helpers_1 = require("../utils/helpers");
// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
exports.register = (0, asyncHandlers_1.default)(async (req, res) => {
    const { email, password, role, company_name, full_name } = req.body;
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
    // If employer role but no company name provided, throw error
    if (userRole === 'employer' && !company_name) {
        throw new errorMiddlewares_1.AppError('Company name is required for employer accounts', 400);
    }
    // Hash password
    const hashedPassword = await (0, helpers_1.hashPassword)(password);
    const client = await db_config_1.default.connect();
    try {
        await client.query('BEGIN');
        // Create user
        const result = await client.query('INSERT INTO users (email, password, role, created_at, updated_at) VALUES ($1, $2, $3, NOW(), NOW()) RETURNING id, email, role, created_at', [email, hashedPassword, userRole]);
        const newUser = result.rows[0];
        // Create profile based on role
        if (userRole === 'jobseeker') {
            await client.query('INSERT INTO jobseeker_profiles (user_id, full_name, created_at, updated_at) VALUES ($1, $2, NOW(), NOW())', [newUser.id, full_name || '']);
        }
        else if (userRole === 'employer') {
            // For employers, check if company exists or create new one
            const companyQuery = await client.query('SELECT company_id FROM companies WHERE LOWER(name) = LOWER($1)', [company_name]);
            let companyId;
            if (companyQuery.rows.length > 0) {
                // Company exists
                companyId = companyQuery.rows[0].company_id;
            }
            else {
                // Create new company
                const companyResult = await client.query('INSERT INTO companies (name, owner_id, created_at, updated_at) VALUES ($1, $2, NOW(), NOW()) RETURNING company_id', [company_name, newUser.id]);
                companyId = companyResult.rows[0].company_id;
            }
            // Associate user with company
            await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS company_id INTEGER REFERENCES companies(company_id) ON DELETE SET NULL');
            await client.query('UPDATE users SET company_id = $1 WHERE id = $2', [companyId, newUser.id]);
            // Also create entry in user_companies table for more flexibility
            // Create the table if it doesn't exist yet
            await client.query(`
        CREATE TABLE IF NOT EXISTS user_companies (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          company_id INTEGER NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
          is_owner BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT NOW(),
          UNIQUE(user_id, company_id)
        )
      `);
            await client.query('INSERT INTO user_companies (user_id, company_id, is_owner, created_at) VALUES ($1, $2, $3, NOW())', [newUser.id, companyId, true]);
        }
        // Generate token
        const token = (0, helpers_1.generateToken)(newUser.id, newUser.role);
        await client.query('COMMIT');
        const { accessToken, refreshToken } = token;
        // Get company information if it's an employer
        let companyInfo = null;
        if (userRole === 'employer') {
            const companyResult = await db_config_1.default.query('SELECT c.* FROM companies c JOIN users u ON c.company_id = u.company_id WHERE u.id = $1', [newUser.id]);
            if (companyResult.rows.length > 0) {
                companyInfo = companyResult.rows[0];
            }
        }
        res.status(201).json((0, helpers_1.formatSuccess)({
            id: newUser.id,
            email: newUser.email,
            role: newUser.role,
            accessToken,
            refreshToken,
            company: companyInfo
        }, 'User registered successfully'));
    }
    catch (error) {
        await client.query('ROLLBACK');
        throw error;
    }
    finally {
        client.release();
    }
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
    const token = (0, helpers_1.generateToken)(user.id, user.role);
    const { accessToken, refreshToken } = token;
    // Get company information if it's an employer
    let companyInfo = null;
    if (user.role === 'employer') {
        // Check if company_id column exists in users table
        const columnExists = await db_config_1.default.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'company_id'
    `);
        if (columnExists.rows.length > 0) {
            const companyResult = await db_config_1.default.query('SELECT c.* FROM companies c JOIN users u ON c.company_id = u.company_id WHERE u.id = $1', [user.id]);
            if (companyResult.rows.length > 0) {
                companyInfo = companyResult.rows[0];
            }
        }
        else {
            // If no direct company_id in users table, try user_companies
            const companyResult = await db_config_1.default.query('SELECT c.* FROM companies c JOIN user_companies uc ON c.company_id = uc.company_id WHERE uc.user_id = $1', [user.id]);
            if (companyResult.rows.length > 0) {
                companyInfo = companyResult.rows[0];
            }
        }
    }
    res.json((0, helpers_1.formatSuccess)({
        id: user.id,
        email: user.email,
        role: user.role,
        accessToken,
        refreshToken,
        company: companyInfo
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
    const user = result.rows[0];
    // Get company information if it's an employer
    let companyInfo = null;
    if (user.role === 'employer') {
        // Check if company_id column exists in users table
        const columnExists = await db_config_1.default.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'company_id'
    `);
        if (columnExists.rows.length > 0) {
            const companyResult = await db_config_1.default.query('SELECT c.* FROM companies c JOIN users u ON c.company_id = u.company_id WHERE u.id = $1', [userId]);
            if (companyResult.rows.length > 0) {
                companyInfo = companyResult.rows[0];
            }
        }
        else {
            // If no direct company_id in users table, try user_companies
            const companyResult = await db_config_1.default.query('SELECT c.* FROM companies c JOIN user_companies uc ON c.company_id = uc.company_id WHERE uc.user_id = $1', [userId]);
            if (companyResult.rows.length > 0) {
                companyInfo = companyResult.rows[0];
            }
        }
    }
    res.json((0, helpers_1.formatSuccess)({
        ...user,
        company: companyInfo
    }, 'Current user retrieved successfully'));
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
// @desc    Link user to company (for existing users)
// @route   POST /api/auth/link-company
// @access  Private/Employer
exports.linkCompany = (0, asyncHandlers_1.default)(async (req, res) => {
    const userId = req.user.id;
    const { company_name } = req.body;
    if (!company_name) {
        throw new errorMiddlewares_1.AppError('Company name is required', 400);
    }
    // Check if user is an employer
    const userResult = await db_config_1.default.query('SELECT role FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) {
        throw new errorMiddlewares_1.AppError('User not found', 404);
    }
    if (userResult.rows[0].role !== 'employer') {
        throw new errorMiddlewares_1.AppError('Only employers can link to companies', 403);
    }
    const client = await db_config_1.default.connect();
    try {
        await client.query('BEGIN');
        // Check if company exists or create new one
        const companyQuery = await client.query('SELECT company_id FROM companies WHERE LOWER(name) = LOWER($1)', [company_name]);
        let companyId;
        if (companyQuery.rows.length > 0) {
            // Company exists
            companyId = companyQuery.rows[0].company_id;
        }
        else {
            // Create new company
            const companyResult = await client.query('INSERT INTO companies (name, owner_id, created_at, updated_at) VALUES ($1, $2, NOW(), NOW()) RETURNING company_id', [company_name, userId]);
            companyId = companyResult.rows[0].company_id;
        }
        // Associate user with company
        await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS company_id INTEGER REFERENCES companies(company_id) ON DELETE SET NULL');
        await client.query('UPDATE users SET company_id = $1 WHERE id = $2', [companyId, userId]);
        // Also create entry in user_companies table for more flexibility
        // Create the table if it doesn't exist yet
        await client.query(`
      CREATE TABLE IF NOT EXISTS user_companies (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        company_id INTEGER NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
        is_owner BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_id, company_id)
      )
    `);
        // Check if association already exists
        const associationExists = await client.query('SELECT id FROM user_companies WHERE user_id = $1 AND company_id = $2', [userId, companyId]);
        if (associationExists.rows.length === 0) {
            await client.query('INSERT INTO user_companies (user_id, company_id, is_owner, created_at) VALUES ($1, $2, $3, NOW())', [userId, companyId, true]);
        }
        await client.query('COMMIT');
        // Get company information
        const companyResult = await db_config_1.default.query('SELECT * FROM companies WHERE company_id = $1', [companyId]);
        res.json((0, helpers_1.formatSuccess)({
            company: companyResult.rows[0]
        }, 'Company linked successfully'));
    }
    catch (error) {
        await client.query('ROLLBACK');
        throw error;
    }
    finally {
        client.release();
    }
});
