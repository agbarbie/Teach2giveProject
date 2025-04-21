"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.withdrawApplication = exports.updateApplicationStatus = exports.createApplication = exports.getApplicationById = exports.getJobApplications = exports.getMyApplications = void 0;
const asyncHandlers_1 = __importDefault(require("../middlewares/asyncHandlers"));
const db_config_1 = __importDefault(require("../db/db.config"));
const errorMiddlewares_1 = require("../middlewares/errorMiddlewares");
const helpers_1 = require("../utils/helpers");
// @desc    Get my applications (for job seekers)
// @route   GET /api/applications
// @access  Private/JobSeeker
exports.getMyApplications = (0, asyncHandlers_1.default)(async (req, res) => {
    const userId = req.user?.id;
    const result = await db_config_1.default.query(`SELECT a.*, j.title as job_title, c.name as company_name, j.location as job_location
     FROM applications a
     JOIN jobs j ON a.job_id = j.id
     JOIN companies c ON j.company_id = c.id
     WHERE a.user_id = $1
     ORDER BY a.created_at DESC`, [userId]);
    res.json((0, helpers_1.formatSuccess)(result.rows, 'Applications retrieved successfully'));
});
// @desc    Get applications for a job (for employers)
// @route   GET /api/applications/job/:jobId
// @access  Private/Employer
exports.getJobApplications = (0, asyncHandlers_1.default)(async (req, res) => {
    const jobId = parseInt(req.params.jobId);
    const userId = req.user?.id;
    // Check if job exists and user is the owner of the company
    const jobResult = await db_config_1.default.query(`SELECT j.*, c.owner_id 
     FROM jobs j
     JOIN companies c ON j.company_id = c.id
     WHERE j.id = $1`, [jobId]);
    if (jobResult.rows.length === 0) {
        throw new errorMiddlewares_1.AppError('Job not found', 404);
    }
    const job = jobResult.rows[0];
    // Check ownership or admin rights
    if (job.owner_id !== userId && req.user?.role !== 'admin') {
        throw new errorMiddlewares_1.AppError('Not authorized to view applications for this job', 403);
    }
    const result = await db_config_1.default.query(`SELECT a.*, u.email as user_email, p.full_name, p.profile_picture, p.resume_url
     FROM applications a
     JOIN users u ON a.user_id = u.id
     LEFT JOIN jobseeker_profiles p ON a.user_id = p.user_id
     WHERE a.job_id = $1
     ORDER BY a.created_at DESC`, [jobId]);
    res.json((0, helpers_1.formatSuccess)(result.rows, 'Applications retrieved successfully'));
});
// @desc    Get application by ID
// @route   GET /api/applications/:id
// @access  Private
exports.getApplicationById = (0, asyncHandlers_1.default)(async (req, res) => {
    const applicationId = parseInt(req.params.id);
    const userId = req.user?.id;
    const userRole = req.user?.role;
    // Get application with related data
    const result = await db_config_1.default.query(`SELECT a.*, j.title as job_title, c.name as company_name, 
            j.company_id, c.owner_id as company_owner_id,
            u.email as user_email, p.full_name, p.profile_picture, p.resume_url
     FROM applications a
     JOIN jobs j ON a.job_id = j.id
     JOIN companies c ON j.company_id = c.id
     JOIN users u ON a.user_id = u.id
     LEFT JOIN jobseeker_profiles p ON a.user_id = p.user_id
     WHERE a.id = $1`, [applicationId]);
    if (result.rows.length === 0) {
        throw new errorMiddlewares_1.AppError('Application not found', 404);
    }
    const application = result.rows[0];
    // Check permissions
    const isOwnerOfApplication = application.user_id === userId;
    const isOwnerOfCompany = application.company_owner_id === userId;
    const isAdmin = userRole === 'admin';
    if (!isOwnerOfApplication && !isOwnerOfCompany && !isAdmin) {
        throw new errorMiddlewares_1.AppError('Not authorized to view this application', 403);
    }
    res.json((0, helpers_1.formatSuccess)(application, 'Application retrieved successfully'));
});
// @desc    Create application
// @route   POST /api/applications
// @access  Private/JobSeeker
exports.createApplication = (0, asyncHandlers_1.default)(async (req, res) => {
    const userId = req.user?.id;
    const { job_id, cover_letter } = req.body;
    if (!job_id) {
        throw new errorMiddlewares_1.AppError('Job ID is required', 400);
    }
    // Check if job exists and is open
    const jobResult = await db_config_1.default.query('SELECT * FROM jobs WHERE id = $1', [job_id]);
    if (jobResult.rows.length === 0) {
        throw new errorMiddlewares_1.AppError('Job not found', 404);
    }
    const job = jobResult.rows[0];
    if (job.status !== 'open') {
        throw new errorMiddlewares_1.AppError('This job is not open for applications', 400);
    }
    // Check if user has already applied
    const existingApplication = await db_config_1.default.query('SELECT * FROM applications WHERE job_id = $1 AND user_id = $2', [job_id, userId]);
    if (existingApplication.rows.length > 0) {
        throw new errorMiddlewares_1.AppError('You have already applied for this job', 400);
    }
    // Create application
    const result = await db_config_1.default.query(`INSERT INTO applications (job_id, user_id, cover_letter, status, created_at, updated_at)
     VALUES ($1, $2, $3, $4, NOW(), NOW())
     RETURNING *`, [job_id, userId, cover_letter || null, 'pending']);
    // Update job match status if it exists
    await db_config_1.default.query(`UPDATE job_matches 
     SET status = 'applied' 
     WHERE job_id = $1 AND user_id = $2`, [job_id, userId]);
    res.status(201).json((0, helpers_1.formatSuccess)(result.rows[0], 'Application submitted successfully'));
});
// @desc    Update application status (employer only)
// @route   PUT /api/applications/:id/status
// @access  Private/Employer
exports.updateApplicationStatus = (0, asyncHandlers_1.default)(async (req, res) => {
    const applicationId = parseInt(req.params.id);
    const userId = req.user?.id;
    const { status } = req.body;
    if (!status) {
        throw new errorMiddlewares_1.AppError('Status is required', 400);
    }
    const validStatuses = ['pending', 'reviewing', 'interview', 'rejected', 'accepted'];
    if (!validStatuses.includes(status)) {
        throw new errorMiddlewares_1.AppError('Invalid status', 400);
    }
    // Get application with company ownership info
    const applicationResult = await db_config_1.default.query(`SELECT a.*, j.company_id, c.owner_id as company_owner_id
     FROM applications a
     JOIN jobs j ON a.job_id = j.id
     JOIN companies c ON j.company_id = c.id
     WHERE a.id = $1`, [applicationId]);
    if (applicationResult.rows.length === 0) {
        throw new errorMiddlewares_1.AppError('Application not found', 404);
    }
    const application = applicationResult.rows[0];
    // Check if user is the owner of the company
    if (application.company_owner_id !== userId && req.user?.role !== 'admin') {
        throw new errorMiddlewares_1.AppError('Not authorized to update this application', 403);
    }
    // Update application status
    const result = await db_config_1.default.query(`UPDATE applications 
     SET status = $1, updated_at = NOW() 
     WHERE id = $2 
     RETURNING *`, [status, applicationId]);
    res.json((0, helpers_1.formatSuccess)(result.rows[0], 'Application status updated successfully'));
});
// @desc    Withdraw application (job seeker only)
// @route   DELETE /api/applications/:id
// @access  Private/JobSeeker
exports.withdrawApplication = (0, asyncHandlers_1.default)(async (req, res) => {
    const applicationId = parseInt(req.params.id);
    const userId = req.user?.id;
    // Check if application exists and belongs to user
    const applicationResult = await db_config_1.default.query('SELECT * FROM applications WHERE id = $1', [applicationId]);
    if (applicationResult.rows.length === 0) {
        throw new errorMiddlewares_1.AppError('Application not found', 404);
    }
    const application = applicationResult.rows[0];
    if (application.user_id !== userId) {
        throw new errorMiddlewares_1.AppError('Not authorized to withdraw this application', 403);
    }
    // Delete interview requests first (due to foreign key constraints)
    await db_config_1.default.query('DELETE FROM interview_requests WHERE application_id = $1', [applicationId]);
    // Delete application
    await db_config_1.default.query('DELETE FROM applications WHERE id = $1', [applicationId]);
    res.json((0, helpers_1.formatSuccess)(null, 'Application withdrawn successfully'));
});
