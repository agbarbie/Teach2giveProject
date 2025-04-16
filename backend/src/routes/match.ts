import express from 'express';
import {
  getJobMatchesForUser,
  getRecommendedSkills,
} from '../controllers/JobMatchController';

const router = express.Router();

// Define the routes and link to controllers
router.get('/matches/:user_id', getJobMatchesForUser);
router.get('/recommended-skills/:user_id', getRecommendedSkills);

export default router;
