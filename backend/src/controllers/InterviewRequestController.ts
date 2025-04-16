import { Request, Response } from 'express';
import db from '../db/db.config';

// Create an interview request
export const createInterviewRequest = async (req: Request, res: Response): Promise<void> => {
  try {
    const { job_id, applicant_id, scheduled_time, status } = req.body;

    const result = await db.query(
      `INSERT INTO interview_requests (job_id, applicant_id, scheduled_time, status)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [job_id, applicant_id, scheduled_time, status || 'pending']
    );

    res.status(201).json({
      message: 'Interview request created',
      interview: result.rows[0],
    });
  } catch (error) {
    console.error('Create Interview Error:', error);
    res.status(500).json({ message: 'Server error creating interview request' });
  }
};

// Get all interview requests
export const getAllInterviewRequests = async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await db.query(`SELECT * FROM interview_requests`);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Fetch Interviews Error:', error);
    res.status(500).json({ message: 'Server error fetching interview requests' });
  }
};

// Get interview requests for a specific applicant
export const getInterviewsByApplicant = async (req: Request, res: Response): Promise<void> => {
  try {
    const { applicant_id } = req.params;
    const result = await db.query(
      `SELECT * FROM interview_requests WHERE applicant_id = $1`,
      [applicant_id]
    );

    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Fetch Interviews Error:', error);
    res.status(500).json({ message: 'Server error fetching applicant interviews' });
  }
};
