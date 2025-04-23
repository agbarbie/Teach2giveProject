import express from 'express';
import { 
  getAllCompanies, 
  getCompanyById, 
  createCompany, 
  updateCompany,
  deleteCompany,
  getCompanyJobs
} from '../controllers/CompanyController';
import { protect } from '../middlewares/protect';

const router = express.Router();

// Public routes
router.get('/', getAllCompanies);
router.get('/:id', getCompanyById);
router.get('/:id/jobs', getCompanyJobs);

// Protected routes
router.post('/', protect,createCompany);
router.put('/:id', protect, updateCompany); // Owner check in controller
router.delete('/:id', protect, deleteCompany); // Owner check in controller

export default router;