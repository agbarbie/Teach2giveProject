import express from 'express';
import { 
  getAllSkills, 
  getSkillById, 
  getSkillCategories,
  getUserSkills,
  addUserSkill,
  updateUserSkill,
  deleteUserSkill,
  getJobseekerSkillsByUserId,
  createSkill,
  updateSkill,
  deleteSkill
} from '../controllers/SkillController';
import { protect } from '../middlewares/protect';
import { checkRole } from '../middlewares/protect';

const router = express.Router();

// Public routes
router.get('/skills', getAllSkills);
router.get('/skills/:id', getSkillById);
router.get('/skills/categories', getSkillCategories);
router.get('/users/:id/skills', getJobseekerSkillsByUserId);

// Protected routes for jobseekers
router.get('/users/skills', protect, getUserSkills);
router.post('/users/skills', protect, addUserSkill);
router.put('/users/skills/:id', protect,  updateUserSkill);
router.delete('/users/skills/:id', protect,deleteUserSkill);

// Admin routes
router.post('/admin/skills', protect, createSkill);
router.put('/admin/skills/:id', protect,  updateSkill);
router.delete('/admin/skills/:id', protect, deleteSkill);

export default router;