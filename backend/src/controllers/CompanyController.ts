import { Request, Response } from 'express';
import db from '../db/db.config';

// Create a new company
export const createCompany = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description, website } = req.body;

    const result = await db.query(
      `INSERT INTO companies (name, description, website)
       VALUES ($1, $2, $3) RETURNING *`,
      [name, description, website]
    );

    res.status(201).json({
      message: 'Company created successfully',
      company: result.rows[0],
    });
  } catch (error) {
    console.error('Create Company Error:', error);
    res.status(500).json({ message: 'Server error creating company' });
  }
};

// Get all companies
export const getCompanies = async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await db.query(`SELECT * FROM companies`);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Get Companies Error:', error);
    res.status(500).json({ message: 'Server error fetching companies' });
  }
};

// Get a specific company by ID
export const getCompanyById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const result = await db.query(`SELECT * FROM companies WHERE id = $1`, [id]);

    if (result.rows.length === 0) {
      res.status(404).json({ message: 'Company not found' });
      return;
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Get Company Error:', error);
    res.status(500).json({ message: 'Server error fetching company' });
  }
};
