"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cancelInterview = exports.rescheduleInterview = exports.updateInterviewStatus = exports.createInterviewRequest = exports.getCompanyInterviews = exports.getMyInterviews = exports.getInterviewsByApplication = void 0;
const asyncHandlers_1 = __importDefault(require("../middlewares/asyncHandlers"));
const db_config_1 = __importDefault(require("../db/db.config"));
const errorMiddlewares_1 = require("../middlewares/errorMiddlewares");
const helpers_1 = require("../utils/helpers");
// @desc    Get interview requests by application ID
// @route   GET /api/interviews/application/:applicationId
// @access  Private
exports.getInterviewsByApplication = (0, asyncHandlers_1.default)(async (req, res) => {
    const applicationId = parseInt(req.params.applicationId);
    const userId = req.user?.id;
    // Verify application exists and check permissions
    const applicationResult = await db_config_1.default.query(`SELECT a.*, j.company_id, c.owner_id as company_owner_id
     FROM applications a
     JOIN jobs j ON a.job_id = j.id
     JOIN companies c ON j.company_id = c.id
     WHERE a.id = $1`, [applicationId]);
    if (applicationResult.rows.length === 0) {
        throw new errorMiddlewares_1.AppError('Application not found', 404);
    }
    const application = applicationResult.rows[0];
    // Check if user is the applicant or the employer
    const isApplicant = application.user_id === userId;
    const isEmployer = application.company_owner_id === userId;
    const isAdmin = req.user?.role === 'admin';
    if (!isApplicant && !isEmployer && !isAdmin) {
        throw new errorMiddlewares_1.AppError('Not authorized to view interview requests for this application', 403);
    }
    // Get interview requests
    const result = await db_config_1.default.query(`SELECT * FROM interview_requests 
     WHERE application_id = $1
     ORDER BY proposed_date`, [applicationId]);
    res.json((0, helpers_1.formatSuccess)(result.rows, 'Interview requests retrieved successfully'));
});
// @desc    Get my interview requests (for job seekers)
// @route   GET /api/interviews/my
// @access  Private/JobSeeker
exports.getMyInterviews = (0, asyncHandlers_1.default)(async (req, res) => {
    const userId = req.user?.id;
    const result = await db_config_1.default.query(`SELECT ir.*, a.job_id, j.title as job_title, c.name as company_name
     FROM interview_requests ir
     JOIN applications a ON ir.application_id = a.id
     JOIN jobs j ON a.job_id = j.id
     JOIN companies c ON j.company_id = c.id
     WHERE a.user_id = $1
     ORDER BY ir.proposed_date`, [userId]);
    res.json((0, helpers_1.formatSuccess)(result.rows, 'Interview requests retrieved successfully'));
});
// @desc    Get company interviews (for employers)
// @route   GET /api/interviews/company
// @access  Private/Employer
exports.getCompanyInterviews = (0, asyncHandlers_1.default)(async (req, res) => {
    const userId = req.user?.id;
    // Get all interviews for jobs in companies owned by this user
    const result = await db_config_1.default.query(`SELECT ir.*, a.job_id, a.user_id as applicant_id, 
            j.title as job_title, u.email as applicant_email,
            p.full_name as applicant_name, p.profile_picture
     FROM interview_requests ir
     JOIN applications a ON ir.application_id = a.id
     JOIN jobs j ON a.job_id = j.id
     JOIN companies c ON j.company_id = c.id
     JOIN users u ON a.user_id = u.id
     LEFT JOIN jobseeker_profiles p ON a.user_id = p.user_id
     WHERE c.owner_id = $1
     ORDER BY ir.proposed_date`, [userId]);
    res.json((0, helpers_1.formatSuccess)(result.rows, 'Company interviews retrieved successfully'));
});
// @desc    Create interview request (employer only)
// @route   POST /api/interviews
// @access  Private/Employer
exports.createInterviewRequest = (0, asyncHandlers_1.default)(async (req, res) => {
    const userId = req.user?.id;
    const { application_id, proposed_date, duration_minutes, interview_type, location_or_link, notes } = req.body;
    if (!application_id || !proposed_date || !duration_minutes || !interview_type) {
        throw new errorMiddlewares_1.AppError('Please provide all required fields', 400);
    }
    // Check if application exists and user is the company owner
    const applicationResult = await db_config_1.default.query(`SELECT a.*, j.company_id, c.owner_id as company_owner_id
     FROM applications a
     JOIN jobs j ON a.job_id = j.id
     JOIN companies c ON j.company_id = c.id
     WHERE a.id = $1`, [application_id]);
    if (applicationResult.rows.length === 0) {
        throw new errorMiddlewares_1.AppError('Application not found', 404);
    }
    const application = applicationResult.rows[0];
    // Check if user is the owner of the company
    if (application.company_owner_id !== userId && req.user?.role !== 'admin') {
        throw new errorMiddlewares_1.AppError('Not authorized to create interview requests for this application', 403);
    }
    // Create interview request
    const result = await db_config_1.default.query(`INSERT INTO interview_requests 
     (application_id, proposed_date, duration_minutes, interview_type, location_or_link, notes, status, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
     RETURNING *`, [
        application_id,
        proposed_date,
        duration_minutes,
        interview_type,
        location_or_link || null,
        notes || null,
        'pending'
    ]);
    // Update application status to interview
    await db_config_1.default.query(`UPDATE applications 
     SET status = 'interview', updated_at = NOW() 
     WHERE id = $1`, [application_id]);
    res.status(201).json((0, helpers_1.formatSuccess)(result.rows[0], 'Interview request created successfully'));
});
// @desc    Update interview request status (jobseeker only)
// @route   PUT /api/interviews/:id/status
// @access  Private/JobSeeker
exports.updateInterviewStatus = (0, asyncHandlers_1.default)(async (req, res) => {
    const interviewId = parseInt(req.params.id);
    const userId = req.user?.id;
    const { status } = req.body;
    if (!status) {
        throw new errorMiddlewares_1.AppError('Status is required', 400);
    }
    const validStatuses = ['accepted', 'rejected', 'rescheduled'];
    if (!validStatuses.includes(status)) {
        throw new errorMiddlewares_1.AppError('Invalid status', 400);
    }
    // Check if interview exists and user is the applicant
    const interviewResult = await db_config_1.default.query(`SELECT ir.*, a.user_id as applicant_id
     FROM interview_requests ir
     JOIN applications a ON ir.application_id = a.id
     WHERE ir.id = $1`, [interviewId]);
    if (interviewResult.rows.length === 0) {
        throw new errorMiddlewares_1.AppError('Interview request not found', 404);
    }
    const interview = interviewResult.rows[0];
    // Check if user is the applicant
    if (interview.applicant_id !== userId && req.user?.role !== 'admin') {
        throw new errorMiddlewares_1.AppError('Not authorized to update this interview request', 403);
    }
    // Update interview status
    const result = await db_config_1.default.query(`UPDATE interview_requests 
     SET status = $1, updated_at = NOW() 
     WHERE id = $2 
     RETURNING *`, [status, interviewId]);
    res.json((0, helpers_1.formatSuccess)(result.rows[0], 'Interview request status updated successfully'));
});
// @desc    Reschedule interview (employer only)
// @route   PUT /api/interviews/:id/reschedule
// @access  Private/Employer
exports.rescheduleInterview = (0, asyncHandlers_1.default)(async (req, res) => {
    const interviewId = parseInt(req.params.id);
    const userId = req.user?.id;
    const { proposed_date, duration_minutes, interview_type, location_or_link, notes } = req.body;
    if (!proposed_date) {
        throw new errorMiddlewares_1.AppError('Proposed date is required', 400);
    }
    // Check if interview exists and user is the company owner
    const interviewResult = await db_config_1.default.query(`SELECT ir.*, a.job_id, j.company_id, c.owner_id as company_owner_id
     FROM interview_requests ir
     JOIN applications a ON ir.application_id = a.id
     JOIN jobs j ON a.job_id = j.id
     JOIN companies c ON j.company_id = c.id
     WHERE ir.id = $1`, [interviewId]);
    if (interviewResult.rows.length === 0) {
        throw new errorMiddlewares_1.AppError('Interview request not found', 404);
    }
    const interview = interviewResult.rows[0];
    // Check if user is the owner of the company
    if (interview.company_owner_id !== userId && req.user?.role !== 'admin') {
        throw new errorMiddlewares_1.AppError('Not authorized to reschedule this interview', 403);
    }
    // Build update query
    let updateFields = [];
    let queryParams = [];
    let paramCounter = 1;
    updateFields.push(`proposed_date = $${paramCounter}`);
    queryParams.push(proposed_date);
    paramCounter++;
    if (duration_minutes) {
        updateFields.push(`duration_minutes = $${paramCounter}`);
        queryParams.push(duration_minutes);
        paramCounter++;
    }
    if (interview_type) {
        updateFields.push(`interview_type = $${paramCounter}`);
        queryParams.push(interview_type);
        paramCounter++;
    }
    if (location_or_link !== undefined) {
        updateFields.push(`location_or_link = $${paramCounter}`);
        queryParams.push(location_or_link);
        paramCounter++;
    }
    if (notes !== undefined) {
        updateFields.push(`notes = $${paramCounter}`);
        queryParams.push(notes);
        paramCounter++;
    }
    // Reset status to pending
    updateFields.push(`status = 'pending'`);
    // Add updated_at timestamp
    updateFields.push(`updated_at = NOW()`);
    // Build and execute the query
    const updateQuery = `
    UPDATE interview_requests 
    SET ${updateFields.join(', ')} 
    WHERE id = $${paramCounter} 
    RETURNING *
  `;
    queryParams.push(interviewId);
    const result = await db_config_1.default.query(updateQuery, queryParams);
    res.json((0, helpers_1.formatSuccess)(result.rows[0], 'Interview rescheduled successfully'));
});
// @desc    Cancel interview (either party)
// @route   DELETE /api/interviews/:id
// @access  Private
exports.cancelInterview = (0, asyncHandlers_1.default)(async (req, res) => {
    const interviewId = parseInt(req.params.id);
    const userId = req.user?.id;
    // Check if interview exists and check permissions
    const interviewResult = await db_config_1.default.query(`SELECT ir.*, a.user_id as applicant_id, j.company_id, c.owner_id as company_owner_id
     FROM interview_requests ir
     JOIN applications a ON ir.application_id = a.id
     JOIN jobs j ON a.job_id = j.id
     JOIN companies c ON j.company_id = c.id
     WHERE ir.id = $1`, [interviewId]);
    if (interviewResult.rows.length === 0) {
        throw new errorMiddlewares_1.AppError('Interview request not found', 404);
    }
    const interview = interviewResult.rows[0];
    // Check if user is the applicant or the employer
    const isApplicant = interview.applicant_id === userId;
    const isEmployer = interview.company_owner_id === userId;
    const isAdmin = req.user?.role === 'admin';
    if (!isApplicant && !isEmployer && !isAdmin) {
        throw new errorMiddlewares_1.AppError('Not authorized to cancel this interview', 403);
    }
    // Delete interview request
    await db_config_1.default.query('DELETE FROM interview_requests WHERE id = $1', [interviewId]);
    res.json((0, helpers_1.formatSuccess)(null, 'Interview request cancelled successfully'));
});
