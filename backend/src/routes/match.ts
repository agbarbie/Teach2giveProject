import express from 'express';
import { 
  getMyMatches, 
  calculateJobMatch, 
  updateMatchStatus,
  generateAllMatches
} from '../controllers/JobMatchController';
import { protect, restrictTo } from '../middlewares/protect';

const router = express.Router();

// Job seeker routes
router.get('/', protect, restrictTo('jobseeker'), getMyMatches);
router.get('/job/:jobId', protect, restrictTo('jobseeker'), calculateJobMatch);
router.put('/:id/status', protect, restrictTo('jobseeker'), updateMatchStatus);

// Admin routes
router.post('/generate', protect, restrictTo('admin'), generateAllMatches);

export default router;