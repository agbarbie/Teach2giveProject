"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRecommendedResources = exports.getResourcesBySkill = exports.deleteResource = exports.updateResource = exports.createResource = exports.getResourceById = exports.getAllResources = void 0;
const asyncHandlers_1 = __importDefault(require("../middlewares/asyncHandlers"));
const db_config_1 = __importDefault(require("../db/db.config"));
const errorMiddlewares_1 = require("../middlewares/errorMiddlewares");
const helpers_1 = require("../utils/helpers");
// @desc    Get all learning resources
// @route   GET /api/resources
// @access  Public
exports.getAllResources = (0, asyncHandlers_1.default)(async (req, res) => {
    const { skill_id, type } = req.query;
    let query = `
    SELECT r.*, s.name as skill_name, s.category as skill_category 
    FROM learning_resources r
    JOIN skills s ON r.skill_id = s.id
    WHERE 1=1
  `;
    const queryParams = [];
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
    const result = await db_config_1.default.query(query, queryParams);
    res.json((0, helpers_1.formatSuccess)(result.rows, 'Learning resources retrieved successfully'));
});
// @desc    Get resource by ID
// @route   GET /api/resources/:id
// @access  Public
exports.getResourceById = (0, asyncHandlers_1.default)(async (req, res) => {
    const resourceId = parseInt(req.params.id);
    const result = await db_config_1.default.query(`SELECT r.*, s.name as skill_name, s.category as skill_category 
     FROM learning_resources r
     JOIN skills s ON r.skill_id = s.id
     WHERE r.id = $1`, [resourceId]);
    if (result.rows.length === 0) {
        throw new errorMiddlewares_1.AppError('Resource not found', 404);
    }
    res.json((0, helpers_1.formatSuccess)(result.rows[0], 'Resource retrieved successfully'));
});
// @desc    Create resource (admin only)
// @route   POST /api/resources
// @access  Private/Admin
exports.createResource = (0, asyncHandlers_1.default)(async (req, res) => {
    const { title, description, type, url, skill_id } = req.body;
    if (!title || !type || !url || !skill_id) {
        throw new errorMiddlewares_1.AppError('Please provide all required fields', 400);
    }
    // Check if skill exists
    const skillExists = await db_config_1.default.query('SELECT * FROM skills WHERE id = $1', [skill_id]);
    if (skillExists.rows.length === 0) {
        throw new errorMiddlewares_1.AppError('Skill not found', 404);
    }
    // Create resource
    const result = await db_config_1.default.query(`INSERT INTO learning_resources (title, description, type, url, skill_id, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
     RETURNING *`, [title, description || '', type, url, skill_id]);
    // Get skill info to include in response
    const skillResult = await db_config_1.default.query('SELECT name, category FROM skills WHERE id = $1', [skill_id]);
    const resource = {
        ...result.rows[0],
        skill_name: skillResult.rows[0].name,
        skill_category: skillResult.rows[0].category
    };
    res.status(201).json((0, helpers_1.formatSuccess)(resource, 'Resource created successfully'));
});
// @desc    Update resource (admin only)
// @route   PUT /api/resources/:id
// @access  Private/Admin
exports.updateResource = (0, asyncHandlers_1.default)(async (req, res) => {
    const resourceId = parseInt(req.params.id);
    const { title, description, type, url, skill_id } = req.body;
    // Check if resource exists
    const resourceExists = await db_config_1.default.query('SELECT * FROM learning_resources WHERE id = $1', [resourceId]);
    if (resourceExists.rows.length === 0) {
        throw new errorMiddlewares_1.AppError('Resource not found', 404);
    }
    // Check if skill exists if provided
    if (skill_id) {
        const skillExists = await db_config_1.default.query('SELECT * FROM skills WHERE id = $1', [skill_id]);
        if (skillExists.rows.length === 0) {
            throw new errorMiddlewares_1.AppError('Skill not found', 404);
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
        throw new errorMiddlewares_1.AppError('No fields to update', 400);
    }
    // Build and execute the query
    const updateQuery = `
    UPDATE learning_resources 
    SET ${updateFields.join(', ')} 
    WHERE id = $${paramCounter} 
    RETURNING *
  `;
    queryParams.push(resourceId);
    const result = await db_config_1.default.query(updateQuery, queryParams);
    const updatedResource = result.rows[0];
    // Get skill info to include in response
    const skillResult = await db_config_1.default.query('SELECT name, category FROM skills WHERE id = $1', [updatedResource.skill_id]);
    const resourceWithSkill = {
        ...updatedResource,
        skill_name: skillResult.rows[0].name,
        skill_category: skillResult.rows[0].category
    };
    res.json((0, helpers_1.formatSuccess)(resourceWithSkill, 'Resource updated successfully'));
});
// @desc    Delete resource (admin only)
// @route   DELETE /api/resources/:id
// @access  Private/Admin
exports.deleteResource = (0, asyncHandlers_1.default)(async (req, res) => {
    const resourceId = parseInt(req.params.id);
    // Check if resource exists
    const resourceExists = await db_config_1.default.query('SELECT * FROM learning_resources WHERE id = $1', [resourceId]);
    if (resourceExists.rows.length === 0) {
        throw new errorMiddlewares_1.AppError('Resource not found', 404);
    }
    // Delete resource
    await db_config_1.default.query('DELETE FROM learning_resources WHERE id = $1', [resourceId]);
    res.json((0, helpers_1.formatSuccess)(null, 'Resource deleted successfully'));
});
// @desc    Get resources by skill
// @route   GET /api/resources/skill/:skillId
// @access  Public
exports.getResourcesBySkill = (0, asyncHandlers_1.default)(async (req, res) => {
    const skillId = parseInt(req.params.skillId);
    // Check if skill exists
    const skillExists = await db_config_1.default.query('SELECT * FROM skills WHERE id = $1', [skillId]);
    if (skillExists.rows.length === 0) {
        throw new errorMiddlewares_1.AppError('Skill not found', 404);
    }
    const result = await db_config_1.default.query(`SELECT r.*, s.name as skill_name, s.category as skill_category 
     FROM learning_resources r
     JOIN skills s ON r.skill_id = s.id
     WHERE r.skill_id = $1
     ORDER BY r.created_at DESC`, [skillId]);
    res.json((0, helpers_1.formatSuccess)(result.rows, 'Resources retrieved successfully'));
});
// @desc    Get recommended resources for user
// @route   GET /api/resources/recommended
// @access  Private
exports.getRecommendedResources = (0, asyncHandlers_1.default)(async (req, res) => {
    const userId = req.user?.id;
    // Get user's skills
    const userSkillsResult = await db_config_1.default.query('SELECT skill_id, proficiency_level FROM user_skills WHERE user_id = $1', [userId]);
    const userSkills = userSkillsResult.rows;
    if (userSkills.length === 0) {
        // If user has no skills, return general popular resources
        const popularResources = await db_config_1.default.query(`SELECT r.*, s.name as skill_name, s.category as skill_category 
       FROM learning_resources r
       JOIN skills s ON r.skill_id = s.id
       ORDER BY r.created_at DESC
       LIMIT 10`);
        return res.json((0, helpers_1.formatSuccess)(popularResources.rows, 'Popular resources retrieved successfully'));
    }
    // Get resources for beginner/intermediate skills to improve
    const skillsToImprove = userSkills
        .filter(skill => ['beginner', 'intermediate'].includes(skill.proficiency_level))
        .map(skill => skill.skill_id);
    let resources = [];
    if (skillsToImprove.length > 0) {
        const skillResourcesResult = await db_config_1.default.query(`SELECT r.*, s.name as skill_name, s.category as skill_category 
       FROM learning_resources r
       JOIN skills s ON r.skill_id = s.id
       WHERE r.skill_id = ANY($1)
       ORDER BY r.created_at DESC
       LIMIT 10`, [skillsToImprove]);
        resources = skillResourcesResult.rows;
    }
    // If we have less than 10 resources, add some general popular ones
    if (resources.length < 10) {
        const additionalCount = 10 - resources.length;
        const skillIds = userSkills.map(skill => skill.skill_id);
        const additionalResourcesResult = await db_config_1.default.query(`SELECT r.*, s.name as skill_name, s.category as skill_category 
       FROM learning_resources r
       JOIN skills s ON r.skill_id = s.id
       WHERE r.skill_id != ALL($1)
       ORDER BY r.created_at DESC
       LIMIT $2`, [skillIds, additionalCount]);
        resources = [...resources, ...additionalResourcesResult.rows];
    }
    res.json((0, helpers_1.formatSuccess)(resources, 'Recommended resources retrieved successfully'));
});
