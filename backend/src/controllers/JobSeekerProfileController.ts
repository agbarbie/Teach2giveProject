import { Request, Response } from 'express';
import db from '../db/db.config';

// Create or update a Job Seeker Profile
export const upsertJobSeekerProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      user_id,
      bio,
      experience,
      education,
      location,
      phone,
      linkedin_url,
      github_url
    } = req.body;

    // Check if profile already exists
    const existing = await db.query(
      `SELECT * FROM jobseeker_profiles WHERE user_id = $1`,
      [user_id]
    );

    let result;
    if (existing.rows.length > 0) {
      // Update
      result = await db.query(
        `UPDATE jobseeker_profiles
         SET bio = $1, experience = $2, education = $3, location = $4, phone = $5,
             linkedin_url = $6, github_url = $7
         WHERE user_id = $8 RETURNING *`,
        [bio, experience, education, location, phone, linkedin_url, github_url, user_id]
      );
    } else {
      // Create
      result = await db.query(
        `INSERT INTO jobseeker_profiles
         (user_id, bio, experience, education, location, phone, linkedin_url, github_url)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
        [user_id, bio, experience, education, location, phone, linkedin_url, github_url]
      );
    }

    res.status(200).json({ profile: result.rows[0] });
  } catch (error) {
    console.error('Upsert Profile Error:', error);
    res.status(500).json({ message: 'Server error while saving profile' });
  }
};

// Get profile by user_id
export const getJobSeekerProfile = async (req: Request, res: Response):Promise<void> => {
  try {
    const { user_id } = req.params;

    const result = await db.query(
      `SELECT * FROM jobseeker_profiles WHERE user_id = $1`,
      [user_id]
    );

    if (result.rows.length === 0)
      res.status(404).json({ message: 'Profile not found' });

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Fetch Profile Error:', error);
    res.status(500).json({ message: 'Server error fetching profile' });
  }
};
