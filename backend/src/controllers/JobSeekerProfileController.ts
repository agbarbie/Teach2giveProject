import { Response } from 'express';
import asyncHandler from '../middlewares/asyncHandlers';
import pool from '../db/db.config';
import { AppError } from '../middlewares/errorMiddlewares';
import { formatSuccess } from '../utils/helpers';
import { RequestWithUser } from '../utils/Types/index';

// @desc    Get current user's profile
// @route   GET /api/profile
// @access  Private
export const getMyProfile = asyncHandler(async (req: RequestWithUser, res: Response) => {
  const userId = req.user?.id;

  const result = await pool.query(
    'SELECT * FROM jobseeker_profiles WHERE user_id = $1',
    [userId]
  );

  if (result.rows.length === 0) {
    throw new AppError('Profile not found', 404);
  }

  res.json(formatSuccess(result.rows[0], 'Profile retrieved successfully'));
});

// @desc    Get profile by user ID
// @route   GET /api/profile/:userId
// @access  Private
export const getProfileByUserId = asyncHandler(async (req: RequestWithUser, res: Response) => {
  const userId = parseInt(req.params.userId);

  // Companies and admins can view all profiles
  // Job seekers can only view their own profile
  if (req.user?.role === 'jobseeker' && req.user?.id !== userId) {
    throw new AppError('Not authorized to view this profile', 403);
  }

  const result = await pool.query(
    'SELECT * FROM jobseeker_profiles WHERE user_id = $1',
    [userId]
  );

  if (result.rows.length === 0) {
    throw new AppError('Profile not found', 404);
  }

  res.json(formatSuccess(result.rows[0], 'Profile retrieved successfully'));
});

// @desc    Update profile
// @route   PUT /api/profile
// @access  Private
export const updateProfile = asyncHandler(async (req: RequestWithUser, res: Response) => {
  const userId = req.user?.id;
  const { full_name, profile_picture, resume_url, bio, location, experience_years } = req.body as {
    full_name?: string;
    profile_picture?: string;
    resume_url?: string;
    bio?: string;
    location?: string;
    experience_years?: number;
  };

  // Check if profile exists
  const profileExists = await pool.query(
    'SELECT * FROM jobseeker_profiles WHERE user_id = $1',
    [userId]
  );

  if (profileExists.rows.length === 0) {
    // Create profile if it doesn't exist
    const newProfile = await pool.query(
      `INSERT INTO jobseeker_profiles 
       (user_id, full_name, profile_picture, resume_url, bio, location, experience_years, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
       RETURNING *`,
      [userId, full_name || '', profile_picture || null, resume_url || null, bio || null, location || null, experience_years || null]
    );

    return res.status(201).json(formatSuccess(newProfile.rows[0], 'Profile created successfully'));
  }

  // Build the update query dynamically
  let updateFields = [];
  let queryParams = [];
  let paramCounter = 1;

  if (full_name !== undefined) {
    updateFields.push(`full_name = $${paramCounter}`);
    queryParams.push(full_name);
    paramCounter++;
  }

  if (profile_picture !== undefined) {
    updateFields.push(`profile_picture = $${paramCounter}`);
    queryParams.push(profile_picture);
    paramCounter++;
  }

  if (resume_url !== undefined) {
    updateFields.push(`resume_url = $${paramCounter}`);
    queryParams.push(resume_url);
    paramCounter++;
  }

  if (bio !== undefined) {
    updateFields.push(`bio = $${paramCounter}`);
    queryParams.push(bio);
    paramCounter++;
  }

  if (location !== undefined) {
    updateFields.push(`location = $${paramCounter}`);
    queryParams.push(location);
    paramCounter++;
  }

  if (experience_years !== undefined) {
    updateFields.push(`experience_years = $${paramCounter}`);
    queryParams.push(experience_years);
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
    UPDATE jobseeker_profiles 
    SET ${updateFields.join(', ')} 
    WHERE user_id = $${paramCounter} 
    RETURNING *
  `;
  queryParams.push(userId);

  const result = await pool.query(updateQuery, queryParams);
  const updatedProfile = result.rows[0];

  res.json(formatSuccess(updatedProfile, 'Profile updated successfully'));
});

// @desc    Add skill to profile
// @route   POST /api/profile/skills
// @access  Private
export const addSkill = asyncHandler(async (req: RequestWithUser, res: Response) => {
  const userId = req.user?.id;
  const { skill_id, proficiency_level, years_experience } = req.body as {
    skill_id: number;
    proficiency_level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    years_experience?: number;
  };

  if (!skill_id || !proficiency_level) {
    throw new AppError('Please provide skill_id and proficiency_level', 400);
  }

  // Check if skill exists
  const skillExists = await pool.query('SELECT * FROM skills WHERE id = $1', [skill_id]);
  
  if (skillExists.rows.length === 0) {
    throw new AppError('Skill not found', 404);
  }

  // Check if user already has this skill
  const userSkillExists = await pool.query(
    'SELECT * FROM user_skills WHERE user_id = $1 AND skill_id = $2',
    [userId, skill_id]
  );
  
  if (userSkillExists.rows.length > 0) {
    throw new AppError('You already have this skill added to your profile', 400);
  }

  // Add skill to user profile
  const result = await pool.query(
    `INSERT INTO user_skills (user_id, skill_id, proficiency_level, years_experience, created_at)
     VALUES ($1, $2, $3, $4, NOW())
     RETURNING *`,
    [userId, skill_id, proficiency_level, years_experience || null]
  );

  res.status(201).json(formatSuccess(result.rows[0], 'Skill added to profile successfully'));
});

// @desc    Update skill proficiency
// @route   PUT /api/profile/skills/:skillId
// @access  Private
export const updateSkill = asyncHandler(async (req: RequestWithUser, res: Response) => {
  const userId = req.user?.id;
  const skillId = parseInt(req.params.skillId);
  const { proficiency_level, years_experience } = req.body as {
    proficiency_level?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    years_experience?: number;
  };
  // Check if this skill is in user's profile
  const userSkillExists = await pool.query(
    'SELECT * FROM user_skills WHERE user_id = $1 AND skill_id = $2',
    [userId, skillId]
  );
  
  if (userSkillExists.rows.length === 0) {
    throw new AppError('This skill is not in your profile', 404);
  }

  // Build update query
  let updateFields = [];
  let queryParams = [];
  let paramCounter = 1;

  if (proficiency_level) {
    updateFields.push(`proficiency_level = $${paramCounter}`);
    queryParams.push(proficiency_level);
    paramCounter++;
  }

  if (years_experience !== undefined) {
    updateFields.push(`years_experience = $${paramCounter}`);
    queryParams.push(years_experience);
    paramCounter++;
  }

  if (updateFields.length === 0) {
    throw new AppError('No fields to update', 400);
  }

  // Build and execute the query
  const updateQuery = `
    UPDATE user_skills 
    SET ${updateFields.join(', ')} 
    WHERE user_id = $${paramCounter} AND skill_id = $${paramCounter + 1}
    RETURNING *
  `;
  queryParams.push(userId, skillId);

  const result = await pool.query(updateQuery, queryParams);

  res.json(formatSuccess(result.rows[0], 'Skill updated successfully'));
});

// @desc    Remove skill from profile
// @route   DELETE /api/profile/skills/:skillId
// @access  Private
export const removeSkill = asyncHandler(async (req: RequestWithUser, res: Response) => {
  const userId = req.user?.id;
  const skillId = parseInt(req.params.skillId);

  // Check if this skill is in user's profile
  const userSkillExists = await pool.query(
    'SELECT * FROM user_skills WHERE user_id = $1 AND skill_id = $2',
    [userId, skillId]
  );
  
  if (userSkillExists.rows.length === 0) {
    throw new AppError('This skill is not in your profile', 404);
  }

  // Remove skill from user profile
  await pool.query(
    'DELETE FROM user_skills WHERE user_id = $1 AND skill_id = $2',
    [userId, skillId]
  );

  res.json(formatSuccess(null, 'Skill removed from profile successfully'));
});