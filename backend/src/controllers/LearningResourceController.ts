import { Request, Response } from 'express';
import asyncHandler from '../middlewares/asyncHandlers';
import pool from '../db/db.config';
import { AppError } from '../middlewares/errorMiddlewares';
import { formatSuccess } from '../utils/helpers';
import { RequestWithUser } from '../utils/Types/index';

// @desc    Get all learning resources
// @route   GET /api/resources
// @access  Public
export const getAllResources = asyncHandler(async (req: Request, res: Response) => {
  const { skill_id, type } = req.query;
  
  let query = `
    SELECT r.*, s.name as skill_name, s.category as skill_category 
    FROM learning_resources r
    JOIN skills s ON r.skill_id = s.id
    WHERE 1=1
  `;
  
  const queryParams: any[] = [];
  let paramIndex = 1;
  
  // Add filters if provided
  if (skill_id) {
    query += ` AND r.skill_id = $${paramIndex}`;
    queryParams.push(skill_id);
    paramIndex++;
  }
  
  if (type) {
    query += ` AND r.type = $${paramIndex}`;
    queryParams.push(type);
    paramIndex++;
  }
  
  query += ` ORDER BY r.created_at DESC`;
  
  const result = await pool.query(query, queryParams);

  res.json(formatSuccess(result.rows, 'Learning resources retrieved successfully'));
});

// @desc    Get resource by ID
// @route   GET /api/resources/:id
// @access  Public
export const getResourceById = asyncHandler(async (req: Request, res: Response) => {
  const resourceId = parseInt(req.params.id);

  const result = await pool.query(
    `SELECT r.*, s.name as skill_name, s.category as skill_category 
     FROM learning_resources r
     JOIN skills s ON r.skill_id = s.id
     WHERE r.id = $1`,
    [resourceId]
  );

  if (result.rows.length === 0) {
    throw new AppError('Resource not found', 404);
  }

  res.json(formatSuccess(result.rows[0], 'Resource retrieved successfully'));
});

// @desc    Create resource (admin only)
// @route   POST /api/resources
// @access  Private/Admin
export const createResource = asyncHandler(async (req: RequestWithUser, res: Response) => {
  const { title, description, type, url, skill_id } = req.body;

  if (!title || !type || !url || !skill_id) {
    throw new AppError('Please provide all required fields', 400);
  }

  // Check if skill exists
  const skillExists = await pool.query('SELECT * FROM skills WHERE id = $1', [skill_id]);
  
  if (skillExists.rows.length === 0) {
    throw new AppError('Skill not found', 404);
  }

  // Create resource
  const result = await pool.query(
    `INSERT INTO learning_resources (title, description, type, url, skill_id, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
     RETURNING *`,
    [title, description || '', type, url, skill_id]
  );

  // Get skill info to include in response
  const skillResult = await pool.query(
    'SELECT name, category FROM skills WHERE id = $1',
    [skill_id]
  );

  const resource = {
    ...result.rows[0],
    skill_name: skillResult.rows[0].name,
    skill_category: skillResult.rows[0].category
  };

  res.status(201).json(formatSuccess(resource, 'Resource created successfully'));
});

// @desc    Update resource (admin only)
// @route   PUT /api/resources/:id
// @access  Private/Admin
export const updateResource = asyncHandler(async (req: RequestWithUser, res: Response) => {
  const resourceId = parseInt(req.params.id);
  const { title, description, type, url, skill_id } = req.body;

  // Check if resource exists
  const resourceExists = await pool.query(
    'SELECT * FROM learning_resources WHERE id = $1',
    [resourceId]
  );
  
  if (resourceExists.rows.length === 0) {
    throw new AppError('Resource not found', 404);
  }

  // Check if skill exists if provided
  if (skill_id) {
    const skillExists = await pool.query('SELECT * FROM skills WHERE id = $1', [skill_id]);
    
    if (skillExists.rows.length === 0) {
      throw new AppError('Skill not found', 404);
    }
  }

  // Build the update query dynamically
  let updateFields = [];
  let queryParams = [];
  let paramCounter = 1;

  if (title) {
    updateFields.push(`title = $${paramCounter}`);
    queryParams.push(title);
    paramCounter++;
  }

  if (description !== undefined) {
    updateFields.push(`description = $${paramCounter}`);
    queryParams.push(description);
    paramCounter++;
  }

  if (type) {
    updateFields.push(`type = $${paramCounter}`);
    queryParams.push(type);
    paramCounter++;
  }

  if (url) {
    updateFields.push(`url = $${paramCounter}`);
    queryParams.push(url);
    paramCounter++;
  }

  if (skill_id) {
    updateFields.push(`skill_id = $${paramCounter}`);
    queryParams.push(skill_id);
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
    UPDATE learning_resources 
    SET ${updateFields.join(', ')} 
    WHERE id = $${paramCounter} 
    RETURNING *
  `;
  queryParams.push(resourceId);

  const result = await pool.query(updateQuery, queryParams);
  const updatedResource = result.rows[0];

  // Get skill info to include in response
  const skillResult = await pool.query(
    'SELECT name, category FROM skills WHERE id = $1',
    [updatedResource.skill_id]
  );

  const resourceWithSkill = {
    ...updatedResource,
    skill_name: skillResult.rows[0].name,
    skill_category: skillResult.rows[0].category
  };

  res.json(formatSuccess(resourceWithSkill, 'Resource updated successfully'));
});

// @desc    Delete resource (admin only)
// @route   DELETE /api/resources/:id
// @access  Private/Admin
export const deleteResource = asyncHandler(async (req: RequestWithUser, res: Response) => {
  const resourceId = parseInt(req.params.id);

  // Check if resource exists
  const resourceExists = await pool.query(
    'SELECT * FROM learning_resources WHERE id = $1',
    [resourceId]
  );
  
  if (resourceExists.rows.length === 0) {
    throw new AppError('Resource not found', 404);
  }

  // Delete resource
  await pool.query('DELETE FROM learning_resources WHERE id = $1', [resourceId]);

  res.json(formatSuccess(null, 'Resource deleted successfully'));
});

// @desc    Get resources by skill
// @route   GET /api/resources/skill/:skillId
// @access  Public
export const getResourcesBySkill = asyncHandler(async (req: Request, res: Response) => {
  const skillId = parseInt(req.params.skillId);

  // Check if skill exists
  const skillExists = await pool.query('SELECT * FROM skills WHERE id = $1', [skillId]);
  
  if (skillExists.rows.length === 0) {
    throw new AppError('Skill not found', 404);
  }

  const result = await pool.query(
    `SELECT r.*, s.name as skill_name, s.category as skill_category 
     FROM learning_resources r
     JOIN skills s ON r.skill_id = s.id
     WHERE r.skill_id = $1
     ORDER BY r.created_at DESC`,
    [skillId]
  );

  res.json(formatSuccess(result.rows, 'Resources retrieved successfully'));
});

// @desc    Get recommended resources for user
// @route   GET /api/resources/recommended
// @access  Private
export const getRecommendedResources = asyncHandler(async (req: RequestWithUser, res: Response) => {
  const userId = req.user?.id;

  // Get user's skills
  const userSkillsResult = await pool.query(
    'SELECT skill_id, proficiency_level FROM user_skills WHERE user_id = $1',
    [userId]
  );
  
  const userSkills = userSkillsResult.rows;
  
  if (userSkills.length === 0) {
    // If user has no skills, return general popular resources
    const popularResources = await pool.query(
      `SELECT r.*, s.name as skill_name, s.category as skill_category 
       FROM learning_resources r
       JOIN skills s ON r.skill_id = s.id
       ORDER BY r.created_at DESC
       LIMIT 10`
    );
    
    return res.json(formatSuccess(popularResources.rows, 'Popular resources retrieved successfully'));
  }
  
  // Get resources for beginner/intermediate skills to improve
  const skillsToImprove = userSkills
    .filter(skill => ['beginner', 'intermediate'].includes(skill.proficiency_level))
    .map(skill => skill.skill_id);
  
  let resources = [];
  
  if (skillsToImprove.length > 0) {
    const skillResourcesResult = await pool.query(
      `SELECT r.*, s.name as skill_name, s.category as skill_category 
       FROM learning_resources r
       JOIN skills s ON r.skill_id = s.id
       WHERE r.skill_id = ANY($1)
       ORDER BY r.created_at DESC
       LIMIT 10`,
      [skillsToImprove]
    );
    
    resources = skillResourcesResult.rows;
  }
  
  // If we have less than 10 resources, add some general popular ones
  if (resources.length < 10) {
    const additionalCount = 10 - resources.length;
    const skillIds = userSkills.map(skill => skill.skill_id);
    
    const additionalResourcesResult = await pool.query(
      `SELECT r.*, s.name as skill_name, s.category as skill_category 
       FROM learning_resources r
       JOIN skills s ON r.skill_id = s.id
       WHERE r.skill_id != ALL($1)
       ORDER BY r.created_at DESC
       LIMIT $2`,
      [skillIds, additionalCount]
    );
    
    resources = [...resources, ...additionalResourcesResult.rows];
  }

  res.json(formatSuccess(resources, 'Recommended resources retrieved successfully'));
});