"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkProfileComplete = exports.authorize = exports.protect = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_config_1 = __importDefault(require("../db/db.config"));
const asyncHandlers_1 = __importDefault(require("./asyncHandlers"));
// Auth middleware to protect routes 
exports.protect = (0, asyncHandlers_1.default)(async (req, res, next) => {
    let token;
    // Try to get token from Authorization Header
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
        token = req.headers.authorization.split(" ")[1];
    }
    // Get the token from cookies if not found in header
    else if (req.cookies?.access_token) {
        token = req.cookies.access_token;
    }
    // If no token found
    if (!token) {
        return res.status(401).json({
            success: false,
            message: "Not authorized, no token"
        });
    }
    try {
        // Verify token
        if (!process.env.JWT_SECRET) {
            throw new Error("JWT_SECRET is not defined in environment variables");
        }
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        // Get user from database with role information
        const userQuery = await db_config_1.default.query(`SELECT 
                users.id, 
                users.name, 
                users.email, 
                users.role_id, 
                user_roles.role_name,
                users.profile_completed
             FROM users 
             JOIN user_roles ON users.role_id = user_roles.id 
             WHERE users.id = $1`, [decoded.userId]);
        if (userQuery.rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: "User not found"
            });
        }
        // Attach user to the request object
        req.user = userQuery.rows[0];
        next();
    }
    catch (error) {
        console.error("JWT Error:", error);
        // Handle specific JWT errors
        let errorMessage = "Not authorized, token failed";
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            errorMessage = "Session expired, please login again";
        }
        else if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            errorMessage = "Invalid token";
        }
        return res.status(401).json({
            success: false,
            message: errorMessage
        });
    }
});
// Role-based authorization middleware
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role_name)) {
            return res.status(403).json({
                success: false,
                message: `User role ${req.user?.role_name || "unknown"} is not authorized to access this route`
            });
        }
        next();
    };
};
exports.authorize = authorize;
// Middleware to check if profile is completed
exports.checkProfileComplete = (0, asyncHandlers_1.default)(async (req, res, next) => {
    if (!req.user?.profile_completed) {
        return res.status(403).json({
            success: false,
            message: "Please complete your profile to access this feature"
        });
    }
    next();
});
