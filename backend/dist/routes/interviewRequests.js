"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const InterviewRequestController_1 = require("../controllers/InterviewRequestController");
const router = express_1.default.Router();
router.post('/', InterviewRequestController_1.createInterviewRequest);
router.get('/', InterviewRequestController_1.getAllInterviewRequests);
router.get('/applicant/:applicant_id', InterviewRequestController_1.getInterviewsByApplicant);
exports.default = router;
