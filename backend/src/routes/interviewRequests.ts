import express from 'express';
import { 
  getInterviewsByApplication, 
  getMyInterviews, 
  getCompanyInterviews, 
  createInterviewRequest,
  updateInterviewStatus,
  rescheduleInterview,
  cancelInterview
} from '../controllers/InterviewRequestController';
import { protect}from '../middlewares/protect';

const router = express.Router();

// All routes are protected
router.get('/application/:applicationId', protect, getInterviewsByApplication); // Permission check in controller
router.get('/my', protect, getMyInterviews);
router.get('/company', protect,  getCompanyInterviews);
router.post('/', protect, createInterviewRequest);
router.put('/:id/status', protect, updateInterviewStatus);
router.put('/:id/reschedule', protect,  rescheduleInterview);
router.delete('/:id', protect, cancelInterview); // Permission check in controller

export default router;