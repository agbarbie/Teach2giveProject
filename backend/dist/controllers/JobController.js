"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeJobSkill = exports.addJobSkill = exports.deleteJob = exports.updateJob = exports.createJob = exports.getJobById = exports.getAllJobs = void 0;
const asyncHandlers_1 = __importDefault(require("../middlewares/asyncHandlers"));
const db_config_1 = __importDefault(require("../db/db.config"));
const errorMiddlewares_1 = require("../middlewares/errorMiddlewares");
const helpers_1 = require("../utils/helpers");
// @desc    Get all jobs
// @route   GET /api/jobs
// @access  Public
exports.getAllJobs = (0, asyncHandlers_1.default)(async (req, res) => {
    const { location, title, company } = req.query;
    let query = `
    SELECT j.*, c.name as company_name 
    FROM jobs j
    JOIN companies c ON j.company_id = c.company_id
    WHERE 1=1
  `;
    const queryParams = [];
    let paramIndex = 1;
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
    const result = await db_config_1.default.query(query, queryParams);
    res.json((0, helpers_1.formatSuccess)(result.rows, 'Jobs retrieved successfully'));
});
// @desc    Get job by ID
// @route   GET /api/jobs/:id
// @access  Public
exports.getJobById = (0, asyncHandlers_1.default)(async (req, res) => {
    const jobId = parseInt(req.params.id);
    const jobResult = await db_config_1.default.query(`SELECT j.*, c.name as company_name 
     FROM jobs j
     JOIN companies c ON j.company_id = c.company_id
     WHERE j.id = $1`, [jobId]);
    if (jobResult.rows.length === 0) {
        throw new errorMiddlewares_1.AppError('Job not found', 404);
    }
    const job = jobResult.rows[0];
    const skillsResult = await db_config_1.default.query(`SELECT js.skill_id, js.importance_level, s.name, s.category
     FROM job_skills js
     JOIN skills s ON js.skill_id = s.id
     WHERE js.job_id = $1
     ORDER BY js.importance_level, s.name`, [jobId]);
    const jobWithSkills = {
        ...job,
        skills: skillsResult.rows
    };
    res.json((0, helpers_1.formatSuccess)(jobWithSkills, 'Job retrieved successfully'));
});
// @desc    Create job
// @route   POST /api/jobs
// @access  Private/Employer
exports.createJob = (0, asyncHandlers_1.default)(async (req, res) => {
    const userId = req.user?.id;
    const { company_id, title, description, requirements, location, salary_range, job_type, experience_level } = req.body;
    const skills = req.body.skills;
    if (!company_id || !title || !description || !location || !job_type) {
        throw new errorMiddlewares_1.AppError('Please provide all required fields', 400);
    }
    // Verify company exists and user is the owner
    const companyResult = await db_config_1.default.query('SELECT * FROM companies WHERE company_id = $1 AND owner_id = $2', [company_id, userId]);
    if (companyResult.rows.length === 0) {
        throw new errorMiddlewares_1.AppError('Company not found or you are not the owner', 404);
    }
    const client = await db_config_1.default.connect();
    try {
        await client.query('BEGIN');
        // Create job
        const jobResult = await client.query(`INSERT INTO jobs 
       (company_id, title, description, requirements, location, salary_range, job_type, experience_level, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
       RETURNING *`, [
            company_id, title, description, requirements || '', location,
            salary_range || null, job_type, experience_level || null
        ]);
        const newJob = jobResult.rows[0];
        // Add skills if provided
        if (skills && Array.isArray(skills) && skills.length > 0) {
            for (const skill of skills) {
                await client.query(`INSERT INTO job_skills (job_id, skill_id, importance_level, created_at)
           VALUES ($1, $2, $3, NOW())`, [newJob.id, skill.skill_id, skill.importance_level || 'preferred']);
            }
        }
        await client.query('COMMIT');
        const fullJobResult = await db_config_1.default.query(`SELECT j.*, c.name as company_name 
       FROM jobs j
       JOIN companies c ON j.company_id = c.company_id
       WHERE j.id = $1`, [newJob.id]);
        const skillsResult = await db_config_1.default.query(`SELECT js.skill_id, js.importance_level, s.name, s.category
       FROM job_skills js
       JOIN skills s ON js.skill_id = s.id
       WHERE js.job_id = $1
       ORDER BY js.importance_level, s.name`, [newJob.id]);
        const jobWithSkills = {
            ...fullJobResult.rows[0],
            skills: skillsResult.rows
        };
        res.status(201).json((0, helpers_1.formatSuccess)(jobWithSkills, 'Job created successfully'));
    }
    catch (error) {
        await client.query('ROLLBACK');
        throw error;
    }
    finally {
        client.release();
    }
});
// @desc    Update job
// @route   PUT /api/jobs/:id
// @access  Private/Employer
exports.updateJob = (0, asyncHandlers_1.default)(async (req, res) => {
    const jobId = parseInt(req.params.id);
    const userId = req.user?.id;
    const { title, description, requirements, location, salary_range, job_type, experience_level, skills } = req.body;
    // Verify job exists and user is the company owner
    const jobResult = await db_config_1.default.query(`SELECT j.*, c.owner_id 
     FROM jobs j
     JOIN companies c ON j.company_id = c.company_id
     WHERE j.id = $1 AND c.owner_id = $2`, [jobId, userId]);
    if (jobResult.rows.length === 0) {
        throw new errorMiddlewares_1.AppError('Job not found or you are not the owner', 404);
    }
    const client = await db_config_1.default.connect();
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
        updateFields.push(`updated_at = NOW()`);
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
        if (skills && Array.isArray(skills)) {
            await client.query('DELETE FROM job_skills WHERE job_id = $1', [jobId]);
            for (const skill of skills) {
                await client.query(`INSERT INTO job_skills (job_id, skill_id, importance_level, created_at)
           VALUES ($1, $2, $3, NOW())`, [jobId, skill.skill_id, skill.importance_level || 'preferred']);
            }
        }
        await client.query('COMMIT');
        const updatedJobResult = await db_config_1.default.query(`SELECT j.*, c.name as company_name 
       FROM jobs j
       JOIN companies c ON j.company_id = c.company_id
       WHERE j.id = $1`, [jobId]);
        const skillsResult = await db_config_1.default.query(`SELECT js.skill_id, js.importance_level, s.name, s.category
       FROM job_skills js
       JOIN skills s ON js.skill_id = s.id
       WHERE js.job_id = $1
       ORDER BY js.importance_level, s.name`, [jobId]);
        const jobWithSkills = {
            ...updatedJobResult.rows[0],
            skills: skillsResult.rows
        };
        res.json((0, helpers_1.formatSuccess)(jobWithSkills, 'Job updated successfully'));
    }
    catch (error) {
        await client.query('ROLLBACK');
        throw error;
    }
    finally {
        client.release();
    }
});
// @desc    Delete job
// @route   DELETE /api/jobs/:id
// @access  Private/Employer
exports.deleteJob = (0, asyncHandlers_1.default)(async (req, res) => {
    const jobId = parseInt(req.params.id);
    const userId = req.user?.id;
    // Verify job exists and user is the company owner
    const jobResult = await db_config_1.default.query(`SELECT j.*, c.owner_id 
     FROM jobs j
     JOIN companies c ON j.company_id = c.company_id
     WHERE j.id = $1 AND c.owner_id = $2`, [jobId, userId]);
    if (jobResult.rows.length === 0) {
        throw new errorMiddlewares_1.AppError('Job not found or you are not the owner', 404);
    }
    const client = await db_config_1.default.connect();
    try {
        await client.query('BEGIN');
        await client.query('DELETE FROM job_skills WHERE job_id = $1', [jobId]);
        await client.query('DELETE FROM job_matches WHERE job_id = $1', [jobId]);
        const applicationsResult = await client.query('SELECT id FROM applications WHERE job_id = $1', [jobId]);
        for (const app of applicationsResult.rows) {
            await client.query('DELETE FROM interview_requests WHERE application_id = $1', [app.id]);
        }
        await client.query('DELETE FROM applications WHERE job_id = $1', [jobId]);
        await client.query('DELETE FROM jobs WHERE id = $1', [jobId]);
        await client.query('COMMIT');
        res.json((0, helpers_1.formatSuccess)(null, 'Job deleted successfully'));
    }
    catch (error) {
        await client.query('ROLLBACK');
        throw error;
    }
    finally {
        client.release();
    }
});
// @desc    Add skill to job
// @route   POST /api/jobs/:id/skills
// @access  Private/Employer
exports.addJobSkill = (0, asyncHandlers_1.default)(async (req, res) => {
    const jobId = parseInt(req.params.id);
    const userId = req.user?.id;
    const { skill_id, importance_level } = req.body;
    if (!skill_id) {
        throw new errorMiddlewares_1.AppError('Skill ID is required', 400);
    }
    // Verify job exists and user is the company owner
    const jobResult = await db_config_1.default.query(`SELECT j.*, c.owner_id 
     FROM jobs j
     JOIN companies c ON j.company_id = c.company_id
     WHERE j.id = $1 AND c.owner_id = $2`, [jobId, userId]);
    if (jobResult.rows.length === 0) {
        throw new errorMiddlewares_1.AppError('Job not found or you are not the owner', 404);
    }
    const skillExists = await db_config_1.default.query('SELECT * FROM skills WHERE id = $1', [skill_id]);
    if (skillExists.rows.length === 0) {
        throw new errorMiddlewares_1.AppError('Skill not found', 404);
    }
    const jobSkillExists = await db_config_1.default.query('SELECT * FROM job_skills WHERE job_id = $1 AND skill_id = $2', [jobId, skill_id]);
    if (jobSkillExists.rows.length > 0) {
        throw new errorMiddlewares_1.AppError('This skill is already added to the job', 400);
    }
    const result = await db_config_1.default.query(`INSERT INTO job_skills (job_id, skill_id, importance_level, created_at)
     VALUES ($1, $2, $3, NOW())
     RETURNING *`, [jobId, skill_id, importance_level || 'preferred']);
    res.status(201).json((0, helpers_1.formatSuccess)(result.rows[0], 'Skill added to job successfully'));
});
// @desc    Remove skill from job
// @route   DELETE /api/jobs/:id/skills/:skillId
// @access  Private/Employer
exports.removeJobSkill = (0, asyncHandlers_1.default)(async (req, res) => {
    const jobId = parseInt(req.params.id);
    const skillId = parseInt(req.params.skillId);
    const userId = req.user?.id;
    // Verify job exists and user is the company owner
    const jobResult = await db_config_1.default.query(`SELECT j.*, c.owner_id 
     FROM jobs j
     JOIN companies c ON j.company_id = c.company_id
     WHERE j.id = $1 AND c.owner_id = $2`, [jobId, userId]);
    if (jobResult.rows.length === 0) {
        throw new errorMiddlewares_1.AppError('Job not found or you are not the owner', 404);
    }
    const jobSkillExists = await db_config_1.default.query('SELECT * FROM job_skills WHERE job_id = $1 AND skill_id = $2', [jobId, skillId]);
    if (jobSkillExists.rows.length === 0) {
        throw new errorMiddlewares_1.AppError('This skill is not associated with the job', 404);
    }
    await db_config_1.default.query('DELETE FROM job_skills WHERE job_id = $1 AND skill_id = $2', [jobId, skillId]);
    res.json((0, helpers_1.formatSuccess)(null, 'Skill removed from job successfully'));
});
