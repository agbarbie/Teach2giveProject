import express from 'express';
import { 
  getMyProfile, 
  getProfileByUserId, 
  updateProfile,
  addSkill,
  updateSkill,
  removeSkill
} from '../controllers/JobSeekerProfileController';
import { protect} from '../middlewares/protect';

const router = express.Router();

// All routes are protected
router.get('/', protect, getMyProfile);
router.get('/:userId', protect, getProfileByUserId);
router.put('/', protect, updateProfile);

// Skill management
router.post('/skills', protect, addSkill);
router.put('/skills/:skillId', protect, updateSkill);
router.delete('/skills/:skillId', protect, removeSkill);

export default router;