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
import { protect} from '../middlewares/protect';

const router = express.Router();

// Public routes
router.get('/', getAllResources);
router.get('/:id', getResourceById);
router.get('/skill/:skillId', getResourcesBySkill);

// Protected routes
router.get('/recommended', protect, getRecommendedResources);

// Admin only routes
router.post('/', protect,createResource);
router.put('/:id', protect,updateResource);
router.delete('/:id', protect, deleteResource);

export default router;