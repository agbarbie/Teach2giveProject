"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const ApplicationController_1 = require("../controllers/ApplicationController");
const protect_1 = require("../middlewares/protect");
const router = express_1.default.Router();
// All routes are protected
router.get('/', protect_1.protect, ApplicationController_1.getMyApplications);
router.get('/job/:jobId', protect_1.protect, ApplicationController_1.getJobApplications);
router.get('/:id', protect_1.protect, ApplicationController_1.getApplicationById); // Permission check in controller
router.post('/', protect_1.protect, ApplicationController_1.createApplication);
router.put('/:id/status', protect_1.protect, ApplicationController_1.updateApplicationStatus);
router.delete('/:id', protect_1.protect, ApplicationController_1.withdrawApplication);
exports.default = router;
