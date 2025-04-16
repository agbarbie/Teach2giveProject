import express from 'express';
import {
  applyForJob,
  getAllApplications,
  getApplicationsByUser,
  getApplicationsByJob,
  deleteApplication,
} from '../controllers/ApplicationController';

const router = express.Router();

router.post('/', applyForJob);
router.get('/', getAllApplications);
router.get('/user/:userId', getApplicationsByUser);
router.get('/job/:jobId', getApplicationsByJob);
router.delete('/:applicationId', deleteApplication);

export default router;
