"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.restrictTo = exports.protect = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_config_1 = __importDefault(require("../db/db.config"));
const errorMiddlewares_1 = require("./errorMiddlewares");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// Middleware to protect routes by verifying JWT token
const protect = async (req, res, next) => {
    try {
        let token;
        // Check for token in Authorization header with Bearer prefix
        if (req.headers.authorization &&
            req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }
        // If no token found, return unauthorized error
        if (!token) {
            return next(new errorMiddlewares_1.AppError('Not authorized, no token provided', 401));
        }
        try {
            // Verify token
            const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'fallback_secret');
            // Check if token is still valid (not expired)
            if (decoded.exp * 1000 < Date.now()) {
                return next(new errorMiddlewares_1.AppError('Token expired, please login again', 401));
            }
            // Check if user still exists in database
            const { rows } = await db_config_1.default.query('SELECT id, email, role FROM users WHERE id = $1', [decoded.id]);
            if (rows.length === 0) {
                return next(new errorMiddlewares_1.AppError('User belonging to this token no longer exists', 401));
            }
            // Add user to request object
            req.user = rows[0];
            next();
        }
        catch (error) {
            return next(new errorMiddlewares_1.AppError('Invalid token, please login again', 401));
        }
    }
    catch (error) {
        next(error);
    }
};
exports.protect = protect;
// Middleware to restrict access based on user roles
const restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return next(new errorMiddlewares_1.AppError('User not found, please login again', 401));
        }
        if (!roles.includes(req.user.role)) {
            return next(new errorMiddlewares_1.AppError('You do not have permission to perform this action', 403));
        }
        next();
    };
};
exports.restrictTo = restrictTo;
