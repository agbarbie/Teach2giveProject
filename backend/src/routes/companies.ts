import express from 'express';
import {
  createCompany,
  getCompanies,
  getCompanyById,
} from '../controllers/CompanyController';

const router = express.Router();

router.post('/', createCompany);
router.get('/', getCompanies);
router.get('/:id', getCompanyById);

export default router;
