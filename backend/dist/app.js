"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/app.ts
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const body_parser_1 = __importDefault(require("body-parser"));
// TODO: Import routes here when ready
// import authRoutes from './routes/authRoutes';
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(body_parser_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Simple health check
app.get('/', (req, res) => {
    res.send('Welcome to SkillmatchesAI API 🚀');
});
// TODO: Use routes when ready
// app.use('/api/auth', authRoutes);
exports.default = app;
