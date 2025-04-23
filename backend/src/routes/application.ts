import express from 'express';
import { 
  getMyApplications, 
  getJobApplications, 
  getApplicationById, 
  createApplication,
  updateApplicationStatus,
  withdrawApplication
} from '../controllers/ApplicationController';
import { protect } from '../middlewares/protect';

const router = express.Router();

// All routes are protected
router.get('/', protect, getMyApplications);
router.get('/job/:jobId', protect,getJobApplications);
router.get('/:id', protect, getApplicationById); // Permission check in controller
router.post('/', protect,createApplication);
router.put('/:id/status', protect, updateApplicationStatus);
router.delete('/:id', protect,withdrawApplication);

export default router;