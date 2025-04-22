import { Request, Response } from 'express';
import asyncHandler from '../middlewares/asyncHandlers';
import pool from '../db/db.config';
import { AppError } from '../middlewares/errorMiddlewares';
import { formatSuccess } from '../utils/helpers';
import { RequestWithUser } from '../utils/Types/index';

// @desc    Get all jobs
// @route   GET /api/jobs
// @access  Public
export const getAllJobs = asyncHandler(async (req: Request, res: Response) => {
  const { status, location, title, company } = req.query;
  
  let query = `
    SELECT j.*, c.name as company_name 
    FROM jobs j
    JOIN companies c ON j.company_id = c.company_id
    WHERE 1=1
  `;
  
  const queryParams: any[] = [];
  let paramIndex = 1;
  
  // Add filters if provided
  if (status) {
    query += ` AND j.status = $${paramIndex}`;
    queryParams.push(status);
    paramIndex++;
  } else {
    // Default to only showing open jobs
    query += ` AND j.status = 'open'`;
  }
  
  if (location) {
    query += ` AND LOWER(j.location) LIKE LOWER($${paramIndex})`;
    queryParams.push(`%${location}%`);
    paramIndex++;
  }
  
  if (title) {
    query += ` AND LOWER(j.title) LIKE LOWER($${paramIndex})`;
    queryParams.push(`%${title}%`);
    paramIndex++;
  }
  
  if (company) {
    query += ` AND LOWER(c.name) LIKE LOWER($${paramIndex})`;
    queryParams.push(`%${company}%`);
    paramIndex++;
  }
  
  query += ` ORDER BY j.created_at DESC`;
  
  const result = await pool.query(query, queryParams);

  res.json(formatSuccess(result.rows, 'Jobs retrieved successfully'));
});

// @desc    Get job by ID
// @route   GET /api/jobs/:id
// @access  Public
export const getJobById = asyncHandler(async (req: Request, res: Response) => {
  const jobId = parseInt(req.params.id);

  const jobResult = await pool.query(
    `SELECT j.*, c.name as company_name 
     FROM jobs j
     JOIN companies c ON j.company_id = c.company_id
     WHERE j.id = $1`,
    [jobId]
  );

  if (jobResult.rows.length === 0) {
    throw new AppError('Job not found', 404);
  }

  const job = jobResult.rows[0];

  // Get required skills for the job
  const skillsResult = await pool.query(
    `SELECT js.skill_id, js.importance_level, s.name, s.category
     FROM job_skills js
     JOIN skills s ON js.skill_id = s.id
     WHERE js.job_id = $1
     ORDER BY js.importance_level, s.name`,
    [jobId]
  );

  const jobWithSkills = {
    ...job,
    skills: skillsResult.rows
  };

  res.json(formatSuccess(jobWithSkills, 'Job retrieved successfully'));
});

// @desc    Create job
// @route   POST /api/jobs
// @access  Private/Employer
export const createJob = asyncHandler(async (req: RequestWithUser, res: Response) => {
  const userId = req.user?.id;
  const { 
    company_id, title, description, requirements, location, 
    salary_range, job_type, experience_level, skills 
  } = req.body;

  if (!company_id || !title || !description || !location || !job_type) {
    throw new AppError('Please provide all required fields', 400);
  }

  const companyResult = await pool.query(
    'SELECT * FROM companies WHERE company_id = $1',
    [company_id]
  );
  
  if (companyResult.rows.length === 0) {
    throw new AppError('Company not found', 404);
  }

  const company = companyResult.rows[0];
  
  if (company.owner_id !== userId) {
    throw new AppError('Not authorized to create a job for this company', 403);
  }

  // Use a transaction to create job and skills
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Create job
    const jobResult = await client.query(
      `INSERT INTO jobs 
       (company_id, title, description, requirements, location, salary_range, job_type, experience_level, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
       RETURNING *`,
      [
        company_id, title, description, requirements || '', location, 
        salary_range || null, job_type, experience_level || null, 'open'
      ]
    );

    const newJob = jobResult.rows[0];

    // Add skills if provided
    if (skills && Array.isArray(skills) && skills.length > 0) {
      for (const skill of skills) {
        await client.query(
          `INSERT INTO job_skills (job_id, skill_id, importance_level, created_at)
           VALUES ($1, $2, $3, NOW())`,
          [newJob.id, skill.skill_id, skill.importance_level || 'preferred']
        );
      }
    }

    await client.query('COMMIT');

    const fullJobResult = await pool.query(
      `SELECT j.*, c.name as company_name 
       FROM jobs j
       JOIN companies c ON j.company_id = c.company_id
       WHERE j.id = $1`,
      [newJob.id]
    );

    const skillsResult = await pool.query(
      `SELECT js.skill_id, js.importance_level, s.name, s.category
       FROM job_skills js
       JOIN skills s ON js.skill_id = s.id
       WHERE js.job_id = $1
       ORDER BY js.importance_level, s.name`,
      [newJob.id]
    );

    const jobWithSkills = {
      ...fullJobResult.rows[0],
      skills: skillsResult.rows
    };

    res.status(201).json(formatSuccess(jobWithSkills, 'Job created successfully'));
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
});

// @desc    Update job
// @route   PUT /api/jobs/:id
// @access  Private/Employer
export const updateJob = asyncHandler(async (req: RequestWithUser, res: Response) => {
  const jobId = parseInt(req.params.id);
  const userId = req.user?.id;
  const { 
    title, description, requirements, location, 
    salary_range, job_type, experience_level, status, skills 
  } = req.body;

  const jobResult = await pool.query(
    `SELECT j.*, c.owner_id 
     FROM jobs j
     JOIN companies c ON j.company_id = c.company_id
     WHERE j.id = $1`,
    [jobId]
  );
  
  if (jobResult.rows.length === 0) {
    throw new AppError('Job not found', 404);
  }

  const job = jobResult.rows[0];
  
  // Check ownership or admin rights
  if (job.owner_id !== userId && req.user?.role !== 'admin') {
    throw new AppError('Not authorized to update this job', 403);
  }

  // Use a transaction for updating job and skills
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Build job update query
    let updateFields = [];
    let queryParams = [];
    let paramCounter = 1;

    if (title) {
      updateFields.push(`title = $${paramCounter}`);
      queryParams.push(title);
      paramCounter++;
    }

    if (description) {
      updateFields.push(`description = $${paramCounter}`);
      queryParams.push(description);
      paramCounter++;
    }

    if (requirements !== undefined) {
      updateFields.push(`requirements = $${paramCounter}`);
      queryParams.push(requirements);
      paramCounter++;
    }

    if (location) {
      updateFields.push(`location = $${paramCounter}`);
      queryParams.push(location);
      paramCounter++;
    }

    if (salary_range !== undefined) {
      updateFields.push(`salary_range = $${paramCounter}`);
      queryParams.push(salary_range);
      paramCounter++;
    }

    if (job_type) {
      updateFields.push(`job_type = $${paramCounter}`);
      queryParams.push(job_type);
      paramCounter++;
    }

    if (experience_level !== undefined) {
      updateFields.push(`experience_level = $${paramCounter}`);
      queryParams.push(experience_level);
      paramCounter++;
    }

    if (status) {
      updateFields.push(`status = $${paramCounter}`);
      queryParams.push(status);
      paramCounter++;
    }

    // Add updated_at timestamp
    updateFields.push(`updated_at = NOW()`);

    // If we have fields to update, execute the job update
    if (updateFields.length > 0) {
      const updateQuery = `
        UPDATE jobs 
        SET ${updateFields.join(', ')} 
        WHERE id = $${paramCounter} 
        RETURNING *
      `;
      queryParams.push(jobId);

      await client.query(updateQuery, queryParams);
    }

    // Update skills if provided
    if (skills && Array.isArray(skills)) {
      // Remove existing skills
      await client.query('DELETE FROM job_skills WHERE job_id = $1', [jobId]);
      
      // Add new skills
      for (const skill of skills) {
        await client.query(
          `INSERT INTO job_skills (job_id, skill_id, importance_level, created_at)
           VALUES ($1, $2, $3, NOW())`,
          [jobId, skill.skill_id, skill.importance_level || 'preferred']
        );
      }
    }

    await client.query('COMMIT');

    const updatedJobResult = await pool.query(
      `SELECT j.*, c.name as company_name 
       FROM jobs j
       JOIN companies c ON j.company_id = c.company_id
       WHERE j.id = $1`,
      [jobId]
    );

    const skillsResult = await pool.query(
      `SELECT js.skill_id, js.importance_level, s.name, s.category
       FROM job_skills js
       JOIN skills s ON js.skill_id = s.id
       WHERE js.job_id = $1
       ORDER BY js.importance_level, s.name`,
      [jobId]
    );

    const jobWithSkills = {
      ...updatedJobResult.rows[0],
      skills: skillsResult.rows
    };

    res.json(formatSuccess(jobWithSkills, 'Job updated successfully'));
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
});

// @desc    Delete job
// @route   DELETE /api/jobs/:id
// @access  Private/Employer
export const deleteJob = asyncHandler(async (req: RequestWithUser, res: Response) => {
  const jobId = parseInt(req.params.id);
  const userId = req.user?.id;

  const jobResult = await pool.query(
    `SELECT j.*, c.owner_id 
     FROM jobs j
     JOIN companies c ON j.company_id = c.company_id
     WHERE j.id = $1`,
    [jobId]
  );
  
  if (jobResult.rows.length === 0) {
    throw new AppError('Job not found', 404);
  }

  const job = jobResult.rows[0];
  
  // Check ownership or admin rights
  if (job.owner_id !== userId && req.user?.role !== 'admin') {
    throw new AppError('Not authorized to delete this job', 403);
  }

  // Use a transaction to delete job and related data
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

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
    
    // Finally delete the job
    await client.query('DELETE FROM jobs WHERE id = $1', [jobId]);
    
    await client.query('COMMIT');
    
    res.json(formatSuccess(null, 'Job deleted successfully'));
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
});

// @desc    Add skill to job
// @route   POST /api/jobs/:id/skills
// @access  Private/Employer
export const addJobSkill = asyncHandler(async (req: RequestWithUser, res: Response) => {
  const jobId = parseInt(req.params.id);
  const userId = req.user?.id;
  const { skill_id, importance_level } = req.body;

  if (!skill_id) {
    throw new AppError('Skill ID is required', 400);
  }

  const jobResult = await pool.query(
    `SELECT j.*, c.owner_id 
     FROM jobs j
     JOIN companies c ON j.company_id = c.company_id
     WHERE j.id = $1`,
    [jobId]
  );
  
  if (jobResult.rows.length === 0) {
    throw new AppError('Job not found', 404);
  }

  const job = jobResult.rows[0];
  
  // Check ownership or admin rights
  if (job.owner_id !== userId && req.user?.role !== 'admin') {
    throw new AppError('Not authorized to update this job', 403);
  }

  // Check if skill exists
  const skillExists = await pool.query('SELECT * FROM skills WHERE id = $1', [skill_id]);
  
  if (skillExists.rows.length === 0) {
    throw new AppError('Skill not found', 404);
  }

  // Check if job already has this skill
  const jobSkillExists = await pool.query(
    'SELECT * FROM job_skills WHERE job_id = $1 AND skill_id = $2',
    [jobId, skill_id]
  );
  
  if (jobSkillExists.rows.length > 0) {
    throw new AppError('This skill is already added to the job', 400);
  }

  // Add skill to job
  const result = await pool.query(
    `INSERT INTO job_skills (job_id, skill_id, importance_level, created_at)
     VALUES ($1, $2, $3, NOW())
     RETURNING *`,
    [jobId, skill_id, importance_level || 'preferred']
  );

  res.status(201).json(formatSuccess(result.rows[0], 'Skill added to job successfully'));
});

// @desc    Remove skill from job
// @route   DELETE /api/jobs/:id/skills/:skillId
// @access  Private/Employer
export const removeJobSkill = asyncHandler(async (req: RequestWithUser, res: Response) => {
  const jobId = parseInt(req.params.id);
  const skillId = parseInt(req.params.skillId);
  const userId = req.user?.id;

  const jobResult = await pool.query(
    `SELECT j.*, c.owner_id 
     FROM jobs j
     JOIN companies c ON j.company_id = c.company_id
     WHERE j.id = $1`,
    [jobId]
  );
  
  if (jobResult.rows.length === 0) {
    throw new AppError('Job not found', 404);
  }

  const job = jobResult.rows[0];
  
  // Check ownership or admin rights
  if (job.owner_id !== userId && req.user?.role !== 'admin') {
    throw new AppError('Not authorized to update this job', 403);
  }

  // Check if this skill is associated with the job
  const jobSkillExists = await pool.query(
    'SELECT * FROM job_skills WHERE job_id = $1 AND skill_id = $2',
    [jobId, skillId]
  );
  
  if (jobSkillExists.rows.length === 0) {
    throw new AppError('This skill is not associated with the job', 404);
  }

  // Remove skill from job
  await pool.query(
    'DELETE FROM job_skills WHERE job_id = $1 AND skill_id = $2',
    [jobId, skillId]
  );

  res.json(formatSuccess(null, 'Skill removed from job successfully'));
});