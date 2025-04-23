import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import pool from '../db/db.config';
import { AppError } from './errorMiddlewares';
import dotenv from 'dotenv';

dotenv.config();

// Extended Request interface with user property
export interface RequestWithUser extends Request {
  user?: {
    id: number;
    email: string;
    role: string;
  };
}

// Middleware to protect routes by verifying JWT token
export const protect = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  try {
    let token: string | undefined;

    // Check for token in Authorization header with Bearer prefix
    if (
      req.headers.authorization && 
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    // If no token found, return unauthorized error
    if (!token) {
      return next(new AppError('Not authorized, no token provided', 401));
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'mysecretkey') as {
        id: number;
        iat: number;
        exp: number;
      };

      // Check if token is still valid (not expired)
      if (decoded.exp * 1000 < Date.now()) {
        return next(new AppError('Token expired, please login again', 401));
      }

      // Check if user still exists in database
      const { rows } = await pool.query(
        'SELECT id, email, role FROM users WHERE id = $1',
        [decoded.id]
      );

      if (rows.length === 0) {
        return next(new AppError('User belonging to this token no longer exists', 401));
      }

      // Add user to request object
      req.user = rows[0];
      next();
    } catch (error) {
      return next(new AppError('Invalid token, please login again', 401));
    }
  } catch (error) {
    next(error);
  }
};

// Middleware to restrict access based on user roles
export const restrictTo = (...roles: string[]) => {
  return (req: RequestWithUser, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('User not found, please login again', 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this action', 403));
    }

    next();
  };
};