import express from 'express';
import {
  addSkillToUser,
  getUserSkills,
  getMatchingJobs,
} from '../controllers/SkillController';

const router = express.Router();

router.post('/', addSkillToUser);
router.get('/user/:userId', getUserSkills);
router.get('/match/:userId', getMatchingJobs);

export default router;
