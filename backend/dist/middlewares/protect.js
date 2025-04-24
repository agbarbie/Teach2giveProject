"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkRole = exports.protect = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_config_1 = __importDefault(require("../db/db.config"));
const errorMiddlewares_1 = require("./errorMiddlewares");
const asyncHandlers_1 = __importDefault(require("./asyncHandlers"));
// Auth middleware to protect routes 
exports.protect = (0, asyncHandlers_1.default)(async (req, res, next) => {
    let token;
    // Check for token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
        token = req.headers.authorization.split(" ")[1];
    }
    // // Check for token in cookies as fallback
    // else if (req.cookies && req.cookies.access_token) {
    //   token = req.cookies.access_token;
    // }
    // If no token is found
    if (!token) {
        return next(new errorMiddlewares_1.AppError('Not authorized, no token provided', 401));
    }
    try {
        // Ensure JWT_SECRET is defined
        if (!process.env.JWT_SECRET) {
            throw new Error("JWT_SECRET is not defined in environment variables");
        }
        // Verify the token
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        // Fetch the user from the database
        const userQuery = await db_config_1.default.query("SELECT id, email, role FROM users WHERE id = $1", [decoded.userId]);
        if (userQuery.rows.length === 0) {
            return next(new errorMiddlewares_1.AppError('User not found', 401));
        }
        // Attach the user to the request
        req.user = userQuery.rows[0];
        // Proceed to the next middleware
        next();
    }
    catch (error) {
        console.error("JWT Error:", error);
        // Handle token expiration or invalid token
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            return next(new errorMiddlewares_1.AppError('Token expired, please log in again', 401));
        }
        else if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            return next(new errorMiddlewares_1.AppError('Invalid token, not authorized', 401));
        }
        next(new errorMiddlewares_1.AppError('Not authorized, token failed', 401));
    }
});
// Role-based access control middleware
const checkRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return next(new errorMiddlewares_1.AppError('Not authorized, authentication required', 401));
        }
        if (!roles.includes(req.user.role)) {
            return next(new errorMiddlewares_1.AppError(`Not authorized, ${roles.join(' or ')} role required`, 403));
        }
        next();
    };
};
exports.checkRole = checkRole;
