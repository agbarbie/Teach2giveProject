import express from 'express';
import { 
  getAllResources, 
  getResourceById, 
  createResource, 
  updateResource,
  deleteResource,
  getResourcesBySkill,
  getRecommendedResources
} from '../controllers/LearningResourceController';
import { protect, restrictTo } from '../middlewares/protect';

const router = express.Router();

// Public routes
router.get('/', getAllResources);
router.get('/:id', getResourceById);
router.get('/skill/:skillId', getResourcesBySkill);

// Protected routes
router.get('/recommended', protect, getRecommendedResources);

// Admin only routes
router.post('/', protect, restrictTo('admin'), createResource);
router.put('/:id', protect, restrictTo('admin'), updateResource);
router.delete('/:id', protect, restrictTo('admin'), deleteResource);

export default router;