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
router.get('/', JobController_1.getAllJobs);
router.get('/:id', JobController_1.getJobById);
// Employer routes
router.post('/', protect_1.protect, (0, protect_1.restrictTo)('employer'), JobController_1.createJob);
router.put('/:id', protect_1.protect, JobController_1.updateJob); // Owner check in controller
router.delete('/:id', protect_1.protect, JobController_1.deleteJob); // Owner check in controller
// Job skills management
router.post('/:id/skills', protect_1.protect, JobController_1.addJobSkill); // Owner check in controller
router.delete('/:id/skills/:skillId', protect_1.protect, JobController_1.removeJobSkill); // Owner check in controller
exports.default = router;
