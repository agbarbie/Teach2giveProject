import { Request, Response } from 'express';
import asyncHandler from '../middlewares/asyncHandlers';
import pool from '../db/db.config';
import { AppError } from '../middlewares/errorMiddlewares';
import { formatSuccess } from '../utils/helpers';
import { RequestWithUser } from '../utils/Types/index';

// @desc    Get user's certificates
// @route   GET /api/users/certificates
// @access  Private (Jobseeker)
export const getUserCertificates = asyncHandler(async (req: RequestWithUser, res: Response) => {
  const userId = req.user?.id;

  const result = await pool.query(
    `SELECT * FROM user_certificates
     WHERE user_id = $1
     ORDER BY issue_date DESC`,
    [userId]
  );

  res.json(formatSuccess(result.rows, 'User certificates retrieved successfully'));
});

// @desc    Add certificate to user profile
// @route   POST /api/users/certificates
// @access  Private (Jobseeker)
export const addUserCertificate = asyncHandler(async (req: RequestWithUser, res: Response) => {
  const userId = req.user?.id;
  const { 
    title, 
    issuer, 
    issue_date, 
    expiry_date, 
    credential_id, 
    credential_url 
  } = req.body;

  // Validate input
  if (!title || !issuer || !issue_date) {
    throw new AppError('Title, issuer and issue date are required', 400);
  }

  // Add certificate to user profile
  const result = await pool.query(
    `INSERT INTO user_certificates 
     (user_id, title, issuer, issue_date, expiry_date, credential_id, credential_url, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
     RETURNING *`,
    [
      userId, 
      title, 
      issuer, 
      issue_date,
      expiry_date || null,
      credential_id || null,
      credential_url || null
    ]
  );

  res.status(201).json(formatSuccess(result.rows[0], 'Certificate added to profile successfully'));
});

// @desc    Update user certificate
// @route   PUT /api/users/certificates/:id
// @access  Private (Jobseeker)
export const updateUserCertificate = asyncHandler(async (req: RequestWithUser, res: Response) => {
  const userId = req.user?.id;
  const certificateId = parseInt(req.params.id);
  const { 
    title, 
    issuer, 
    issue_date, 
    expiry_date, 
    credential_id, 
    credential_url 
  } = req.body;

  // Check if certificate exists and belongs to the user
  const certificateExists = await pool.query(
    'SELECT * FROM user_certificates WHERE id = $1 AND user_id = $2',
    [certificateId, userId]
  );

  if (certificateExists.rows.length === 0) {
    throw new AppError('Certificate not found in your profile or you do not have permission', 404);
  }

  // Update fields
  const updateFields = [];
  const queryParams = [];
  let paramCounter = 1;

  if (title !== undefined) {
    updateFields.push(`title = $${paramCounter}`);
    queryParams.push(title);
    paramCounter++;
  }

  if (issuer !== undefined) {
    updateFields.push(`issuer = $${paramCounter}`);
    queryParams.push(issuer);
    paramCounter++;
  }

  if (issue_date !== undefined) {
    updateFields.push(`issue_date = $${paramCounter}`);
    queryParams.push(issue_date);
    paramCounter++;
  }

  if (expiry_date !== undefined) {
    updateFields.push(`expiry_date = $${paramCounter}`);
    queryParams.push(expiry_date);
    paramCounter++;
  }

  if (credential_id !== undefined) {
    updateFields.push(`credential_id = $${paramCounter}`);
    queryParams.push(credential_id);
    paramCounter++;
  }

  if (credential_url !== undefined) {
    updateFields.push(`credential_url = $${paramCounter}`);
    queryParams.push(credential_url);
    paramCounter++;
  }

  // Add updated_at and certificate ID
  updateFields.push(`updated_at = NOW()`);
  queryParams.push(certificateId);

  // Update the certificate
  const updateQuery = `
    UPDATE user_certificates 
    SET ${updateFields.join(', ')} 
    WHERE id = $${paramCounter} 
    RETURNING *
  `;

  const result = await pool.query(updateQuery, queryParams);

  res.json(formatSuccess(result.rows[0], 'Certificate updated successfully'));
});

// @desc    Delete user certificate
// @route   DELETE /api/users/certificates/:id
// @access  Private (Jobseeker)
export const deleteUserCertificate = asyncHandler(async (req: RequestWithUser, res: Response) => {
  const userId = req.user?.id;
  const certificateId = parseInt(req.params.id);

  // Check if certificate exists and belongs to the user
  const certificateExists = await pool.query(
    'SELECT * FROM user_certificates WHERE id = $1 AND user_id = $2',
    [certificateId, userId]
  );

  if (certificateExists.rows.length === 0) {
    throw new AppError('Certificate not found in your profile or you do not have permission', 404);
  }

  // Delete the certificate
  await pool.query('DELETE FROM user_certificates WHERE id = $1', [certificateId]);

  res.json(formatSuccess(null, 'Certificate removed from profile successfully'));
});

// @desc    Get jobseeker's certificates by user ID (for employers to view)
// @route   GET /api/users/:id/certificates
// @access  Public
export const getJobseekerCertificatesByUserId = asyncHandler(async (req: Request, res: Response) => {
  const jobseekerId = parseInt(req.params.id);

  // Check if user exists and is a jobseeker
  const userExists = await pool.query(
    'SELECT * FROM users WHERE id = $1 AND role = $2',
    [jobseekerId, 'jobseeker']
  );

  if (userExists.rows.length === 0) {
    throw new AppError('Jobseeker not found', 404);
  }

  const result = await pool.query(
    `SELECT id, title, issuer, issue_date, expiry_date, credential_id, credential_url
     FROM user_certificates
     WHERE user_id = $1
     ORDER BY issue_date DESC`,
    [jobseekerId]
  );

  res.json(formatSuccess(result.rows, 'Jobseeker certificates retrieved successfully'));
});