import express from 'express';
import { 
  getAllSkills, 
  getSkillById, 
  createSkill, 
  updateSkill,
  deleteSkill,
  getSkillCategories
} from '../controllers/SkillController';
import { protect} from '../middlewares/protect';

const router = express.Router();

// Public routes
router.get('/', getAllSkills);
router.get('/categories', getSkillCategories);
router.get('/:id', getSkillById);

// Admin only routes
router.post('/', protect, createSkill);
router.put('/:id', protect,  updateSkill);
router.delete('/:id', protect,  deleteSkill);

export default router;