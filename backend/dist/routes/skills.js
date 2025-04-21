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
router.get('/', SkillController_1.getAllSkills);
router.get('/categories', SkillController_1.getSkillCategories);
router.get('/:id', SkillController_1.getSkillById);
// Admin only routes
router.post('/', protect_1.protect, (0, protect_1.restrictTo)('admin'), SkillController_1.createSkill);
router.put('/:id', protect_1.protect, (0, protect_1.restrictTo)('admin'), SkillController_1.updateSkill);
router.delete('/:id', protect_1.protect, (0, protect_1.restrictTo)('admin'), SkillController_1.deleteSkill);
exports.default = router;
