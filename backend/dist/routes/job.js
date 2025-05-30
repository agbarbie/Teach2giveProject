"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const JobController_1 = require("../controllers/JobController");
const protect_1 = require("../middlewares/protect");
const router = express_1.default.Router();
// Public routes
router.get('/', protect_1.protect, JobController_1.getAllJobs);
router.get('/:id', JobController_1.getJobById);
// Employer routes - all require authentication and employer role
router.post('/', protect_1.protect, JobController_1.createJob);
router.put('/:id', protect_1.protect, JobController_1.updateJob); // Owner check in controller
router.delete('/:id', protect_1.protect, JobController_1.deleteJob); // Owner check in controller
// // Job skills management - all require authentication and employer role
// router.post('/:id/skills', protect, addJobSkill); // Owner check in controller
// router.delete('/:id/skills/:skillId', protect, removeJobSkil); 
exports.default = router;
