"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const JobMatchController_1 = require("../controllers/JobMatchController");
const router = express_1.default.Router();
// Define the routes and link to controllers
router.get('/matches/:user_id', JobMatchController_1.getJobMatchesForUser);
router.get('/recommended-skills/:user_id', JobMatchController_1.getRecommendedSkills);
exports.default = router;
