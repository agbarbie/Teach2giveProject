"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteApplication = exports.getApplicationsByJob = exports.getApplicationsByUser = exports.getAllApplications = exports.applyForJob = void 0;
const db_config_1 = __importDefault(require("../db/db.config"));
// Apply for a job
const applyForJob = async (req, res) => {
    try {
        const { job_id, user_id, resume_url, cover_letter } = req.body;
        const result = await db_config_1.default.query(`INSERT INTO applications (job_id, user_id, resume_url, cover_letter)
       VALUES ($1, $2, $3, $4) RETURNING *`, [job_id, user_id, resume_url, cover_letter]);
        res.status(201).json({ message: 'Application submitted', application: result.rows[0] });
    }
    catch (error) {
        console.error('Apply Error:', error);
        res.status(500).json({ message: 'Server error submitting application' });
    }
};
exports.applyForJob = applyForJob;
// Get all applications
const getAllApplications = async (_req, res) => {
    try {
        const result = await db_config_1.default.query(`SELECT * FROM applications ORDER BY created_at DESC`);
        res.status(200).json(result.rows);
    }
    catch (error) {
        console.error('Fetch Applications Error:', error);
        res.status(500).json({ message: 'Server error fetching applications' });
    }
};
exports.getAllApplications = getAllApplications;
// Get applications for a specific user
const getApplicationsByUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const result = await db_config_1.default.query(`SELECT * FROM applications WHERE user_id = $1 ORDER BY created_at DESC`, [userId]);
        res.status(200).json(result.rows);
    }
    catch (error) {
        console.error('User Applications Error:', error);
        res.status(500).json({ message: 'Server error fetching applications by user' });
    }
};
exports.getApplicationsByUser = getApplicationsByUser;
// Get applications for a specific job
const getApplicationsByJob = async (req, res) => {
    try {
        const { jobId } = req.params;
        const result = await db_config_1.default.query(`SELECT * FROM applications WHERE job_id = $1 ORDER BY created_at DESC`, [jobId]);
        res.status(200).json(result.rows);
    }
    catch (error) {
        console.error('Job Applications Error:', error);
        res.status(500).json({ message: 'Server error fetching applications by job' });
    }
};
exports.getApplicationsByJob = getApplicationsByJob;
// Delete application
const deleteApplication = async (req, res) => {
    try {
        const { applicationId } = req.params;
        const result = await db_config_1.default.query(`DELETE FROM applications WHERE id = $1 RETURNING *`, [applicationId]);
        if (result.rows.length === 0) {
            res.status(404).json({ message: 'Application not found' });
        }
        else {
            res.status(200).json({ message: 'Application deleted' });
        }
    }
    catch (error) {
        console.error('Delete Application Error:', error);
        res.status(500).json({ message: 'Server error deleting application' });
    }
};
exports.deleteApplication = deleteApplication;
