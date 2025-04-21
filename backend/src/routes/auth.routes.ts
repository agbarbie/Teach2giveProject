import express from 'express';
import { register, login, getCurrentUser, changePassword } from '../controllers/AuthController';
import { protect } from '../middlewares/protect';

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes
router.get('/me', protect, getCurrentUser);
router.put('/password', protect, changePassword);

export default router;