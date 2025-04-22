"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const morgan_1 = __importDefault(require("morgan"));
const dotenv_1 = __importDefault(require("dotenv"));
const errorMiddlewares_1 = require("./middlewares/errorMiddlewares");
// Import routes
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const user_1 = __importDefault(require("./routes/user"));
const jobSeekerProfile_1 = __importDefault(require("./routes/jobSeekerProfile"));
const companies_1 = __importDefault(require("./routes/companies"));
const job_1 = __importDefault(require("./routes/job"));
const skills_1 = __importDefault(require("./routes/skills"));
const application_1 = __importDefault(require("./routes/application"));
const interviewRequests_1 = __importDefault(require("./routes/interviewRequests"));
const match_1 = __importDefault(require("./routes/match"));
const resource_1 = __importDefault(require("./routes/resource"));
// Load environment variables
dotenv_1.default.config();
// Initialize express
const app = (0, express_1.default)();
const PORT = process.env.PORT || 80;
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Logging in development
if (process.env.NODE_ENV === 'development') {
    app.use((0, morgan_1.default)('dev'));
}
// Health check route
app.get('/', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'Server is running' });
});
// API routes
app.use('/api/auth', auth_routes_1.default);
app.use('/api/users', user_1.default);
app.use('/api/profile', jobSeekerProfile_1.default);
app.use('/api/companies', companies_1.default);
app.use('/api/jobs', job_1.default);
app.use('/api/skills', skills_1.default);
app.use('/api/applications', application_1.default);
app.use('/api/interviews', interviewRequests_1.default);
app.use('/api/matches', match_1.default);
app.use('/api/resources', resource_1.default);
// Error handling middleware
app.use(errorMiddlewares_1.notFound);
app.use(errorMiddlewares_1.errorHandler);
// Start server
app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
//show the server logs in the console and errors if they arise like cause of 500 errors
app.use((req, res, next) => {
    console.log(`Request Method: ${req.method}, Request URL: ${req.url}`);
    next();
});
// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    console.error(`Unhandled Rejection: ${err.message}`);
    // Close server & exit process
    // server.close(() => process.exit(1));
});
