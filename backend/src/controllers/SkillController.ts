import { Request, Response } from 'express';
import asyncHandler from '../middlewares/asyncHandlers';
import pool from '../db/db.config';
import { AppError } from '../middlewares/errorMiddlewares';
import { formatSuccess } from '../utils/helpers';
import { RequestWithUser } from '../utils/Types/index';

// @desc    Get all skills (for dropdown, available to all)
// @route   GET /api/skills
// @access  Public
export const getAllSkills = asyncHandler(async (req: Request, res: Response) => {
  const { category } = req.query;
  
  let query = 'SELECT * FROM skills';
  const queryParams: any[] = [];
  
  if (category) {
    query += ' WHERE LOWER(category) = LOWER($1)';
    queryParams.push(category);
  }
  
  query += ' ORDER BY category, skill_name';
  
  const result = await pool.query(query, queryParams);

  res.json(formatSuccess(result.rows, 'Skills retrieved successfully'));
});

// @desc    Get skill by ID
// @route   GET /api/skills/:id
// @access  Public
export const getSkillById = asyncHandler(async (req: Request, res: Response) => {
  const skillId = parseInt(req.params.id);

  const result = await pool.query(
    'SELECT * FROM skills WHERE id = $1',
    [skillId]
  );

  if (result.rows.length === 0) {
    throw new AppError('Skill not found', 404);
  }

  res.json(formatSuccess(result.rows[0], 'Skill retrieved successfully'));
});

// @desc    Get all skill categories
// @route   GET /api/skills/categories
// @access  Public
export const getSkillCategories = asyncHandler(async (req: Request, res: Response) => {
  const result = await pool.query(
    'SELECT DISTINCT category FROM skills ORDER BY category'
  );

  const categories = result.rows.map(row => row.category);

  res.json(formatSuccess(categories, 'Skill categories retrieved successfully'));
});

// @desc    Get user's skills
// @route   GET /api/users/skills
// @access  Private (Jobseeker)
export const getUserSkills = asyncHandler(async (req: RequestWithUser, res: Response) => {
  const userId = req.user?.id;

  const result = await pool.query(
    `SELECT us.id, us.user_id, us.skill_id, us.proficiency_level, 
            us.years_experience, us.created_at, us.updated_at,
            s.skill_name, s.category
     FROM user_skills us
     JOIN skills s ON us.skill_id = s.id
     WHERE us.user_id = $1
     ORDER BY s.category, s.skill_name`,
    [userId]
  );

  res.json(formatSuccess(result.rows, 'User skills retrieved successfully'));
});

// @desc    Add skill to user profile
// @route   POST /api/users/skills
// @access  Private (Jobseeker)
export const addUserSkill = asyncHandler(async (req: RequestWithUser, res: Response) => {
  const userId = req.user?.id;
  const { skill_id, proficiency_level, years_experience } = req.body;

  // Validate input
  if (!skill_id) {
    throw new AppError('Skill ID is required', 400);
  }

  // Check if user already has this skill
  const existingSkill = await pool.query(
    'SELECT * FROM user_skills WHERE user_id = $1 AND skill_id = $2',
    [userId, skill_id]
  );

  if (existingSkill.rows.length > 0) {
    throw new AppError('You already have this skill in your profile', 400);
  }

  // Check if skill exists
  const skillExists = await pool.query(
    'SELECT * FROM skills WHERE id = $1',
    [skill_id]
  );

  if (skillExists.rows.length === 0) {
    throw new AppError('Skill not found', 404);
  }

  // Add skill to user profile
  const result = await pool.query(
    `INSERT INTO user_skills 
     (user_id, skill_id, proficiency_level, years_experience, created_at, updated_at)
     VALUES ($1, $2, $3, $4, NOW(), NOW())
     RETURNING *`,
    [
      userId, 
      skill_id, 
      proficiency_level || 'beginner', 
      years_experience || 0
    ]
  );

  // Get full skill details for response
  const fullSkillResult = await pool.query(
    `SELECT us.id, us.user_id, us.skill_id, us.proficiency_level, 
            us.years_experience, us.created_at, us.updated_at,
            s.skill_name, s.category
     FROM user_skills us
     JOIN skills s ON us.skill_id = s.id
     WHERE us.id = $1`,
    [result.rows[0].id]
  );

  res.status(201).json(formatSuccess(fullSkillResult.rows[0], 'Skill added to profile successfully'));
});

// @desc    Update user skill
// @route   PUT /api/users/skills/:id
// @access  Private (Jobseeker)
export const updateUserSkill = asyncHandler(async (req: RequestWithUser, res: Response) => {
  const userId = req.user?.id;
  const userSkillId = parseInt(req.params.id);
  const { proficiency_level, years_experience } = req.body;

  // Check if user skill exists and belongs to the user
  const userSkillExists = await pool.query(
    'SELECT * FROM user_skills WHERE id = $1 AND user_id = $2',
    [userSkillId, userId]
  );

  if (userSkillExists.rows.length === 0) {
    throw new AppError('Skill not found in your profile or you do not have permission', 404);
  }

  // Update fields
  const updateFields = [];
  const queryParams = [];
  let paramCounter = 1;

  if (proficiency_level !== undefined) {
    updateFields.push(`proficiency_level = $${paramCounter}`);
    queryParams.push(proficiency_level);
    paramCounter++;
  }

  if (years_experience !== undefined) {
    updateFields.push(`years_experience = $${paramCounter}`);
    queryParams.push(years_experience);
    paramCounter++;
  }

  // Add updated_at and user skill ID
  updateFields.push(`updated_at = NOW()`);
  queryParams.push(userSkillId);

  // Update the user skill
  const updateQuery = `
    UPDATE user_skills 
    SET ${updateFields.join(', ')} 
    WHERE id = $${paramCounter} 
    RETURNING *
  `;

  const result = await pool.query(updateQuery, queryParams);

  // Get full skill details for response
  const fullSkillResult = await pool.query(
    `SELECT us.id, us.user_id, us.skill_id, us.proficiency_level, 
            us.years_experience, us.created_at, us.updated_at,
            s.skill_name, s.category
     FROM user_skills us
     JOIN skills s ON us.skill_id = s.id
     WHERE us.id = $1`,
    [userSkillId]
  );

  res.json(formatSuccess(fullSkillResult.rows[0], 'Skill updated successfully'));
});

// @desc    Delete user skill
// @route   DELETE /api/users/skills/:id
// @access  Private (Jobseeker)
export const deleteUserSkill = asyncHandler(async (req: RequestWithUser, res: Response) => {
  const userId = req.user?.id;
  const userSkillId = parseInt(req.params.id);

  // Check if user skill exists and belongs to the user
  const userSkillExists = await pool.query(
    'SELECT * FROM user_skills WHERE id = $1 AND user_id = $2',
    [userSkillId, userId]
  );

  if (userSkillExists.rows.length === 0) {
    throw new AppError('Skill not found in your profile or you do not have permission', 404);
  }

  // Delete the user skill
  await pool.query('DELETE FROM user_skills WHERE id = $1', [userSkillId]);

  res.json(formatSuccess(null, 'Skill removed from profile successfully'));
});

// @desc    Get jobseeker's skills by user ID (for employers to view)
// @route   GET /api/users/:id/skills
// @access  Public
export const getJobseekerSkillsByUserId = asyncHandler(async (req: Request, res: Response) => {
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
    `SELECT us.skill_id, us.proficiency_level, us.years_experience,
            s.skill_name, s.category
     FROM user_skills us
     JOIN skills s ON us.skill_id = s.id
     WHERE us.user_id = $1
     ORDER BY s.category, s.skill_name`,
    [jobseekerId]
  );

  res.json(formatSuccess(result.rows, 'Jobseeker skills retrieved successfully'));
});

// Admin section - manage the skills database

// @desc    Create skill (admin only)
// @route   POST /api/admin/skills
// @access  Private/Admin
export const createSkill = asyncHandler(async (req: RequestWithUser, res: Response) => {
  // Check if user is admin
  if (req.user?.role !== 'admin') {
    throw new AppError('Not authorized, admin access required', 403);
  }
  
  // Check if req.body exists
  if (!req.body) {
    throw new AppError('Request body is missing', 400);
  }
  
  const { skill_name, category } = req.body;
  
  // Strict validation on both fields
  if (skill_name === undefined || category === undefined) {
    throw new AppError('Please provide skill name and category', 400);
  }
  
  if (typeof skill_name !== 'string' || typeof category !== 'string') {
    throw new AppError('Skill name and category must be strings', 400);
  }
  
  if (skill_name.trim() === '' || category.trim() === '') {
    throw new AppError('Skill name and category cannot be empty', 400);
  }

  // Check if skill already exists
  const skillExists = await pool.query(
    'SELECT * FROM skills WHERE LOWER(skill_name) = LOWER($1) AND LOWER(category) = LOWER($2)',
    [skill_name, category]
  );
  
  if (skillExists.rows.length > 0) {
    throw new AppError('Skill with this name and category already exists', 400);
  }

  // Create skill
  const result = await pool.query(
    `INSERT INTO skills (skill_name, category, created_at, updated_at)
     VALUES ($1, $2, NOW(), NOW())
     RETURNING *`,
    [skill_name, category]
  );

  res.status(201).json(formatSuccess(result.rows[0], 'Skill created successfully'));
});

// @desc    Update skill (admin only)
// @route   PUT /api/admin/skills/:id
// @access  Private/Admin
export const updateSkill = asyncHandler(async (req: RequestWithUser, res: Response) => {
  // Check if user is admin
  if (req.user?.role !== 'admin') {
    throw new AppError('Not authorized, admin access required', 403);
  }
  
  const skillId = parseInt(req.params.id);
  
  // Check if req.body exists
  if (!req.body) {
    throw new AppError('Request body is missing', 400);
  }
  
  const { skill_name, category } = req.body;

  // Check if skill exists
  const skillExists = await pool.query(
    'SELECT * FROM skills WHERE id = $1',
    [skillId]
  );
  
  if (skillExists.rows.length === 0) {
    throw new AppError('Skill not found', 404);
  }
  
  // If no fields provided, use existing values
  const existingSkill = skillExists.rows[0];
  const updatedSkillName = skill_name !== undefined ? skill_name : existingSkill.skill_name;
  const updatedCategory = category !== undefined ? category : existingSkill.category;
  
  // Validate new values
  if (typeof updatedSkillName !== 'string' || updatedSkillName.trim() === '') {
    throw new AppError('Skill name cannot be empty', 400);
  }
  
  if (typeof updatedCategory !== 'string' || updatedCategory.trim() === '') {
    throw new AppError('Category cannot be empty', 400);
  }

  // Check for duplicates
  const duplicateCheck = await pool.query(
    'SELECT * FROM skills WHERE LOWER(skill_name) = LOWER($1) AND LOWER(category) = LOWER($2) AND id != $3',
    [updatedSkillName, updatedCategory, skillId]
  );
  
  if (duplicateCheck.rows.length > 0) {
    throw new AppError('Skill with this skill_name and category already exists', 400);
  }

  // Update skill
  const result = await pool.query(
    `UPDATE skills 
     SET skill_name = $1, category = $2, updated_at = NOW() 
     WHERE id = $3 
     RETURNING *`,
    [updatedSkillName, updatedCategory, skillId]
  );

  res.json(formatSuccess(result.rows[0], 'Skill updated successfully'));
});

// @desc    Delete skill (admin only)
// @route   DELETE /api/admin/skills/:id
// @access  Private/Admin
export const deleteSkill = asyncHandler(async (req: RequestWithUser, res: Response) => {
  // Check if user is admin
  if (req.user?.role !== 'admin') {
    throw new AppError('Not authorized, admin access required', 403);
  }
  
  const skillId = parseInt(req.params.id);

  // Check if skill exists
  const skillExists = await pool.query(
    'SELECT * FROM skills WHERE id = $1',
    [skillId]
  );
  
  if (skillExists.rows.length === 0) {
    throw new AppError('Skill not found', 404);
  }

  // Check if skill is in use
  const skillInUseChecks = [
    pool.query('SELECT 1 FROM user_skills WHERE skill_id = $1 LIMIT 1', [skillId]),
    pool.query('SELECT 1 FROM job_skills WHERE skill_id = $1 LIMIT 1', [skillId]),
    pool.query('SELECT 1 FROM learning_resources WHERE skill_id = $1 LIMIT 1', [skillId])
  ];

  const results = await Promise.all(skillInUseChecks);
  
  const isSkillInUse = results.some(result => result.rows.length > 0);
  
  if (isSkillInUse) {
    throw new AppError('Cannot delete skill as it is in use', 400);
  }

  // Delete skill
  await pool.query('DELETE FROM skills WHERE id = $1', [skillId]);

  res.json(formatSuccess(null, 'Skill deleted successfully'));
});