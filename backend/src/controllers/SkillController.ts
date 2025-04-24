import { Request, Response } from 'express';
import asyncHandler from '../middlewares/asyncHandlers';
import pool from '../db/db.config';
import { AppError } from '../middlewares/errorMiddlewares';
import { formatSuccess } from '../utils/helpers';
import { RequestWithUser } from '../utils/Types/index';

// @desc    Get all skills
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
  
  query += ' ORDER BY category, name';
  
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

// @desc    Create skill (admin only)
// @route   POST /api/skills
// @access  Private/Admin
export const createSkill = asyncHandler(async (req: RequestWithUser, res: Response) => {
  const { skill_name, category } = req.body;

  if (!skill_name || !category) {
    throw new AppError('Please provide skill name and category', 400);
  }

  // Check if skill already exists
  const skillExists = await pool.query(
    'SELECT * FROM skills WHERE LOWER(skillsname) = LOWER($1) AND LOWER(category) = LOWER($2)',
    [skill_name, category]
  );
  
  if (skillExists.rows.length > 0) {
    throw new AppError('Skill with this name and category already exists', 400);
  }

  // Create skill
  const result = await pool.query(
    `INSERT INTO skills (name, category, created_at, updated_at)
     VALUES ($1, $2, NOW(), NOW())
     RETURNING *`,
    [name, category]
  );

  res.status(201).json(formatSuccess(result.rows[0], 'Skill created successfully'));
});

// @desc    Update skill (admin only)
// @route   PUT /api/skills/:id
// @access  Private/Admin
export const updateSkill = asyncHandler(async (req: RequestWithUser, res: Response) => {
  const skillId = parseInt(req.params.id);
  const { name, category } = req.body;

  // Check if skill exists
  const skillExists = await pool.query(
    'SELECT * FROM skills WHERE id = $1',
    [skillId]
  );
  
  if (skillExists.rows.length === 0) {
    throw new AppError('Skill not found', 404);
  }

  // If updating name and category, check for duplicates
  if (name && category) {
    const duplicateCheck = await pool.query(
      'SELECT * FROM skills WHERE LOWER(name) = LOWER($1) AND LOWER(category) = LOWER($2) AND id != $3',
      [name, category, skillId]
    );
    
    if (duplicateCheck.rows.length > 0) {
      throw new AppError('Skill with this name and category already exists', 400);
    }
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

  if (category) {
    updateFields.push(`category = $${paramCounter}`);
    queryParams.push(category);
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
    UPDATE skills 
    SET ${updateFields.join(', ')} 
    WHERE id = $${paramCounter} 
    RETURNING *
  `;
  queryParams.push(skillId);

  const result = await pool.query(updateQuery, queryParams);
  const updatedSkill = result.rows[0];

  res.json(formatSuccess(updatedSkill, 'Skill updated successfully'));
});

// @desc    Delete skill (admin only)
// @route   DELETE /api/skills/:id
// @access  Private/Admin
export const deleteSkill = asyncHandler(async (req: RequestWithUser, res: Response) => {
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