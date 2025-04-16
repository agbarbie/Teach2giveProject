import express from 'express';
import getLearningResources from '../controllers/LearningResourceController';

const router = express.Router();

router.get('/:user_id', getLearningResources);

export default router;
