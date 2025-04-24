import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import pool from '../db/db.config';
import { AppError } from './errorMiddlewares';
import asyncHandler from './asyncHandlers';
import { RequestWithUser } from '../utils/Types';

// Auth middleware to protect routes 
export const protect = asyncHandler(async (req: RequestWithUser, res: Response, next: NextFunction) => {
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
    return next(new AppError('Not authorized, no token provided', 401));
  }

  try {
    // Ensure JWT_SECRET is defined
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not defined in environment variables");
    }

    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET) as { userId: string };

    // Fetch the user from the database
    const userQuery = await pool.query(
      "SELECT id, email, role FROM users WHERE id = $1",
      [decoded.userId]
    );

    if (userQuery.rows.length === 0) {
      return next(new AppError('User not found', 401));
    }

    // Attach the user to the request
    req.user = userQuery.rows[0];

    // Proceed to the next middleware
    next();
  } catch (error) {
    console.error("JWT Error:", error);

    // Handle token expiration or invalid token
    if (error instanceof jwt.TokenExpiredError) {
      return next(new AppError('Token expired, please log in again', 401));
    } else if (error instanceof jwt.JsonWebTokenError) {
      return next(new AppError('Invalid token, not authorized', 401));
    }

    next(new AppError('Not authorized, token failed', 401));
  }
});

// Role-based access control middleware
export const checkRole = (roles: string[]) => {
  return (req: RequestWithUser, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Not authorized, authentication required', 401));
    }
    
    if (!roles.includes(req.user.role)) {
      return next(new AppError(`Not authorized, ${roles.join(' or ')} role required`, 403));
    }
    
    next();
  };
};