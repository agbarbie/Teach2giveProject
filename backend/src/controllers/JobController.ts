import { Request, Response } from 'express';
import db from '../db/db.config';

// Create a new job
export const createJob = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      company_id,
      title,
      description,
      location,
      employment_type,
      salary_range,
      required_experience,
      deadline,
    } = req.body;

    const result = await db.query(
      `INSERT INTO jobs (company_id, title, description, location, employment_type, salary_range, required_experience, deadline)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [company_id, title, description, location, employment_type, salary_range, required_experience, deadline]
    );

    res.status(201).json({
      message: 'Job created successfully',
      job: result.rows[0],
    });
  } catch (error) {
    console.error('Create Job Error:', error);
    res.status(500).json({ message: 'Server error creating job' });
  }
};

// Get all jobs
export const getAllJobs = async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await db.query(`SELECT * FROM jobs ORDER BY created_at DESC`);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Get Jobs Error:', error);
    res.status(500).json({ message: 'Server error fetching jobs' });
  }
};

// Get job by ID
export const getJobById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { jobId } = req.params;

    const result = await db.query(`SELECT * FROM jobs WHERE id = $1`, [jobId]);

    if (result.rows.length === 0) {
      res.status(404).json({ message: 'Job not found' });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Get Job Error:', error);
    res.status(500).json({ message: 'Server error fetching job' });
  }
};

// Update job
export const updateJob = async (req: Request, res: Response): Promise<void> => {
  try {
    const { jobId } = req.params;
    const {
      title,
      description,
      location,
      employment_type,
      salary_range,
      required_experience,
      deadline,
    } = req.body;

    const result = await db.query(
      `UPDATE jobs
       SET title = $1, description = $2, location = $3,
           employment_type = $4, salary_range = $5,
           required_experience = $6, deadline = $7
       WHERE id = $8
       RETURNING *`,
      [
        title,
        description,
        location,
        employment_type,
        salary_range,
        required_experience,
        deadline,
        jobId,
      ]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ message: 'Job not found' });
    }

    res.status(200).json({
      message: 'Job updated successfully',
      job: result.rows[0],
    });
  } catch (error) {
    console.error('Update Job Error:', error);
    res.status(500).json({ message: 'Server error updating job' });
  }
};

// Delete job
export const deleteJob = async (req: Request, res: Response): Promise<void> => {
  try {
    const { jobId } = req.params;

    const result = await db.query(`DELETE FROM jobs WHERE id = $1 RETURNING *`, [jobId]);

    if (result.rows.length === 0) {
      res.status(404).json({ message: 'Job not found' });
    }

    res.status(200).json({ message: 'Job deleted successfully' });
  } catch (error) {
    console.error('Delete Job Error:', error);
    res.status(500).json({ message: 'Server error deleting job' });
  }
};
