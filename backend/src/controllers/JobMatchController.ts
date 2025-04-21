import { Response } from 'express';
import asyncHandler from '../middlewares/asyncHandlers';
import pool from '../db/db.config';
import { AppError } from '../middlewares/errorMiddlewares';
import { formatSuccess, calculateMatchPercentage } from '../utils/helpers';
import { RequestWithUser } from '../utils/Types/index';

// @desc    Get job matches for current user
// @route   GET /api/matches
// @access  Private/JobSeeker
export const getMyMatches = asyncHandler(async (req: RequestWithUser, res: Response) => {
  const userId = req.user?.id;
  const { status, minPercentage } = req.query || {};
  
  let query = `
    SELECT m.*, j.title as job_title, j.location as job_location, 
           j.salary_range, j.job_type, j.experience_level, 
           c.name as company_name, c.logo_url as company_logo
    FROM job_matches m
    JOIN jobs j ON m.job_id = j.id
    JOIN companies c ON j.company_id = c.id
    WHERE m.user_id = $1 AND j.status = 'open'
  `;
  
  const queryParams: any[] = [userId];
  let paramIndex = 2;
  
  // Add status filter if provided
  if (status) {
    query += ` AND m.status = $${paramIndex}`;
    queryParams.push(status);
    paramIndex++;
  }
  
  // Add minimum match percentage filter if provided
  if (minPercentage) {
    const percentage = parseInt(minPercentage as string);
    if (!isNaN(percentage)) {
      query += ` AND m.match_percentage >= $${paramIndex}`;
      queryParams.push(percentage);
      paramIndex++;
    }
  }
  
  query += ` ORDER BY m.match_percentage DESC, j.created_at DESC`;
  
  const result = await pool.query(query, queryParams);

  res.json(formatSuccess(result.rows, 'Job matches retrieved successfully'));
});

// @desc    Calculate job match for a specific job
// @route   GET /api/matches/job/:jobId
// @access  Private/JobSeeker
export const calculateJobMatch = asyncHandler(async (req: RequestWithUser, res: Response) => {
  const userId = req.user?.id;
  const jobId = parseInt(req.params.jobId);

  // Check if job exists
  const jobResult = await pool.query('SELECT * FROM jobs WHERE id = $1', [jobId]);
  
  if (jobResult.rows.length === 0) {
    throw new AppError('Job not found', 404);
  }

  // Get job skills
  const jobSkillsResult = await pool.query(
    'SELECT skill_id, importance_level FROM job_skills WHERE job_id = $1',
    [jobId]
  );

  // Get user skills
  const userSkillsResult = await pool.query(
    'SELECT skill_id, proficiency_level FROM user_skills WHERE user_id = $1',
    [userId]
  );

  // Calculate match percentage
  const matchPercentage = calculateMatchPercentage(
    jobSkillsResult.rows,
    userSkillsResult.rows
  );

  // Check if match already exists
  const existingMatchResult = await pool.query(
    'SELECT * FROM job_matches WHERE job_id = $1 AND user_id = $2',
    [jobId, userId]
  );

  let match;
  
  if (existingMatchResult.rows.length > 0) {
    // Update existing match
    const updateResult = await pool.query(
      `UPDATE job_matches 
       SET match_percentage = $1, updated_at = NOW() 
       WHERE job_id = $2 AND user_id = $3
       RETURNING *`,
      [matchPercentage, jobId, userId]
    );
    match = updateResult.rows[0];
  } else {
    // Create new match
    const insertResult = await pool.query(
      `INSERT INTO job_matches (job_id, user_id, match_percentage, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, NOW(), NOW())
       RETURNING *`,
      [jobId, userId, matchPercentage, 'pending']
    );
    match = insertResult.rows[0];
  }

  // Get job details to return with match
  const jobDetails = await pool.query(
    `SELECT j.*, c.name as company_name, c.logo_url as company_logo
     FROM jobs j
     JOIN companies c ON j.company_id = c.id
     WHERE j.id = $1`,
    [jobId]
  );

  const result = {
    match,
    job: jobDetails.rows[0]
  };

  res.json(formatSuccess(result, 'Job match calculated successfully'));
});

// @desc    Update job match status
// @route   PUT /api/matches/:id/status
// @access  Private/JobSeeker
export const updateMatchStatus = asyncHandler(async (req: RequestWithUser, res: Response) => {
  const matchId = parseInt(req.params.id);
  const userId = req.user?.id;
  const { status } = req.body;

  if (!status) {
    throw new AppError('Status is required', 400);
  }

  const validStatuses = ['pending', 'viewed', 'saved'];
  
  if (!validStatuses.includes(status)) {
    throw new AppError('Invalid status', 400);
  }

  // Check if match exists and belongs to user
  const matchResult = await pool.query(
    'SELECT * FROM job_matches WHERE id = $1',
    [matchId]
  );
  
  if (matchResult.rows.length === 0) {
    throw new AppError('Match not found', 404);
  }

  const match = matchResult.rows[0];
  
  if (match.user_id !== userId) {
    throw new AppError('Not authorized to update this match', 403);
  }

  // Update match status
  const result = await pool.query(
    `UPDATE job_matches 
     SET status = $1, updated_at = NOW() 
     WHERE id = $2 
     RETURNING *`,
    [status, matchId]
  );

  res.json(formatSuccess(result.rows[0], 'Match status updated successfully'));
});

// @desc    Generate matches for all jobs (admin only)
// @route   POST /api/matches/generate
// @access  Private/Admin
export const generateAllMatches = asyncHandler(async (req: RequestWithUser, res: Response) => {
  // Get all open jobs
  const jobsResult = await pool.query('SELECT id FROM jobs WHERE status = $1', ['open']);
  
  // Get all job seekers
  const usersResult = await pool.query('SELECT id FROM users WHERE role = $1', ['jobseeker']);
  
  const jobs = jobsResult.rows;
  const users = usersResult.rows;
  
  const totalMatches = jobs.length * users.length;
  let processedMatches = 0;
  
  // Process each job-user pair
  for (const job of jobs) {
    // Get job skills
    const jobSkillsResult = await pool.query(
      'SELECT skill_id, importance_level FROM job_skills WHERE job_id = $1',
      [job.id]
    );
    
    const jobSkills = jobSkillsResult.rows;
    
    // Skip jobs with no skills
    if (jobSkills.length === 0) {
      processedMatches += users.length;
      continue;
    }
    
    for (const user of users) {
      // Get user skills
      const userSkillsResult = await pool.query(
        'SELECT skill_id, proficiency_level FROM user_skills WHERE user_id = $1',
        [user.id]
      );
      
      const userSkills = userSkillsResult.rows;
      
      // Calculate match percentage
      const matchPercentage = calculateMatchPercentage(jobSkills, userSkills);
      
      // Only create/update match if > 0%
      if (matchPercentage > 0) {
        // Check if match already exists
        const existingMatchResult = await pool.query(
          'SELECT * FROM job_matches WHERE job_id = $1 AND user_id = $2',
          [job.id, user.id]
        );
        
        if (existingMatchResult.rows.length > 0) {
          // Update existing match
          await pool.query(
            `UPDATE job_matches 
             SET match_percentage = $1, updated_at = NOW() 
             WHERE job_id = $2 AND user_id = $3`,
            [matchPercentage, job.id, user.id]
          );
        } else {
          // Create new match
          await pool.query(
            `INSERT INTO job_matches (job_id, user_id, match_percentage, status, created_at, updated_at)
             VALUES ($1, $2, $3, $4, NOW(), NOW())`,
            [job.id, user.id, matchPercentage, 'pending']
          );
        }
      }
      
      processedMatches++;
    }
  }
  
  res.json(formatSuccess({
    totalMatches,
    processedMatches
  }, 'Job matches generated successfully'));
});