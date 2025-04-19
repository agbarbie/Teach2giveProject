"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getInterviewsByApplicant = exports.getAllInterviewRequests = exports.createInterviewRequest = void 0;
const db_config_1 = __importDefault(require("../db/db.config"));
// Create an interview request
const createInterviewRequest = async (req, res) => {
    try {
        const { job_id, applicant_id, scheduled_time, status } = req.body;
        const result = await db_config_1.default.query(`INSERT INTO interview_requests (job_id, applicant_id, scheduled_time, status)
       VALUES ($1, $2, $3, $4) RETURNING *`, [job_id, applicant_id, scheduled_time, status || 'pending']);
        res.status(201).json({
            message: 'Interview request created',
            interview: result.rows[0],
        });
    }
    catch (error) {
        console.error('Create Interview Error:', error);
        res.status(500).json({ message: 'Server error creating interview request' });
    }
};
exports.createInterviewRequest = createInterviewRequest;
// Get all interview requests
const getAllInterviewRequests = async (_req, res) => {
    try {
        const result = await db_config_1.default.query(`SELECT * FROM interview_requests`);
        res.status(200).json(result.rows);
    }
    catch (error) {
        console.error('Fetch Interviews Error:', error);
        res.status(500).json({ message: 'Server error fetching interview requests' });
    }
};
exports.getAllInterviewRequests = getAllInterviewRequests;
// Get interview requests for a specific applicant
const getInterviewsByApplicant = async (req, res) => {
    try {
        const { applicant_id } = req.params;
        const result = await db_config_1.default.query(`SELECT * FROM interview_requests WHERE applicant_id = $1`, [applicant_id]);
        res.status(200).json(result.rows);
    }
    catch (error) {
        console.error('Fetch Interviews Error:', error);
        res.status(500).json({ message: 'Server error fetching applicant interviews' });
    }
};
exports.getInterviewsByApplicant = getInterviewsByApplicant;
