"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getJobseekerCertificatesByUserId = exports.deleteUserCertificate = exports.updateUserCertificate = exports.addUserCertificate = exports.getUserCertificates = void 0;
const asyncHandlers_1 = __importDefault(require("../middlewares/asyncHandlers"));
const db_config_1 = __importDefault(require("../db/db.config"));
const errorMiddlewares_1 = require("../middlewares/errorMiddlewares");
const helpers_1 = require("../utils/helpers");
// @desc    Get user's certificates
// @route   GET /api/users/certificates
// @access  Private (Jobseeker)
exports.getUserCertificates = (0, asyncHandlers_1.default)(async (req, res) => {
    const userId = req.user?.id;
    const result = await db_config_1.default.query(`SELECT * FROM user_certificates
     WHERE user_id = $1
     ORDER BY issue_date DESC`, [userId]);
    res.json((0, helpers_1.formatSuccess)(result.rows, 'User certificates retrieved successfully'));
});
// @desc    Add certificate to user profile
// @route   POST /api/users/certificates
// @access  Private (Jobseeker)
exports.addUserCertificate = (0, asyncHandlers_1.default)(async (req, res) => {
    const userId = req.user?.id;
    const { title, issuer, issue_date, expiry_date, credential_id, credential_url } = req.body;
    // Validate input
    if (!title || !issuer || !issue_date) {
        throw new errorMiddlewares_1.AppError('Title, issuer and issue date are required', 400);
    }
    // Add certificate to user profile
    const result = await db_config_1.default.query(`INSERT INTO user_certificates 
     (user_id, title, issuer, issue_date, expiry_date, credential_id, credential_url, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
     RETURNING *`, [
        userId,
        title,
        issuer,
        issue_date,
        expiry_date || null,
        credential_id || null,
        credential_url || null
    ]);
    res.status(201).json((0, helpers_1.formatSuccess)(result.rows[0], 'Certificate added to profile successfully'));
});
// @desc    Update user certificate
// @route   PUT /api/users/certificates/:id
// @access  Private (Jobseeker)
exports.updateUserCertificate = (0, asyncHandlers_1.default)(async (req, res) => {
    const userId = req.user?.id;
    const certificateId = parseInt(req.params.id);
    const { title, issuer, issue_date, expiry_date, credential_id, credential_url } = req.body;
    // Check if certificate exists and belongs to the user
    const certificateExists = await db_config_1.default.query('SELECT * FROM user_certificates WHERE id = $1 AND user_id = $2', [certificateId, userId]);
    if (certificateExists.rows.length === 0) {
        throw new errorMiddlewares_1.AppError('Certificate not found in your profile or you do not have permission', 404);
    }
    // Update fields
    const updateFields = [];
    const queryParams = [];
    let paramCounter = 1;
    if (title !== undefined) {
        updateFields.push(`title = $${paramCounter}`);
        queryParams.push(title);
        paramCounter++;
    }
    if (issuer !== undefined) {
        updateFields.push(`issuer = $${paramCounter}`);
        queryParams.push(issuer);
        paramCounter++;
    }
    if (issue_date !== undefined) {
        updateFields.push(`issue_date = $${paramCounter}`);
        queryParams.push(issue_date);
        paramCounter++;
    }
    if (expiry_date !== undefined) {
        updateFields.push(`expiry_date = $${paramCounter}`);
        queryParams.push(expiry_date);
        paramCounter++;
    }
    if (credential_id !== undefined) {
        updateFields.push(`credential_id = $${paramCounter}`);
        queryParams.push(credential_id);
        paramCounter++;
    }
    if (credential_url !== undefined) {
        updateFields.push(`credential_url = $${paramCounter}`);
        queryParams.push(credential_url);
        paramCounter++;
    }
    // Add updated_at and certificate ID
    updateFields.push(`updated_at = NOW()`);
    queryParams.push(certificateId);
    // Update the certificate
    const updateQuery = `
    UPDATE user_certificates 
    SET ${updateFields.join(', ')} 
    WHERE id = $${paramCounter} 
    RETURNING *
  `;
    const result = await db_config_1.default.query(updateQuery, queryParams);
    res.json((0, helpers_1.formatSuccess)(result.rows[0], 'Certificate updated successfully'));
});
// @desc    Delete user certificate
// @route   DELETE /api/users/certificates/:id
// @access  Private (Jobseeker)
exports.deleteUserCertificate = (0, asyncHandlers_1.default)(async (req, res) => {
    const userId = req.user?.id;
    const certificateId = parseInt(req.params.id);
    // Check if certificate exists and belongs to the user
    const certificateExists = await db_config_1.default.query('SELECT * FROM user_certificates WHERE id = $1 AND user_id = $2', [certificateId, userId]);
    if (certificateExists.rows.length === 0) {
        throw new errorMiddlewares_1.AppError('Certificate not found in your profile or you do not have permission', 404);
    }
    // Delete the certificate
    await db_config_1.default.query('DELETE FROM user_certificates WHERE id = $1', [certificateId]);
    res.json((0, helpers_1.formatSuccess)(null, 'Certificate removed from profile successfully'));
});
// @desc    Get jobseeker's certificates by user ID (for employers to view)
// @route   GET /api/users/:id/certificates
// @access  Public
exports.getJobseekerCertificatesByUserId = (0, asyncHandlers_1.default)(async (req, res) => {
    const jobseekerId = parseInt(req.params.id);
    // Check if user exists and is a jobseeker
    const userExists = await db_config_1.default.query('SELECT * FROM users WHERE id = $1 AND role = $2', [jobseekerId, 'jobseeker']);
    if (userExists.rows.length === 0) {
        throw new errorMiddlewares_1.AppError('Jobseeker not found', 404);
    }
    const result = await db_config_1.default.query(`SELECT id, title, issuer, issue_date, expiry_date, credential_id, credential_url
     FROM user_certificates
     WHERE user_id = $1
     ORDER BY issue_date DESC`, [jobseekerId]);
    res.json((0, helpers_1.formatSuccess)(result.rows, 'Jobseeker certificates retrieved successfully'));
});
