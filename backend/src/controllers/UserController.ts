import { Request, Response } from 'express';
import db from '../db/db.config';

// Create a new user
export const createUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password_hash, user_type } = req.body;

    // Ensure that required fields are provided
    if (!name || !email || !password_hash || !user_type) {
      res.status(400).json({ message: 'Missing required fields' });
      return;
    }

    // Insert the user into the database
    const result = await db.query(
      `INSERT INTO users (name, email, password_hash, user_type) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id, name, email, user_type, created_at`,
      [name, email, password_hash, user_type]
    );

    res.status(201).json({ user: result.rows[0] });
  } catch (error) {
    console.error('Create User Error:', error);
    res.status(500).json({ message: 'Error creating user' });
  }
};

// Other controller functions like getAllUsers, getUserById, etc.


// Get all users
export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await db.query('SELECT id, name, email, user_type, created_at FROM users');
    res.status(200).json({ users: result.rows });
  } catch (error) {
    console.error('Get Users Error:', error);
    res.status(500).json({ message: 'Error fetching users' });
  }
};

// Get a user by ID
export const getUserById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const result = await db.query(
      'SELECT id, name, email, user_type, created_at FROM users WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    res.status(200).json({ user: result.rows[0] });
  } catch (error) {
    console.error('Get User Error:', error);
    res.status(500).json({ message: 'Error fetching user' });
  }
};

// Get users by user type
export const getUsersByType = async (req: Request, res: Response): Promise<void> => {
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

// Update a user by ID
export const updateUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, email, password_hash, user_type } = req.body;

    const result = await db.query(
      `UPDATE users 
       SET name = $1, email = $2, password_hash = $3, user_type = $4 
       WHERE id = $5 
       RETURNING id, name, email, user_type, created_at`,
      [name, email, password_hash, user_type, id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ message: 'User not found or not updated' });
      return;
    }

    res.status(200).json({ user: result.rows[0] });
  } catch (error) {
    console.error('Update User Error:', error);
    res.status(500).json({ message: 'Error updating user' });
  }
};

// Delete a user by ID
export const deleteUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const result = await db.query(
      'DELETE FROM users WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ message: 'User not found or already deleted' });
      return;
    }

    res.status(200).json({ message: 'User deleted successfully', userId: result.rows[0].id });
  } catch (error) {
    console.error('Delete User Error:', error);
    res.status(500).json({ message: 'Error deleting user' });
  }
};
