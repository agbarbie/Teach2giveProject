import express from 'express';
import {
  upsertJobSeekerProfile,
  getJobSeekerProfile,
} from '../controllers/JobSeekerProfileController';

const router = express.Router();

router.post('/', upsertJobSeekerProfile); // create or update
router.get('/:user_id', getJobSeekerProfile); // get by user ID

export default router;
