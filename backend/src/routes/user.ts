import express from 'express';
import { 
  getAllUsers, 
  getUserById, 
  updateUser, 
  deleteUser,
  getUserSkills
} from '../controllers/UserController';
import { protect, restrictTo } from '../middlewares/protect';

const router = express.Router();

// Admin only routes
router.get('/', protect, getAllUsers);

// User routes (protected)
router.get('/:id', protect, getUserById);
router.put('/:id', protect, updateUser);
router.delete('/:id', protect, deleteUser);
router.get('/:id/skills', protect, getUserSkills);

export default router;