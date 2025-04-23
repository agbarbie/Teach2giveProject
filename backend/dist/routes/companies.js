"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const CompanyController_1 = require("../controllers/CompanyController");
const protect_1 = require("../middlewares/protect");
const router = express_1.default.Router();
// Public routes
router.get('/', CompanyController_1.getAllCompanies);
router.get('/:id', CompanyController_1.getCompanyById);
router.get('/:id/jobs', CompanyController_1.getCompanyJobs);
// Protected routes
router.post('/', protect_1.protect, CompanyController_1.createCompany);
router.put('/:id', protect_1.protect, CompanyController_1.updateCompany); // Owner check in controller
router.delete('/:id', protect_1.protect, CompanyController_1.deleteCompany); // Owner check in controller
exports.default = router;
