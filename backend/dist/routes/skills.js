"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const SkillController_1 = require("../controllers/SkillController");
const router = express_1.default.Router();
router.post('/', SkillController_1.addSkillToUser);
router.get('/user/:userId', SkillController_1.getUserSkills);
router.get('/match/:userId', SkillController_1.getMatchingJobs);
exports.default = router;
