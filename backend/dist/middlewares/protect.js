"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.restrictTo = exports.protect = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
// Custom error class
class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}
// Async handler to avoid try-catch blocks in each controller
const asyncHandler = (fn) => {
    return (req, res, next) => {
        fn(req, res, next).catch(next);
    };
};
// Authentication middleware
exports.protect = asyncHandler(async (req, res, next) => {
    // 1) Get token from authorization header or cookies
    let token;
    const authHeader = req.headers.authorization;
    if (authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer')) {
        token = authHeader.split(' ')[1];
    }
    else if (req.cookies && req.cookies.jwt) {
        // Also check for token in cookies as a fallback
        token = req.cookies.jwt;
    }
    if (!token) {
        return next(new AppError('You are not logged in! Please log in to get access.', 401));
    }
    // 2) Verify token
    try {
        // Make sure JWT_SECRET is properly loaded from environment variables
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            console.error('JWT_SECRET environment variable is not set');
            return next(new AppError('Internal server error', 500));
        }
        const decoded = jsonwebtoken_1.default.verify(token, jwtSecret);
        // Check if token is expired
        const currentTimestamp = Math.floor(Date.now() / 1000);
        if (decoded.exp && decoded.exp < currentTimestamp) {
            return next(new AppError('Your token has expired. Please log in again.', 401));
        }
        // Set user data on request object
        req.user = {
            id: decoded.id,
            role: decoded.role
        };
        next();
    }
    catch (error) {
        // Log the specific JWT error for debugging
        console.error('JWT verification error:', error);
        return next(new AppError('Invalid token. Please log in again.', 401));
    }
});
// Role-based authorization middleware
const restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return next(new AppError('You are not logged in! Please log in to get access.', 401));
        }
        if (!roles.includes(req.user.role)) {
            return next(new AppError('You do not have permission to perform this action', 403));
        }
        next();
    };
};
exports.restrictTo = restrictTo;
