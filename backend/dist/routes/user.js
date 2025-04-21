"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const UserController_1 = require("../controllers/UserController");
const protect_1 = require("../middlewares/protect");
const router = express_1.default.Router();
// Admin only routes
router.get('/', protect_1.protect, (0, protect_1.restrictTo)('admin'), UserController_1.getAllUsers);
// User routes (protected)
router.get('/:id', protect_1.protect, UserController_1.getUserById);
router.put('/:id', protect_1.protect, UserController_1.updateUser);
router.delete('/:id', protect_1.protect, UserController_1.deleteUser);
router.get('/:id/skills', protect_1.protect, UserController_1.getUserSkills);
exports.default = router;
