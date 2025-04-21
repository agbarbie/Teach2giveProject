import express from 'express';
import { 
  getAllSkills, 
  getSkillById, 
  createSkill, 
  updateSkill,
  deleteSkill,
  getSkillCategories
} from '../controllers/SkillController';
import { protect, restrictTo } from '../middlewares/protect';

const router = express.Router();

// Public routes
router.get('/', getAllSkills);
router.get('/categories', getSkillCategories);
router.get('/:id', getSkillById);

// Admin only routes
router.post('/', protect, restrictTo('admin'), createSkill);
router.put('/:id', protect, restrictTo('admin'), updateSkill);
router.delete('/:id', protect, restrictTo('admin'), deleteSkill);

export default router;