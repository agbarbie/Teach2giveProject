"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const AuthController_1 = require("../controllers/AuthController");
const protect_1 = require("../middlewares/protect");
const router = express_1.default.Router();
// Public routes
router.post('/register', AuthController_1.register);
router.post('/login', AuthController_1.login);
// Protected routes
router.get('/me', protect_1.protect, AuthController_1.getCurrentUser);
router.put('/password', protect_1.protect, AuthController_1.changePassword);
exports.default = router;
