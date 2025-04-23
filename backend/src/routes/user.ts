import express from 'express';
import { 
  getAllUsers, 
  getUserById, 
  updateUser, 
  deleteUser, 
  getUserSkills,
  getCurrentUser
} from '../controllers/UserController';
import { protect} from '../middlewares/protect';

const router = express.Router();

// Get current logged-in user (any authenticated user)
router.get('/me',  getCurrentUser);

// Admin-only route to get all users
router.get('/', protect, getAllUsers);

// Routes for specific user operations
router
  .route('/:id')
  .get(getUserById)
  .put( updateUser)
  .delete( deleteUser);

// Get user skills
router.get('/:id/skills', getUserSkills);

export default router;