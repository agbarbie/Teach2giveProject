import express from 'express';
import {
  createInterviewRequest,
  getAllInterviewRequests,
  getInterviewsByApplicant,
} from '../controllers/InterviewRequestController';

const router = express.Router();

router.post('/', createInterviewRequest);
router.get('/', getAllInterviewRequests);
router.get('/applicant/:applicant_id', getInterviewsByApplicant);

export default router;
