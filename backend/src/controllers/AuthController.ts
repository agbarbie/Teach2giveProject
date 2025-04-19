import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../db/db.config';

const JWT_SECRET = process.env.JWT_SECRET || 'skillmatches_secret';

// Register
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, user_type } = req.body;

    const existingUserQuery = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (existingUserQuery.rows.length > 0) {
      res.status(400).json({ message: 'User already exists' });
      return;
    }

    const password_hash = await bcrypt.hash(password, 10);

    const newUserQuery = await pool.query(
      'INSERT INTO users (name, email, password_hash, user_type) VALUES ($1, $2, $3, $4) RETURNING id, name, email, user_type',
      [name, email, password_hash, user_type]
    );

    res.status(201).json({
      message: 'User registered successfully',
      user: newUserQuery.rows[0],
    });
  } catch (error) {
    console.error('Registration Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Login
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    const userQuery = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    const user = userQuery.rows[0];

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      res.status(401).json({ message: 'Invalid credentialss' });
      return;
    }

    const token = jwt.sign(
      { id: user.id, user_type: user.user_type },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        user_type: user.user_type,
      },
    });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
