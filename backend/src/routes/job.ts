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
import { protect } from '../middlewares/protect';

const router = express.Router();

// Public routes
router.get('/',protect,getAllJobs);
router.get('/:id', getJobById);

// Employer routes - all require authentication and employer role
router.post('/', protect, createJob);
router.put('/:id', protect, updateJob); // Owner check in controller
router.delete('/:id', protect,  deleteJob); // Owner check in controller

// Job skills management - all require authentication and employer role
router.post('/:id/skills', protect, addJobSkill); // Owner check in controller
router.delete('/:id/skills/:skillId', protect, removeJobSkill); 

export default router;