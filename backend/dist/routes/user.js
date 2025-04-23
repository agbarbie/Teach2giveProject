"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const UserController_1 = require("../controllers/UserController");
const protect_1 = require("../middlewares/protect");
const router = express_1.default.Router();
// Get current logged-in user (any authenticated user)
router.get('/me', UserController_1.getCurrentUser);
// Admin-only route to get all users
router.get('/', protect_1.protect, UserController_1.getAllUsers);
// Routes for specific user operations
router
    .route('/:id')
    .get(UserController_1.getUserById)
    .put(UserController_1.updateUser)
    .delete(UserController_1.deleteUser);
// Get user skills
router.get('/:id/skills', UserController_1.getUserSkills);
exports.default = router;
