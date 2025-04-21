"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSkillCategories = exports.deleteSkill = exports.updateSkill = exports.createSkill = exports.getSkillById = exports.getAllSkills = void 0;
const asyncHandlers_1 = __importDefault(require("../middlewares/asyncHandlers"));
const db_config_1 = __importDefault(require("../db/db.config"));
const errorMiddlewares_1 = require("../middlewares/errorMiddlewares");
const helpers_1 = require("../utils/helpers");
// @desc    Get all skills
// @route   GET /api/skills
// @access  Public
exports.getAllSkills = (0, asyncHandlers_1.default)(async (req, res) => {
    const { category } = req.query;
    let query = 'SELECT * FROM skills';
    const queryParams = [];
    if (category) {
        query += ' WHERE LOWER(category) = LOWER($1)';
        queryParams.push(category);
    }
    query += ' ORDER BY category, name';
    const result = await db_config_1.default.query(query, queryParams);
    res.json((0, helpers_1.formatSuccess)(result.rows, 'Skills retrieved successfully'));
});
// @desc    Get skill by ID
// @route   GET /api/skills/:id
// @access  Public
exports.getSkillById = (0, asyncHandlers_1.default)(async (req, res) => {
    const skillId = parseInt(req.params.id);
    const result = await db_config_1.default.query('SELECT * FROM skills WHERE id = $1', [skillId]);
    if (result.rows.length === 0) {
        throw new errorMiddlewares_1.AppError('Skill not found', 404);
    }
    res.json((0, helpers_1.formatSuccess)(result.rows[0], 'Skill retrieved successfully'));
});
// @desc    Create skill (admin only)
// @route   POST /api/skills
// @access  Private/Admin
exports.createSkill = (0, asyncHandlers_1.default)(async (req, res) => {
    const { name, category } = req.body;
    if (!name || !category) {
        throw new errorMiddlewares_1.AppError('Please provide skill name and category', 400);
    }
    // Check if skill already exists
    const skillExists = await db_config_1.default.query('SELECT * FROM skills WHERE LOWER(name) = LOWER($1) AND LOWER(category) = LOWER($2)', [name, category]);
    if (skillExists.rows.length > 0) {
        throw new errorMiddlewares_1.AppError('Skill with this name and category already exists', 400);
    }
    // Create skill
    const result = await db_config_1.default.query(`INSERT INTO skills (name, category, created_at, updated_at)
     VALUES ($1, $2, NOW(), NOW())
     RETURNING *`, [name, category]);
    res.status(201).json((0, helpers_1.formatSuccess)(result.rows[0], 'Skill created successfully'));
});
// @desc    Update skill (admin only)
// @route   PUT /api/skills/:id
// @access  Private/Admin
exports.updateSkill = (0, asyncHandlers_1.default)(async (req, res) => {
    const skillId = parseInt(req.params.id);
    const { name, category } = req.body;
    // Check if skill exists
    const skillExists = await db_config_1.default.query('SELECT * FROM skills WHERE id = $1', [skillId]);
    if (skillExists.rows.length === 0) {
        throw new errorMiddlewares_1.AppError('Skill not found', 404);
    }
    // If updating name and category, check for duplicates
    if (name && category) {
        const duplicateCheck = await db_config_1.default.query('SELECT * FROM skills WHERE LOWER(name) = LOWER($1) AND LOWER(category) = LOWER($2) AND id != $3', [name, category, skillId]);
        if (duplicateCheck.rows.length > 0) {
            throw new errorMiddlewares_1.AppError('Skill with this name and category already exists', 400);
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
        throw new errorMiddlewares_1.AppError('No fields to update', 400);
    }
    // Build and execute the query
    const updateQuery = `
    UPDATE skills 
    SET ${updateFields.join(', ')} 
    WHERE id = $${paramCounter} 
    RETURNING *
  `;
    queryParams.push(skillId);
    const result = await db_config_1.default.query(updateQuery, queryParams);
    const updatedSkill = result.rows[0];
    res.json((0, helpers_1.formatSuccess)(updatedSkill, 'Skill updated successfully'));
});
// @desc    Delete skill (admin only)
// @route   DELETE /api/skills/:id
// @access  Private/Admin
exports.deleteSkill = (0, asyncHandlers_1.default)(async (req, res) => {
    const skillId = parseInt(req.params.id);
    // Check if skill exists
    const skillExists = await db_config_1.default.query('SELECT * FROM skills WHERE id = $1', [skillId]);
    if (skillExists.rows.length === 0) {
        throw new errorMiddlewares_1.AppError('Skill not found', 404);
    }
    // Check if skill is in use
    const skillInUseChecks = [
        db_config_1.default.query('SELECT 1 FROM user_skills WHERE skill_id = $1 LIMIT 1', [skillId]),
        db_config_1.default.query('SELECT 1 FROM job_skills WHERE skill_id = $1 LIMIT 1', [skillId]),
        db_config_1.default.query('SELECT 1 FROM learning_resources WHERE skill_id = $1 LIMIT 1', [skillId])
    ];
    const results = await Promise.all(skillInUseChecks);
    const isSkillInUse = results.some(result => result.rows.length > 0);
    if (isSkillInUse) {
        throw new errorMiddlewares_1.AppError('Cannot delete skill as it is in use', 400);
    }
    // Delete skill
    await db_config_1.default.query('DELETE FROM skills WHERE id = $1', [skillId]);
    res.json((0, helpers_1.formatSuccess)(null, 'Skill deleted successfully'));
});
// @desc    Get all skill categories
// @route   GET /api/skills/categories
// @access  Public
exports.getSkillCategories = (0, asyncHandlers_1.default)(async (req, res) => {
    const result = await db_config_1.default.query('SELECT DISTINCT category FROM skills ORDER BY category');
    const categories = result.rows.map(row => row.category);
    res.json((0, helpers_1.formatSuccess)(categories, 'Skill categories retrieved successfully'));
});
