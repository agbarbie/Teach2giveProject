import { Request, Response } from 'express';
import db from '../db/db.config';

// Apply for a job
export const applyForJob = async (req: Request, res: Response): Promise<void> => {
  try {
    const { job_id, user_id, resume_url, cover_letter } = req.body;

    const result = await db.query(
      `INSERT INTO applications (job_id, user_id, resume_url, cover_letter)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [job_id, user_id, resume_url, cover_letter]
    );

    res.status(201).json({ message: 'Application submitted', application: result.rows[0] });
  } catch (error) {
    console.error('Apply Error:', error);
    res.status(500).json({ message: 'Server error submitting application' });
  }
};

// Get all applications
export const getAllApplications = async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await db.query(`SELECT * FROM applications ORDER BY created_at DESC`);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Fetch Applications Error:', error);
    res.status(500).json({ message: 'Server error fetching applications' });
  }
};

// Get applications for a specific user
export const getApplicationsByUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const result = await db.query(
      `SELECT * FROM applications WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId]
    );

    res.status(200).json(result.rows);
  } catch (error) {
    console.error('User Applications Error:', error);
    res.status(500).json({ message: 'Server error fetching applications by user' });
  }
};

// Get applications for a specific job
export const getApplicationsByJob = async (req: Request, res: Response): Promise<void> => {
  try {
    const { jobId } = req.params;
    const result = await db.query(
      `SELECT * FROM applications WHERE job_id = $1 ORDER BY created_at DESC`,
      [jobId]
    );

    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Job Applications Error:', error);
    res.status(500).json({ message: 'Server error fetching applications by job' });
  }
};

// Delete application
export const deleteApplication = async (req: Request, res: Response): Promise<void> => {
  try {
    const { applicationId } = req.params;
    const result = await db.query(
      `DELETE FROM applications WHERE id = $1 RETURNING *`,
      [applicationId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ message: 'Application not found' });
    } else {
      res.status(200).json({ message: 'Application deleted' });
    }
  } catch (error) {
    console.error('Delete Application Error:', error);
    res.status(500).json({ message: 'Server error deleting application' });
  }
};
