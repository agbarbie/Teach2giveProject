import express from 'express';
import { 
  getAllUsers, 
  getUserById, 
  updateUser, 
  deleteUser, 
  getUserSkills,
  getCurrentUser
} from '../controllers/UserController';
import { protect, restrictTo } from '../middlewares/protect';

const router = express.Router();

// Get current logged-in user (any authenticated user)
router.get('/me', protect, getCurrentUser);

// Admin-only route to get all users
router.get('/', protect, restrictTo('admin'), getAllUsers);

// Routes for specific user operations
router
  .route('/:id')
  .get(protect, getUserById)
  .put(protect, updateUser)
  .delete(protect, deleteUser);

// Get user skills
router.get('/:id/skills', protect, getUserSkills);

export default router;