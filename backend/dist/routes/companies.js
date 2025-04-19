"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const CompanyController_1 = require("../controllers/CompanyController");
const router = express_1.default.Router();
router.post('/', CompanyController_1.createCompany);
router.get('/', CompanyController_1.getCompanies);
router.get('/:id', CompanyController_1.getCompanyById);
exports.default = router;
