import express from 'express';
import {
  createJob,
  getAllJobs,
  getJobById,
  updateJob,
  deleteJob,
} from '../controllers/JobController';

const router = express.Router();

router.post('/', createJob);
router.get('/', getAllJobs);
router.get('/:jobId', getJobById);
router.put('/:jobId', updateJob);
router.delete('/:jobId', deleteJob);

export default router;
