"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.protect = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_config_1 = __importDefault(require("../db/db.config"));
const asyncHandlers_1 = __importDefault(require("./asyncHandlers"));
//Auth middleware to protect routes 
exports.protect = (0, asyncHandlers_1.default)(async (req, res, next) => {
    let token;
    // Try to get the token from the Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
        token = req.headers.authorization.split(" ")[1];
    }
    // If no token is found
    if (!token) {
        return res.status(401).json({ message: "Not authorized, no token" });
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
            return res.status(401).json({ message: "User not found" });
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
            return res.status(401).json({ message: "Token expired, please log in again" });
        }
        else if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            return res.status(401).json({ message: "Invalid token, not authorized" });
        }
        res.status(401).json({ message: "Not authorized, token failed" });
    }
});
