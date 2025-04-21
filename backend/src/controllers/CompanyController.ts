import { Response } from 'express';
import asyncHandler from '../middlewares/asyncHandlers';
import pool from '../db/db.config';
import { AppError } from '../middlewares/errorMiddlewares';
import { formatSuccess } from '../utils/helpers';
import { RequestWithUser } from '../utils/Types/index';

// @desc    Get all companies
// @route   GET /api/companies
// @access  Public
export const getAllCompanies = asyncHandler(async (req: RequestWithUser, res: Response) => {
  const result = await pool.query(
    'SELECT * FROM companies ORDER BY name'
  );

  res.json(formatSuccess(result.rows, 'Companies retrieved successfully'));
});

// @desc    Get company by ID
// @route   GET /api/companies/:id
// @access  Public
export const getCompanyById = asyncHandler(async (req: RequestWithUser, res: Response) => {
  const companyId = parseInt(req.params.id);

  const result = await pool.query(
    'SELECT * FROM companies WHERE id = $1',
    [companyId]
  );

  if (result.rows.length === 0) {
    throw new AppError('Company not found', 404);
  }

  res.json(formatSuccess(result.rows[0], 'Company retrieved successfully'));
});

// @desc    Create a company
// @route   POST /api/companies
// @access  Private/Employer
export const createCompany = asyncHandler(async (req: RequestWithUser, res: Response) => {
  const userId = req.user?.id;
  const { name, logo_url, description, industry, website, location, size } = req.body;

  if (!name) {
    throw new AppError('Company name is required', 400);
  }

  // Check if user already has a company
  const existingCompany = await pool.query(
    'SELECT * FROM companies WHERE owner_id = $1',
    [userId]
  );

  if (existingCompany.rows.length > 0) {
    throw new AppError('You already have a registered company', 400);
  }

  // Create company
  const result = await pool.query(
    `INSERT INTO companies 
     (owner_id, name, logo_url, description, industry, website, location, size, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
     RETURNING *`,
    [userId, name, logo_url || null, description || null, industry || null, website || null, location || null, size || null]
  );

  res.status(201).json(formatSuccess(result.rows[0], 'Company created successfully'));
});

// @desc    Update company
// @route   PUT /api/companies/:id
// @access  Private/Owner
export const updateCompany = asyncHandler(async (req: RequestWithUser, res: Response) => {
  const companyId = parseInt(req.params.id);
  const userId = req.user?.id;
  const { name, logo_url, description, industry, website, location, size } = req.body;

  // Check if company exists and user is the owner
  const companyExists = await pool.query(
    'SELECT * FROM companies WHERE id = $1',
    [companyId]
  );
  
  if (companyExists.rows.length === 0) {
    throw new AppError('Company not found', 404);
  }

  const company = companyExists.rows[0];
  
  // Check ownership or admin rights
  if (company.owner_id !== userId && req.user?.role !== 'admin') {
    throw new AppError('Not authorized to update this company', 403);
  }

  // Build the update query dynamically
  let updateFields = [];
  let queryParams = [];
  let paramCounter = 1;

  if (name) {
    updateFields.push(`name = $${paramCounter}`);
    queryParams.push(name);
    paramCounter++;
  }

  if (logo_url !== undefined) {
    updateFields.push(`logo_url = $${paramCounter}`);
    queryParams.push(logo_url);
    paramCounter++;
  }

  if (description !== undefined) {
    updateFields.push(`description = $${paramCounter}`);
    queryParams.push(description);
    paramCounter++;
  }

  if (industry !== undefined) {
    updateFields.push(`industry = $${paramCounter}`);
    queryParams.push(industry);
    paramCounter++;
  }

  if (website !== undefined) {
    updateFields.push(`website = $${paramCounter}`);
    queryParams.push(website);
    paramCounter++;
  }

  if (location !== undefined) {
    updateFields.push(`location = $${paramCounter}`);
    queryParams.push(location);
    paramCounter++;
  }

  if (size !== undefined) {
    updateFields.push(`size = $${paramCounter}`);
    queryParams.push(size);
    paramCounter++;
  }

  // Add updated_at timestamp
  updateFields.push(`updated_at = NOW()`);

  // If no fields to update, return early
  if (updateFields.length === 0) {
    throw new AppError('No fields to update', 400);
  }

  // Build and execute the query
  const updateQuery = `
    UPDATE companies 
    SET ${updateFields.join(', ')} 
    WHERE id = $${paramCounter} 
    RETURNING *
  `;
  queryParams.push(companyId);

  const result = await pool.query(updateQuery, queryParams);
  const updatedCompany = result.rows[0];

  res.json(formatSuccess(updatedCompany, 'Company updated successfully'));
});

// @desc    Delete company
// @route   DELETE /api/companies/:id
// @access  Private/Owner
export const deleteCompany = asyncHandler(async (req: RequestWithUser, res: Response) => {
  const companyId = parseInt(req.params.id);
  const userId = req.user?.id;

  // Check if company exists and user is the owner
  const companyExists = await pool.query(
    'SELECT * FROM companies WHERE id = $1',
    [companyId]
  );
  
  if (companyExists.rows.length === 0) {
    throw new AppError('Company not found', 404);
  }

  const company = companyExists.rows[0];
  
  // Check ownership or admin rights
  if (company.owner_id !== userId && req.user?.role !== 'admin') {
    throw new AppError('Not authorized to delete this company', 403);
  }

  // Use a transaction to delete company and related data
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Delete related data (jobs, applications, etc.)
    // Get all jobs first
    const jobsResult = await client.query('SELECT id FROM jobs WHERE company_id = $1', [companyId]);
    const jobIds = jobsResult.rows.map(job => job.id);

    // For each job, delete related data
    for (const jobId of jobIds) {
      // Delete job skills
      await client.query('DELETE FROM job_skills WHERE job_id = $1', [jobId]);
      
      // Delete job matches
      await client.query('DELETE FROM job_matches WHERE job_id = $1', [jobId]);
      
      // Get applications for this job
      const applicationsResult = await client.query(
        'SELECT id FROM applications WHERE job_id = $1', 
        [jobId]
      );
      
      // Delete interview requests for each application
      for (const app of applicationsResult.rows) {
        await client.query('DELETE FROM interview_requests WHERE application_id = $1', [app.id]);
      }
      
      // Delete applications
      await client.query('DELETE FROM applications WHERE job_id = $1', [jobId]);
    }
    
    // Delete all jobs
    await client.query('DELETE FROM jobs WHERE company_id = $1', [companyId]);
    
    // Finally delete the company
    await client.query('DELETE FROM companies WHERE id = $1', [companyId]);
    
    await client.query('COMMIT');
    
    res.json(formatSuccess(null, 'Company deleted successfully'));
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
});

// @desc    Get company jobs
// @route   GET /api/companies/:id/jobs
// @access  Public
export const getCompanyJobs = asyncHandler(async (req: RequestWithUser, res: Response) => {
  const companyId = parseInt(req.params.id);

  // Verify company exists
  const companyExists = await pool.query(
    'SELECT * FROM companies WHERE id = $1',
    [companyId]
  );
  
  if (companyExists.rows.length === 0) {
    throw new AppError('Company not found', 404);
  }

  // Get all jobs for this company
  const result = await pool.query(
    'SELECT * FROM jobs WHERE company_id = $1 ORDER BY created_at DESC',
    [companyId]
  );

  res.json(formatSuccess(result.rows, 'Company jobs retrieved successfully'));
});