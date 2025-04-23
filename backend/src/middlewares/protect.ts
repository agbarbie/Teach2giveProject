import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import pool from '../db/db.config';
import { AppError } from './errorMiddlewares';
import dotenv from 'dotenv';
import asyncHandler from './asyncHandlers';
import { RequestWithUser } from '../utils/Types';


//Auth middleware to protect routes 
export const protect = asyncHandler(async (req: RequestWithUser, res: Response, next: NextFunction) => {
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
    const decoded = jwt.verify(token, process.env.JWT_SECRET) as { userId: string };

    // Fetch the user from the database
    const userQuery = await pool.query(
      "SELECT id, email, role FROM users WHERE id = $1",
      [decoded.userId]
    );
    

    if (userQuery.rows.length === 0) {
      return res.status(401).json({ message: "User not found" });
    }

    // Attach the user to the request
    req.user = userQuery.rows[0];

    // Proceed to the next middleware
    next();
  } catch (error) {
    console.error("JWT Error:", error);

    // Handle token expiration or invalid token
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ message: "Token expired, please log in again" });
    } else if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ message: "Invalid token, not authorized" });
    }

    res.status(401).json({ message: "Not authorized, token failed" });
  }
});