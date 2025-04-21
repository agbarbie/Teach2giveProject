import express from 'express';
import { 
  getMyProfile, 
  getProfileByUserId, 
  updateProfile,
  addSkill,
  updateSkill,
  removeSkill
} from '../controllers/JobSeekerProfileController';
import { protect, restrictTo } from '../middlewares/protect';

const router = express.Router();

// All routes are protected
router.get('/', protect, getMyProfile);
router.get('/:userId', protect, getProfileByUserId);
router.put('/', protect, restrictTo('jobseeker'), updateProfile);

// Skill management
router.post('/skills', protect, restrictTo('jobseeker'), addSkill);
router.put('/skills/:skillId', protect, restrictTo('jobseeker'), updateSkill);
router.delete('/skills/:skillId', protect, restrictTo('jobseeker'), removeSkill);

export default router;