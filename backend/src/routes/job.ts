import express from 'express';
import { 
  getAllJobs, 
  getJobById, 
  createJob, 
  updateJob,
  deleteJob,
  addJobSkill,
  removeJobSkill
} from '../controllers/JobController';
import { protect, restrictTo } from '../middlewares/protect';

const router = express.Router();

// Public routes
router.get('/', getAllJobs);
router.get('/:id', getJobById);

// Employer routes
router.post('/', restrictTo('employer'), createJob);
router.put('/:id', protect, updateJob); // Owner check in controller
router.delete('/:id', protect, deleteJob); // Owner check in controller

// Job skills management
router.post('/:id/skills', protect, addJobSkill); // Owner check in controller
router.delete('/:id/skills/:skillId', protect, removeJobSkill); // Owner check in controller

export default router;