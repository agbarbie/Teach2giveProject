"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteJob = exports.updateJob = exports.createJob = exports.getJobById = exports.getAllJobs = void 0;
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
     WHERE j.job_id = $1`, [jobId]);
    if (jobResult.rows.length === 0) {
        throw new errorMiddlewares_1.AppError('Job not found', 404);
    }
    const job = jobResult.rows[0];
    res.json((0, helpers_1.formatSuccess)(job, 'Job retrieved successfully'));
});
// @desc    Create job
// @route   POST /api/jobs
// @access  Private/Employer
exports.createJob = (0, asyncHandlers_1.default)(async (req, res) => {
    const userId = req.user?.id;
    const { company_id, title, description, location, is_remote, status, salary_range, job_type } = req.body;
    // Only company_id and title are truly required
    if (!company_id) {
        throw new errorMiddlewares_1.AppError('Company ID is required', 400);
    }
    if (!title) {
        throw new errorMiddlewares_1.AppError('Job title is required', 400);
    }
    // Verify company exists and user is the owner
    const companyResult = await db_config_1.default.query('SELECT * FROM companies WHERE company_id = $1 AND owner_id = $2', [company_id, userId]);
    if (companyResult.rows.length === 0) {
        throw new errorMiddlewares_1.AppError('Company not found or you are not the owner', 404);
    }
    const client = await db_config_1.default.connect();
    try {
        await client.query('BEGIN');
        // Create job with fewer required fields
        const jobResult = await client.query(`INSERT INTO jobs 
       (company_id, title, description, location, is_remote, status, salary_range, job_type, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
       RETURNING *`, [
            company_id,
            title,
            description || 'No description provided',
            location || 'Remote',
            is_remote || false,
            status || 'open',
            salary_range || null,
            job_type || 'Full-time'
        ]);
        const newJob = jobResult.rows[0];
        await client.query('COMMIT');
        const fullJobResult = await db_config_1.default.query(`SELECT j.*, c.name as company_name 
       FROM jobs j
       JOIN companies c ON j.company_id = c.company_id
       WHERE j.job_id = $1`, [newJob.job_id]);
        res.status(201).json((0, helpers_1.formatSuccess)(fullJobResult.rows[0], 'Job created successfully'));
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
    const { title, description, location, is_remote, status, salary_range, job_type } = req.body;
    // Verify job exists and user is the company owner
    const jobResult = await db_config_1.default.query(`SELECT j.*, c.owner_id 
     FROM jobs j
     JOIN companies c ON j.company_id = c.company_id
     WHERE j.job_id = $1 AND c.owner_id = $2`, [jobId, userId]);
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
        if (description !== undefined) {
            updateFields.push(`description = $${paramCounter}`);
            queryParams.push(description);
            paramCounter++;
        }
        if (location !== undefined) {
            updateFields.push(`location = $${paramCounter}`);
            queryParams.push(location);
            paramCounter++;
        }
        if (is_remote !== undefined) {
            updateFields.push(`is_remote = $${paramCounter}`);
            queryParams.push(is_remote);
            paramCounter++;
        }
        if (status !== undefined) {
            updateFields.push(`status = $${paramCounter}`);
            queryParams.push(status);
            paramCounter++;
        }
        if (salary_range !== undefined) {
            updateFields.push(`salary_range = $${paramCounter}`);
            queryParams.push(salary_range);
            paramCounter++;
        }
        if (job_type !== undefined) {
            updateFields.push(`job_type = $${paramCounter}`);
            queryParams.push(job_type);
            paramCounter++;
        }
        // Add updated_at timestamp
        updateFields.push(`updated_at = NOW()`);
        if (updateFields.length > 0) {
            const updateQuery = `
        UPDATE jobs 
        SET ${updateFields.join(', ')} 
        WHERE job_id = $${paramCounter} 
        RETURNING *
      `;
            queryParams.push(jobId);
            await client.query(updateQuery, queryParams);
        }
        await client.query('COMMIT');
        const updatedJobResult = await db_config_1.default.query(`SELECT j.*, c.name as company_name 
       FROM jobs j
       JOIN companies c ON j.company_id = c.company_id
       WHERE j.job_id = $1`, [jobId]);
        res.json((0, helpers_1.formatSuccess)(updatedJobResult.rows[0], 'Job updated successfully'));
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
     WHERE j.job_id = $1 AND c.owner_id = $2`, [jobId, userId]);
    if (jobResult.rows.length === 0) {
        throw new errorMiddlewares_1.AppError('Job not found or you are not the owner', 404);
    }
    const client = await db_config_1.default.connect();
    try {
        await client.query('BEGIN');
        // Delete job
        await client.query('DELETE FROM jobs WHERE job_id = $1', [jobId]);
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
