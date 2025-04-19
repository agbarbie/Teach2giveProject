"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const JobSeekerProfileController_1 = require("../controllers/JobSeekerProfileController");
const router = express_1.default.Router();
router.post('/', JobSeekerProfileController_1.upsertJobSeekerProfile); // create or update
router.get('/:user_id', JobSeekerProfileController_1.getJobSeekerProfile); // get by user ID
exports.default = router;
