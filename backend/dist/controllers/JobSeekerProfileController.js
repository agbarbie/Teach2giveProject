"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeSkill = exports.updateSkill = exports.addSkill = exports.updateProfile = exports.getProfileByUserId = exports.getMyProfile = void 0;
const asyncHandlers_1 = __importDefault(require("../middlewares/asyncHandlers"));
const db_config_1 = __importDefault(require("../db/db.config"));
const errorMiddlewares_1 = require("../middlewares/errorMiddlewares");
const helpers_1 = require("../utils/helpers");
// @desc    Get current user's profile
// @route   GET /api/profile
// @access  Private
exports.getMyProfile = (0, asyncHandlers_1.default)(async (req, res) => {
    const userId = req.user?.id;
    const result = await db_config_1.default.query('SELECT * FROM jobseeker_profiles WHERE user_id = $1', [userId]);
    if (result.rows.length === 0) {
        throw new errorMiddlewares_1.AppError('Profile not found', 404);
    }
    res.json((0, helpers_1.formatSuccess)(result.rows[0], 'Profile retrieved successfully'));
});
// @desc    Get profile by user ID
// @route   GET /api/profile/:userId
// @access  Private
exports.getProfileByUserId = (0, asyncHandlers_1.default)(async (req, res) => {
    const userId = parseInt(req.params.userId);
    // Companies and admins can view all profiles
    // Job seekers can only view their own profile
    if (req.user?.role === 'jobseeker' && req.user?.id !== userId) {
        throw new errorMiddlewares_1.AppError('Not authorized to view this profile', 403);
    }
    const result = await db_config_1.default.query('SELECT * FROM jobseeker_profiles WHERE user_id = $1', [userId]);
    if (result.rows.length === 0) {
        throw new errorMiddlewares_1.AppError('Profile not found', 404);
    }
    res.json((0, helpers_1.formatSuccess)(result.rows[0], 'Profile retrieved successfully'));
});
// @desc    Update profile
// @route   PUT /api/profile
// @access  Private
exports.updateProfile = (0, asyncHandlers_1.default)(async (req, res) => {
    const userId = req.user?.id;
    const { full_name, profile_picture, resume_url, bio, location, experience_years } = req.body;
    // Check if profile exists
    const profileExists = await db_config_1.default.query('SELECT * FROM jobseeker_profiles WHERE user_id = $1', [userId]);
    if (profileExists.rows.length === 0) {
        // Create profile if it doesn't exist
        const newProfile = await db_config_1.default.query(`INSERT INTO jobseeker_profiles 
       (user_id, full_name, profile_picture, resume_url, bio, location, experience_years, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
       RETURNING *`, [userId, full_name || '', profile_picture || null, resume_url || null, bio || null, location || null, experience_years || null]);
        return res.status(201).json((0, helpers_1.formatSuccess)(newProfile.rows[0], 'Profile created successfully'));
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
        throw new errorMiddlewares_1.AppError('No fields to update', 400);
    }
    // Build and execute the query
    const updateQuery = `
    UPDATE jobseeker_profiles 
    SET ${updateFields.join(', ')} 
    WHERE user_id = $${paramCounter} 
    RETURNING *
  `;
    queryParams.push(userId);
    const result = await db_config_1.default.query(updateQuery, queryParams);
    const updatedProfile = result.rows[0];
    res.json((0, helpers_1.formatSuccess)(updatedProfile, 'Profile updated successfully'));
});
// @desc    Add skill to profile
// @route   POST /api/profile/skills
// @access  Private
exports.addSkill = (0, asyncHandlers_1.default)(async (req, res) => {
    const userId = req.user?.id;
    const { skill_id, proficiency_level, years_experience } = req.body;
    if (!skill_id || !proficiency_level) {
        throw new errorMiddlewares_1.AppError('Please provide skill_id and proficiency_level', 400);
    }
    // Check if skill exists
    const skillExists = await db_config_1.default.query('SELECT * FROM skills WHERE id = $1', [skill_id]);
    if (skillExists.rows.length === 0) {
        throw new errorMiddlewares_1.AppError('Skill not found', 404);
    }
    // Check if user already has this skill
    const userSkillExists = await db_config_1.default.query('SELECT * FROM user_skills WHERE user_id = $1 AND skill_id = $2', [userId, skill_id]);
    if (userSkillExists.rows.length > 0) {
        throw new errorMiddlewares_1.AppError('You already have this skill added to your profile', 400);
    }
    // Add skill to user profile
    const result = await db_config_1.default.query(`INSERT INTO user_skills (user_id, skill_id, proficiency_level, years_experience, created_at)
     VALUES ($1, $2, $3, $4, NOW())
     RETURNING *`, [userId, skill_id, proficiency_level, years_experience || null]);
    res.status(201).json((0, helpers_1.formatSuccess)(result.rows[0], 'Skill added to profile successfully'));
});
// @desc    Update skill proficiency
// @route   PUT /api/profile/skills/:skillId
// @access  Private
exports.updateSkill = (0, asyncHandlers_1.default)(async (req, res) => {
    const userId = req.user?.id;
    const skillId = parseInt(req.params.skillId);
    const { proficiency_level, years_experience } = req.body;
    // Check if this skill is in user's profile
    const userSkillExists = await db_config_1.default.query('SELECT * FROM user_skills WHERE user_id = $1 AND skill_id = $2', [userId, skillId]);
    if (userSkillExists.rows.length === 0) {
        throw new errorMiddlewares_1.AppError('This skill is not in your profile', 404);
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
        throw new errorMiddlewares_1.AppError('No fields to update', 400);
    }
    // Build and execute the query
    const updateQuery = `
    UPDATE user_skills 
    SET ${updateFields.join(', ')} 
    WHERE user_id = $${paramCounter} AND skill_id = $${paramCounter + 1}
    RETURNING *
  `;
    queryParams.push(userId, skillId);
    const result = await db_config_1.default.query(updateQuery, queryParams);
    res.json((0, helpers_1.formatSuccess)(result.rows[0], 'Skill updated successfully'));
});
// @desc    Remove skill from profile
// @route   DELETE /api/profile/skills/:skillId
// @access  Private
exports.removeSkill = (0, asyncHandlers_1.default)(async (req, res) => {
    const userId = req.user?.id;
    const skillId = parseInt(req.params.skillId);
    // Check if this skill is in user's profile
    const userSkillExists = await db_config_1.default.query('SELECT * FROM user_skills WHERE user_id = $1 AND skill_id = $2', [userId, skillId]);
    if (userSkillExists.rows.length === 0) {
        throw new errorMiddlewares_1.AppError('This skill is not in your profile', 404);
    }
    // Remove skill from user profile
    await db_config_1.default.query('DELETE FROM user_skills WHERE user_id = $1 AND skill_id = $2', [userId, skillId]);
    res.json((0, helpers_1.formatSuccess)(null, 'Skill removed from profile successfully'));
});
