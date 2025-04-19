"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCompanyById = exports.getCompanies = exports.createCompany = void 0;
const db_config_1 = __importDefault(require("../db/db.config"));
// Create a new company
const createCompany = async (req, res) => {
    try {
        const { name, description, website } = req.body;
        const result = await db_config_1.default.query(`INSERT INTO companies (name, description, website)
       VALUES ($1, $2, $3) RETURNING *`, [name, description, website]);
        res.status(201).json({
            message: 'Company created successfully',
            company: result.rows[0],
        });
    }
    catch (error) {
        console.error('Create Company Error:', error);
        res.status(500).json({ message: 'Server error creating company' });
    }
};
exports.createCompany = createCompany;
// Get all companies
const getCompanies = async (_req, res) => {
    try {
        const result = await db_config_1.default.query(`SELECT * FROM companies`);
        res.status(200).json(result.rows);
    }
    catch (error) {
        console.error('Get Companies Error:', error);
        res.status(500).json({ message: 'Server error fetching companies' });
    }
};
exports.getCompanies = getCompanies;
// Get a specific company by ID
const getCompanyById = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await db_config_1.default.query(`SELECT * FROM companies WHERE id = $1`, [id]);
        if (result.rows.length === 0) {
            res.status(404).json({ message: 'Company not found' });
            return;
        }
        res.status(200).json(result.rows[0]);
    }
    catch (error) {
        console.error('Get Company Error:', error);
        res.status(500).json({ message: 'Server error fetching company' });
    }
};
exports.getCompanyById = getCompanyById;
