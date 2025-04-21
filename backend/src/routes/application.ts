import express from 'express';
import { 
  getMyApplications, 
  getJobApplications, 
  getApplicationById, 
  createApplication,
  updateApplicationStatus,
  withdrawApplication
} from '../controllers/ApplicationController';
import { protect, restrictTo } from '../middlewares/protect';

const router = express.Router();

// All routes are protected
router.get('/', protect, restrictTo('jobseeker'), getMyApplications);
router.get('/job/:jobId', protect, restrictTo('employer', 'admin'), getJobApplications);
router.get('/:id', protect, getApplicationById); // Permission check in controller
router.post('/', protect, restrictTo('jobseeker'), createApplication);
router.put('/:id/status', protect, restrictTo('employer', 'admin'), updateApplicationStatus);
router.delete('/:id', protect, restrictTo('jobseeker'), withdrawApplication);

export default router;