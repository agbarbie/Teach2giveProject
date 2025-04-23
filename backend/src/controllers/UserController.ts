import { Request, Response } from 'express';
import asyncHandler from '../middlewares/asyncHandlers';
import pool from '../db/db.config';
import { AppError } from '../middlewares/errorMiddlewares';
import { formatSuccess } from '../utils/helpers';
import { RequestWithUser } from '../middlewares/protect';

// @desc    Get current logged-in user
// @route   GET /api/users/me
// @access  Private
export const getCurrentUser = asyncHandler(async (req: RequestWithUser, res: Response) => {
  if (!req.user || !req.user.id) {
    throw new AppError('User not found', 404);
  }

  const result = await pool.query(
    'SELECT id, email, role, created_at, updated_at FROM users WHERE id = $1',
    [req.user.id]
  );

  if (result.rows.length === 0) {
    throw new AppError('User not found', 404);
  }

  res.json(formatSuccess(result.rows[0], 'Current user retrieved successfully'));
});

// @desc    Get all users (admin only)
// @route   GET /api/users
// @access  Private/Admin
export const getAllUsers = asyncHandler(async (req: Request, res: Response) => {
  const result = await pool.query(
    'SELECT id, email, role, created_at, updated_at FROM users ORDER BY id'
  );

  res.json(formatSuccess(result.rows, 'Users retrieved successfully'));
});

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private/Admin or Own User
export const getUserById = asyncHandler(async (req: RequestWithUser, res: Response) => {
  const userId = parseInt(req.params.id);
  
  // Security check - users can only access their own data unless they're admins
  if (req.user?.id !== userId && req.user?.role !== 'admin') {
    throw new AppError('Not authorized to access this resource', 403);
  }

  const result = await pool.query(
    'SELECT id, email, role, created_at, updated_at FROM users WHERE id = $1',
    [userId]
  );

  if (result.rows.length === 0) {
    throw new AppError('User not found', 404);
  }

  const user = result.rows[0];

  res.json(formatSuccess(user, 'User retrieved successfully'));
});

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private/Admin or Own User
export const updateUser = asyncHandler(async (req: RequestWithUser, res: Response) => {
  const userId = parseInt(req.params.id);
  const { email, role } = req.body;

  // Security check - users can only update their own data unless they're admins
  if (req.user?.id !== userId && req.user?.role !== 'admin') {
    throw new AppError('Not authorized to update this resource', 403);
  }

  // Only admins can change roles
  if (role && req.user?.role !== 'admin') {
    throw new AppError('Not authorized to change role', 403);
  }

  // Check if user exists
  const userExists = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
  
  if (userExists.rows.length === 0) {
    throw new AppError('User not found', 404);
  }

  // Check if email is already taken by another user
  if (email) {
    const emailExists = await pool.query(
      'SELECT * FROM users WHERE email = $1 AND id != $2', 
      [email, userId]
    );
    
    if (emailExists.rows.length > 0) {
      throw new AppError('Email is already taken', 400);
    }
  }

  // Build the update query dynamically based on provided fields
  let updateFields = [];
  let queryParams = [];
  let paramCounter = 1;

  if (email) {
    updateFields.push(`email = $${paramCounter}`);
    queryParams.push(email);
    paramCounter++;
  }

  if (role) {
    updateFields.push(`role = $${paramCounter}`);
    queryParams.push(role);
    paramCounter++;
  }

  // Add updated_at timestamp
  updateFields.push(`updated_at = NOW()`);

  // If no fields to update, return early
  if (updateFields.length === 0 || (updateFields.length === 1 && updateFields[0].includes('updated_at'))) {
    throw new AppError('No fields to update', 400);
  }

  // Build and execute the query
  const updateQuery = `
    UPDATE users 
    SET ${updateFields.join(', ')} 
    WHERE id = $${paramCounter} 
    RETURNING id, email, role, created_at, updated_at
  `;
  queryParams.push(userId);

  const result = await pool.query(updateQuery, queryParams);
  const updatedUser = result.rows[0];

  res.json(formatSuccess(updatedUser, 'User updated successfully'));
});

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin or Own User
export const deleteUser = asyncHandler(async (req: RequestWithUser, res: Response) => {
  const userId = parseInt(req.params.id);

  // Security check - users can only delete their own account unless they're admins
  if (req.user?.id !== userId && req.user?.role !== 'admin') {
    throw new AppError('Not authorized to delete this resource', 403);
  }

  // Check if user exists
  const userExists = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
  
  if (userExists.rows.length === 0) {
    throw new AppError('User not found', 404);
  }

  // Use a transaction to delete user and related data
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Delete related data first (due to foreign key constraints)
    await client.query('DELETE FROM jobseeker_profiles WHERE user_id = $1', [userId]);
    await client.query('DELETE FROM user_skills WHERE user_id = $1', [userId]);
    await client.query('DELETE FROM job_matches WHERE user_id = $1', [userId]);
    await client.query('DELETE FROM applications WHERE user_id = $1', [userId]);
    
    // Delete companies owned by this user (if employer)
    if (userExists.rows[0].role === 'employer') {
      await client.query('DELETE FROM companies WHERE owner_id = $1', [userId]);
    }
    
    // Finally delete the user
    await client.query('DELETE FROM users WHERE id = $1', [userId]);
    
    await client.query('COMMIT');
    
    res.json(formatSuccess(null, 'User deleted successfully'));
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
});

// @desc    Get user skills
// @route   GET /api/users/:id/skills
// @access  Private/Admin or Own User
export const getUserSkills = asyncHandler(async (req: RequestWithUser, res: Response) => {
  const userId = parseInt(req.params.id);
  
  // Security check
  if (req.user?.id !== userId && req.user?.role !== 'admin') {
    throw new AppError('Not authorized to access this resource', 403);
  }

  const result = await pool.query(
    `SELECT us.id, us.user_id, us.skill_id, us.proficiency_level, us.years_experience, us.created_at,
            s.name as skill_name, s.category 
     FROM user_skills us
     JOIN skills s ON us.skill_id = s.id
     WHERE us.user_id = $1
     ORDER BY s.category, s.name`,
    [userId]
  );

  res.json(formatSuccess(result.rows, 'User skills retrieved successfully'));
});