"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const InterviewRequestController_1 = require("../controllers/InterviewRequestController");
const protect_1 = require("../middlewares/protect");
const router = express_1.default.Router();
// All routes are protected
router.get('/application/:applicationId', protect_1.protect, InterviewRequestController_1.getInterviewsByApplication); // Permission check in controller
router.get('/my', protect_1.protect, InterviewRequestController_1.getMyInterviews);
router.get('/company', protect_1.protect, InterviewRequestController_1.getCompanyInterviews);
router.post('/', protect_1.protect, InterviewRequestController_1.createInterviewRequest);
router.put('/:id/status', protect_1.protect, InterviewRequestController_1.updateInterviewStatus);
router.put('/:id/reschedule', protect_1.protect, InterviewRequestController_1.rescheduleInterview);
router.delete('/:id', protect_1.protect, InterviewRequestController_1.cancelInterview); // Permission check in controller
exports.default = router;
