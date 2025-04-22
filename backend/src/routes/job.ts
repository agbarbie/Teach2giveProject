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

// Employer routes - all require authentication and employer role
router.post('/', protect, restrictTo('employer'), createJob);
router.put('/:id', protect, restrictTo('employer'), updateJob); // Owner check in controller
router.delete('/:id', protect, restrictTo('employer'), deleteJob); // Owner check in controller

// Job skills management - all require authentication and employer role
router.post('/:id/skills', protect, restrictTo('employer'), addJobSkill); // Owner check in controller
router.delete('/:id/skills/:skillId', protect, restrictTo('employer'), removeJobSkill); // Owner check in controller

export default router;