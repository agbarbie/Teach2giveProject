import { Request, Response } from 'express';
import asyncHandler from '../middlewares/asyncHandlers';
import pool from '../db/db.config';
import { AppError } from '../middlewares/errorMiddlewares';
import { hashPassword, comparePassword, generateToken, formatSuccess } from '../utils/helpers';

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const register = asyncHandler(async (req: Request, res: Response) => {
  const { email, password, role } = req.body;

  if (!email || !password) {
    throw new AppError('Please provide email and password', 400);
  }

  // Check if email already exists
  const userExists = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  
  if (userExists.rows.length > 0) {
    throw new AppError('User already exists', 400);
  }

  // Validate role
  const validRoles = ['jobseeker', 'employer', 'admin'];
  const userRole = role || 'jobseeker'; // Default to jobseeker
  
  if (!validRoles.includes(userRole)) {
    throw new AppError('Invalid role', 400);
  }

  // Hash password
  const hashedPassword = await hashPassword(password);

  // Create user
  const result = await pool.query(
    'INSERT INTO users (email, password, role, created_at, updated_at) VALUES ($1, $2, $3, NOW(), NOW()) RETURNING id, email, role, created_at',
    [email, hashedPassword, userRole]
  );

  const newUser = result.rows[0];

  // Create profile based on role
  if (userRole === 'jobseeker') {
    await pool.query(
      'INSERT INTO jobseeker_profiles (user_id, full_name, created_at, updated_at) VALUES ($1, $2, NOW(), NOW())',
      [newUser.id, '']
    );
  }

  // Generate token
  const token = generateToken(newUser);

  res.status(201).json(formatSuccess({
    id: newUser.id,
    email: newUser.email,
    role: newUser.role,
    token
  }, 'User registered successfully'));
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new AppError('Please provide email and password', 400);
  }

  // Find user
  const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  
  if (result.rows.length === 0) {
    throw new AppError('Invalid credentials', 401);
  }

  const user = result.rows[0];

  // Check password
  const isPasswordValid = await comparePassword(password, user.password);
  
  if (!isPasswordValid) {
    throw new AppError('Invalid credentials', 401);
  }

  // Generate token
  const token = generateToken(user);

  res.json(formatSuccess({
    id: user.id,
    email: user.email,
    role: user.role,
    token
  }, 'Login successful'));
});

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
export const getCurrentUser = asyncHandler(async (req: any, res: Response) => {
  const userId = req.user.id;

  const result = await pool.query(
    'SELECT id, email, role, created_at FROM users WHERE id = $1',
    [userId]
  );

  if (result.rows.length === 0) {
    throw new AppError('User not found', 404);
  }

  res.json(formatSuccess(result.rows[0], 'Current user retrieved successfully'));
});

// @desc    Change password
// @route   PUT /api/auth/password
// @access  Private
export const changePassword = asyncHandler(async (req: any, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user.id;

  if (!currentPassword || !newPassword) {
    throw new AppError('Please provide current and new password', 400);
  }

  // Get current user with password
  const result = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
  
  if (result.rows.length === 0) {
    throw new AppError('User not found', 404);
  }

  const user = result.rows[0];

  // Verify current password
  const isPasswordValid = await comparePassword(currentPassword, user.password);
  
  if (!isPasswordValid) {
    throw new AppError('Current password is incorrect', 401);
  }

  // Hash new password
  const hashedPassword = await hashPassword(newPassword);

  // Update password
  await pool.query(
    'UPDATE users SET password = $1, updated_at = NOW() WHERE id = $2',
    [hashedPassword, userId]
  );

  res.json(formatSuccess(null, 'Password updated successfully'));
});