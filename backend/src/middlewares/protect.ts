import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Define simplified interfaces for better TypeScript support
interface DecodedUser {
  id: number;
  email: string;
  role: 'jobseeker' | 'employer' | 'admin';
  iat: number;
  exp: number;
}

// Extend the Express Request interface
interface AuthRequest extends Request {
  user?: {
    id: number;
    role: 'jobseeker' | 'employer' | 'admin';
  };
}

// Custom error class
class AppError extends Error {
  statusCode: number;
  status: string;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Async handler to avoid try-catch blocks in each controller
const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
};

// Authentication middleware
export const protect = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
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
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error('JWT_SECRET environment variable is not set');
      return next(new AppError('Internal server error', 500));
    }

    const decoded = jwt.verify(token, jwtSecret) as DecodedUser;
    
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
  } catch (error) {
    // Log the specific JWT error for debugging
    console.error('JWT verification error:', error);
    return next(new AppError('Invalid token. Please log in again.', 401));
  }
});

// Role-based authorization middleware
export const restrictTo = (...roles: Array<'jobseeker' | 'employer' | 'admin'>) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('You are not logged in! Please log in to get access.', 401));
    }
    
    if (!roles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this action', 403));
    }
    
    next();
  };
};