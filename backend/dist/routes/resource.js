"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const LearningResourceController_1 = require("../controllers/LearningResourceController");
const protect_1 = require("../middlewares/protect");
const router = express_1.default.Router();
// Public routes
router.get('/', LearningResourceController_1.getAllResources);
router.get('/:id', LearningResourceController_1.getResourceById);
router.get('/skill/:skillId', LearningResourceController_1.getResourcesBySkill);
// Protected routes
router.get('/recommended', protect_1.protect, LearningResourceController_1.getRecommendedResources);
// Admin only routes
router.post('/', protect_1.protect, (0, protect_1.restrictTo)('admin'), LearningResourceController_1.createResource);
router.put('/:id', protect_1.protect, (0, protect_1.restrictTo)('admin'), LearningResourceController_1.updateResource);
router.delete('/:id', protect_1.protect, (0, protect_1.restrictTo)('admin'), LearningResourceController_1.deleteResource);
exports.default = router;
