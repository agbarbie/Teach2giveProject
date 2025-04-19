"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const JobController_1 = require("../controllers/JobController");
const router = express_1.default.Router();
router.post('/', JobController_1.createJob);
router.get('/', JobController_1.getAllJobs);
router.get('/:jobId', JobController_1.getJobById);
router.put('/:jobId', JobController_1.updateJob);
router.delete('/:jobId', JobController_1.deleteJob);
exports.default = router;
