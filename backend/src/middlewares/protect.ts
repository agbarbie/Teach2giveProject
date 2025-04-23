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
    console.log('Token extracted from Authorization header');
  } else if (req.cookies && req.cookies.jwt) {
    // Also check for token in cookies as a fallback
    token = req.cookies.jwt;
    console.log('Token extracted from cookies');
  }

  if (!token) {
    return next(new AppError('You are not logged in! Please log in to get access.', 401));
  }

  console.log(`Token prefix: ${token.substring(0, 10)}...`);

  // 2) Verify token
  try {
    // Make sure JWT_SECRET is properly loaded from environment variables
    const jwtSecret = process.env.JWT_SECRET;
    
    if (!jwtSecret) {
      console.error('JWT_SECRET environment variable is not set!');
      return next(new AppError('Server configuration error', 500));
    }
    
    console.log('Attempting to verify token...');
    const decoded = jwt.verify(token, jwtSecret) as DecodedUser;
    console.log(`Token successfully verified for user ID: ${decoded.id}`);
    
    // Calculate and log when the token will expire
    if (decoded.exp) {
      const expiryDate = new Date(decoded.exp * 1000);
      console.log(`Token expires at: ${expiryDate.toISOString()}`);
      
      // Check if token is expired (this should be caught by jwt.verify, but double-checking)
      const currentTimestamp = Math.floor(Date.now() / 1000);
      if (decoded.exp < currentTimestamp) {
        return next(new AppError('Your token has expired. Please log in again.', 401));
      }
    }
    
    // Check if user still exists in the database
    console.log(`Querying database for user ID: ${decoded.id}`);
    const { rows } = await pool.query(
      'SELECT id, email, first_name, last_name, role FROM users WHERE id = $1',
      [decoded.id]
    );

    if (rows.length === 0) {
      return next(new AppError('The user belonging to this token no longer exists.', 401));
    }

    console.log(`User found in database: ${rows[0].email}`);

    // Check if is_active column exists and if so, check its value
    const activeCheckResult = await pool.query(
      "SELECT column_name FROM information_schema.columns WHERE table_name='users' AND column_name='is_active'"
    );
    
    if (activeCheckResult.rows.length > 0) {
      const activeUser = await pool.query(
        'SELECT id FROM users WHERE id = $1 AND is_active = true',
        [decoded.id]
      );
      
      if (activeUser.rows.length === 0) {
        return next(new AppError('User account is not active.', 401));
      }
    }

    // Check if password_changed_at column exists and if so, check its value
    const passwordChangedCheckResult = await pool.query(
      "SELECT column_name FROM information_schema.columns WHERE table_name='users' AND column_name='password_changed_at'"
    );
    
    if (passwordChangedCheckResult.rows.length > 0 && decoded.iat) {
      const userData = await pool.query(
        'SELECT password_changed_at FROM users WHERE id = $1',
        [decoded.id]
      );
      
      if (userData.rows[0].password_changed_at) {
        const passwordChangedAt = new Date(userData.rows[0].password_changed_at).getTime() / 1000;
        
        if (passwordChangedAt > decoded.iat) {
          return next(new AppError('User recently changed password. Please log in again.', 401));
        }
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
    
    console.log(`User authenticated successfully: ${rows[0].email} with role ${rows[0].role}`);
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