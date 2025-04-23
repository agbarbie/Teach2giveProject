"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const JobSeekerProfileController_1 = require("../controllers/JobSeekerProfileController");
const protect_1 = require("../middlewares/protect");
const router = express_1.default.Router();
// All routes are protected
router.get('/', protect_1.protect, JobSeekerProfileController_1.getMyProfile);
router.get('/:userId', protect_1.protect, JobSeekerProfileController_1.getProfileByUserId);
router.put('/', protect_1.protect, JobSeekerProfileController_1.updateProfile);
// Skill management
router.post('/skills', protect_1.protect, JobSeekerProfileController_1.addSkill);
router.put('/skills/:skillId', protect_1.protect, JobSeekerProfileController_1.updateSkill);
router.delete('/skills/:skillId', protect_1.protect, JobSeekerProfileController_1.removeSkill);
exports.default = router;
