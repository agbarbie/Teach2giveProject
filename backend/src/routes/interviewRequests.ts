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
import { protect, restrictTo } from '../middlewares/protect';

const router = express.Router();

// All routes are protected
router.get('/application/:applicationId', protect, getInterviewsByApplication); // Permission check in controller
router.get('/my', protect, restrictTo('jobseeker'), getMyInterviews);
router.get('/company', protect, restrictTo('employer'), getCompanyInterviews);
router.post('/', protect, restrictTo('employer', 'admin'), createInterviewRequest);
router.put('/:id/status', protect, restrictTo('jobseeker'), updateInterviewStatus);
router.put('/:id/reschedule', protect, restrictTo('employer', 'admin'), rescheduleInterview);
router.delete('/:id', protect, cancelInterview); // Permission check in controller

export default router;