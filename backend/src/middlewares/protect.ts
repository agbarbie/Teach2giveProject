import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import pool from "../db/db.config";
import { UserRequest } from "../utils/Types/UserTypes";
import asyncHandler from "./asyncHandlers";

// Auth middleware to protect routes 
export const protect = asyncHandler(async (req: UserRequest, res: Response, next: NextFunction) => {
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

        const decoded = jwt.verify(token, process.env.JWT_SECRET) as { 
            userId: string; 
            roleId: number 
        };

        // Get user from database with role information
        const userQuery = await pool.query(
            `SELECT 
                users.id, 
                users.name, 
                users.email, 
                users.role_id, 
                user_roles.role_name,
                users.profile_completed
             FROM users 
             JOIN user_roles ON users.role_id = user_roles.id 
             WHERE users.id = $1`,
            [decoded.userId]
        );

        if (userQuery.rows.length === 0) {
            return res.status(401).json({ 
                success: false,
                message: "User not found" 
            });
        }

        // Attach user to the request object
        req.user = userQuery.rows[0];
        next();

    } catch (error) {
        console.error("JWT Error:", error);
        
        // Handle specific JWT errors
        let errorMessage = "Not authorized, token failed";
        if (error instanceof jwt.TokenExpiredError) {
            errorMessage = "Session expired, please login again";
        } else if (error instanceof jwt.JsonWebTokenError) {
            errorMessage = "Invalid token";
        }

        return res.status(401).json({ 
            success: false,
            message: errorMessage 
        });
    }
});

// Role-based authorization middleware
export const authorize = (...roles: string[]) => {
    return (req: UserRequest, res: Response, next: NextFunction) => {
        if (!req.user || !roles.includes(req.user.role_name)) {
            return res.status(403).json({
                success: false,
                message: `User role ${req.user?.role_name || "unknown"} is not authorized to access this route`
            });
        }
        next();
    };
};

// Middleware to check if profile is completed
export const checkProfileComplete = asyncHandler(async (req: UserRequest, res: Response, next: NextFunction) => {
    if (!req.user?.profile_completed) {
        return res.status(403).json({
            success: false,
            message: "Please complete your profile to access this feature"
        });
    }
    next();
});