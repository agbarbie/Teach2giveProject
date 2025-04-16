import { Request, Response } from 'express';
import db from '../db/db.config';

// Add a skill to a user
export const addSkillToUser = async (req: Request, res: Response):Promise<void>=> {
  try {
    const { user_id, skill_name } = req.body;

    // First check if skill exists, if not insert
    const skillResult = await db.query(
      `INSERT INTO skills (name)
       VALUES ($1)
       ON CONFLICT (name) DO NOTHING
       RETURNING id`,
      [skill_name]
    );

    // Get skill id
    const skillId = skillResult.rows[0]?.id || (await db.query(
      `SELECT id FROM skills WHERE name = $1`, [skill_name]
    )).rows[0]?.id;

    if (!skillId) {
      res.status(500).json({ message: 'Skill could not be found or created' });
      return;
    }

    // Add skill to user
    await db.query(
      `INSERT INTO user_skills (user_id, skill_id) VALUES ($1, $2)`,
      [user_id, skillId]
    );

    res.status(200).json({ message: 'Skill added to user' });
  } catch (error) {
    console.error('Add Skill Error:', error);
    res.status(500).json({ message: 'Server error adding skill' });
  }
};

// Get user skills
export const getUserSkills = async (req: Request, res: Response):Promise<void> => {
  try {
    const { userId } = req.params;

    const result = await db.query(
      `SELECT s.name FROM skills s
       INNER JOIN user_skills us ON s.id = us.skill_id
       WHERE us.user_id = $1`,
      [userId]
    );

    res.status(200).json(result.rows.map(row => row.name));
  } catch (error) {
    console.error('Get Skills Error:', error);
    res.status(500).json({ message: 'Server error fetching user skills' });
  }
};

// Match jobs to user's skills
export const getMatchingJobs = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const result = await db.query(
      `SELECT DISTINCT j.* FROM jobs j
       JOIN job_skills js ON j.id = js.job_id
       WHERE js.skill_id IN (
         SELECT skill_id FROM user_skills WHERE user_id = $1
       )`,
      [userId]
    );

    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Match Jobs Error:', error);
    res.status(500).json({ message: 'Server error matching jobs' });
  }
};
