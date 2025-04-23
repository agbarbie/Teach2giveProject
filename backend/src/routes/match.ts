import express from 'express';
import { 
  getMyMatches, 
  calculateJobMatch, 
  updateMatchStatus,
  generateAllMatches
} from '../controllers/JobMatchController';
import { protect } from '../middlewares/protect';

const router = express.Router();

// Job seeker routes
router.get('/', protect, getMyMatches);
router.get('/job/:jobId', protect, calculateJobMatch);
router.put('/:id/status', protect,updateMatchStatus);

// Admin routes
router.post('/generate', protect, generateAllMatches);

export default router;