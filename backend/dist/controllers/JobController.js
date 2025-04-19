"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteJob = exports.updateJob = exports.getJobById = exports.getAllJobs = exports.createJob = void 0;
const db_config_1 = __importDefault(require("../db/db.config"));
// Create a new job
const createJob = async (req, res) => {
    try {
        const { company_id, title, description, location, employment_type, salary_range, required_experience, deadline, } = req.body;
        const result = await db_config_1.default.query(`INSERT INTO jobs (company_id, title, description, location, employment_type, salary_range, required_experience, deadline)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`, [company_id, title, description, location, employment_type, salary_range, required_experience, deadline]);
        res.status(201).json({
            message: 'Job created successfully',
            job: result.rows[0],
        });
    }
    catch (error) {
        console.error('Create Job Error:', error);
        res.status(500).json({ message: 'Server error creating job' });
    }
};
exports.createJob = createJob;
// Get all jobs
const getAllJobs = async (_req, res) => {
    try {
        const result = await db_config_1.default.query(`SELECT * FROM jobs ORDER BY created_at DESC`);
        res.status(200).json(result.rows);
    }
    catch (error) {
        console.error('Get Jobs Error:', error);
        res.status(500).json({ message: 'Server error fetching jobs' });
    }
};
exports.getAllJobs = getAllJobs;
// Get job by ID
const getJobById = async (req, res) => {
    try {
        const { jobId } = req.params;
        const result = await db_config_1.default.query(`SELECT * FROM jobs WHERE id = $1`, [jobId]);
        if (result.rows.length === 0) {
            res.status(404).json({ message: 'Job not found' });
        }
        res.status(200).json(result.rows[0]);
    }
    catch (error) {
        console.error('Get Job Error:', error);
        res.status(500).json({ message: 'Server error fetching job' });
    }
};
exports.getJobById = getJobById;
// Update job
const updateJob = async (req, res) => {
    try {
        const { jobId } = req.params;
        const { title, description, location, employment_type, salary_range, required_experience, deadline, } = req.body;
        const result = await db_config_1.default.query(`UPDATE jobs
       SET title = $1, description = $2, location = $3,
           employment_type = $4, salary_range = $5,
           required_experience = $6, deadline = $7
       WHERE id = $8
       RETURNING *`, [
            title,
            description,
            location,
            employment_type,
            salary_range,
            required_experience,
            deadline,
            jobId,
        ]);
        if (result.rows.length === 0) {
            res.status(404).json({ message: 'Job not found' });
        }
        res.status(200).json({
            message: 'Job updated successfully',
            job: result.rows[0],
        });
    }
    catch (error) {
        console.error('Update Job Error:', error);
        res.status(500).json({ message: 'Server error updating job' });
    }
};
exports.updateJob = updateJob;
// Delete job
const deleteJob = async (req, res) => {
    try {
        const { jobId } = req.params;
        const result = await db_config_1.default.query(`DELETE FROM jobs WHERE id = $1 RETURNING *`, [jobId]);
        if (result.rows.length === 0) {
            res.status(404).json({ message: 'Job not found' });
        }
        res.status(200).json({ message: 'Job deleted successfully' });
    }
    catch (error) {
        console.error('Delete Job Error:', error);
        res.status(500).json({ message: 'Server error deleting job' });
    }
};
exports.deleteJob = deleteJob;
