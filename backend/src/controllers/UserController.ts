import { Request, Response } from 'express';
import db from '../db/db.config';

// Get all users
export const getAllUsers = async (req: Request, res: Response) :Promise<void>=> {
  try {
    const result = await db.query('SELECT id, name, email, user_type, created_at FROM users');
    res.status(200).json({ users: result.rows });
  } catch (error) {
    console.error('Get Users Error:', error);
    res.status(500).json({ message: 'Error fetching users' });
  }
};

// Get a user by ID
export const getUserById = async (req: Request, res: Response):Promise<void> => {
  try {
    const { id } = req.params;
    const result = await db.query(
      'SELECT id, name, email, user_type, created_at FROM users WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ user: result.rows[0] });
  } catch (error) {
    console.error('Get User Error:', error);
    res.status(500).json({ message: 'Error fetching user' });
  }
};

// Get users by user type (e.g., "employer", "job_seeker", "admin")
export const getUsersByType = async (req: Request, res: Response) :Promise<void> => {
  try {
    const { user_type } = req.params;

    const result = await db.query(
      'SELECT id, name, email, user_type, created_at FROM users WHERE user_type = $1',
      [user_type]
    );

    res.status(200).json({ users: result.rows });
  } catch (error) {
    console.error('Get Users By Type Error:', error);
    res.status(500).json({ message: 'Error fetching users by type' });
  }
};
