"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const SkillController_1 = require("../controllers/SkillController");
const protect_1 = require("../middlewares/protect");
const router = express_1.default.Router();
// Public routes
router.get('/skills', SkillController_1.getAllSkills);
router.get('/skills/:id', SkillController_1.getSkillById);
router.get('/skills/categories', SkillController_1.getSkillCategories);
router.get('/users/:id/skills', SkillController_1.getJobseekerSkillsByUserId);
// Protected routes for jobseekers
router.get('/users/skills', protect_1.protect, SkillController_1.getUserSkills);
router.post('/users/skills', protect_1.protect, SkillController_1.addUserSkill);
router.put('/users/skills/:id', protect_1.protect, SkillController_1.updateUserSkill);
router.delete('/users/skills/:id', protect_1.protect, SkillController_1.deleteUserSkill);
// Admin routes
router.post('/admin/skills', protect_1.protect, SkillController_1.createSkill);
router.put('/admin/skills/:id', protect_1.protect, SkillController_1.updateSkill);
router.delete('/admin/skills/:id', protect_1.protect, SkillController_1.deleteSkill);
exports.default = router;
