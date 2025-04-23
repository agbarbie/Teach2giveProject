"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const JobMatchController_1 = require("../controllers/JobMatchController");
const protect_1 = require("../middlewares/protect");
const router = express_1.default.Router();
// Job seeker routes
router.get('/', protect_1.protect, JobMatchController_1.getMyMatches);
router.get('/job/:jobId', protect_1.protect, JobMatchController_1.calculateJobMatch);
router.put('/:id/status', protect_1.protect, JobMatchController_1.updateMatchStatus);
// Admin routes
router.post('/generate', protect_1.protect, JobMatchController_1.generateAllMatches);
exports.default = router;
