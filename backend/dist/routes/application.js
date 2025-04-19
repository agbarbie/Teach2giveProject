"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const ApplicationController_1 = require("../controllers/ApplicationController");
const router = express_1.default.Router();
router.post('/', ApplicationController_1.applyForJob);
router.get('/', ApplicationController_1.getAllApplications);
router.get('/user/:userId', ApplicationController_1.getApplicationsByUser);
router.get('/job/:jobId', ApplicationController_1.getApplicationsByJob);
router.delete('/:applicationId', ApplicationController_1.deleteApplication);
exports.default = router;
