import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import pool from '../db/db.config';
import { AppError } from './errorMiddlewares';

// Define simplified interfaces for better TypeScript support
interface DecodedUser {
  id: number;
  email: string;
  role: 'jobseeker' | 'employer' | 'admin';
  iat: number;
  exp: number;
}

// Extend the Express Request interface
export interface RequestWithUser extends Request {
  user?: {
    id: number;
    email?: string;
    first_name?: string;
    last_name?: string;
    role: 'jobseeker' | 'employer' | 'admin';
  };
}

// Async handler to avoid try-catch blocks in each controller
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
};

// Authentication middleware
export const protect = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  // 1) Get token from authorization header or cookies
  let token: string | undefined;
  
  const authHeader = req.headers.authorization;
  
  if (authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer')) {
    token = authHeader.split(' ')[1];
  } else if (req.cookies && req.cookies.jwt) {
    // Also check for token in cookies as a fallback
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(new AppError('You are not logged in! Please log in to get access.', 401));
  }

  // 2) Verify token
  try {
    // Make sure JWT_SECRET is properly loaded from environment variables
    const jwtSecret = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
    
    const decoded = jwt.verify(token, jwtSecret) as DecodedUser;
    
    // Check if token is expired
    const currentTimestamp = Math.floor(Date.now() / 1000);
    if (decoded.exp && decoded.exp < currentTimestamp) {
      return next(new AppError('Your token has expired. Please log in again.', 401));
    }
    
    // Check if user still exists in the database
    const { rows } = await pool.query(
      'SELECT id, email, first_name, last_name, role FROM users WHERE id = $1 AND is_active = true',
      [decoded.id]
    );

    if (rows.length === 0) {
      return next(new AppError('The user belonging to this token no longer exists.', 401));
    }

    // Check if user changed password after token was issued
    if (decoded.iat) {
      const passwordChangedAt = rows[0].password_changed_at 
        ? new Date(rows[0].password_changed_at).getTime() / 1000 
        : 0;

      if (passwordChangedAt > decoded.iat) {
        return next(new AppError('User recently changed password. Please log in again.', 401));
      }
    }
    
    // Set user data on request object
    (req as RequestWithUser).user = {
      id: decoded.id,
      email: rows[0].email,
      first_name: rows[0].first_name,
      last_name: rows[0].last_name,
      role: rows[0].role as 'jobseeker' | 'employer' | 'admin'
    };
    
    next();
  } catch (error) {
    // Log the specific JWT error for debugging
    console.error('JWT verification error:', error);
    return next(new AppError('Invalid token. Please log in again.', 401));
  }
});

// Role-based authorization middleware
export const restrictTo = (...roles: Array<'jobseeker' | 'employer' | 'admin'>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as RequestWithUser).user;
    
    if (!user) {
      return next(new AppError('You must be logged in to access this resource', 401));
    }
    
    if (!roles.includes(user.role)) {
      return next(new AppError('You do not have permission to perform this action', 403));
    }
    
    next();
  };
};