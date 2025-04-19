"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const jobSeekerProfile_1 = __importDefault(require("./routes/jobSeekerProfile"));
const job_1 = __importDefault(require("./routes/job"));
const application_1 = __importDefault(require("./routes/application"));
const skills_1 = __importDefault(require("./routes/skills"));
const companies_1 = __importDefault(require("./routes/companies"));
const interviewRequests_1 = __importDefault(require("./routes/interviewRequests"));
const jobSeekerProfile_2 = __importDefault(require("./routes/jobSeekerProfile"));
const match_1 = __importDefault(require("./routes/match"));
const resource_1 = __importDefault(require("./routes/resource"));
const user_1 = __importDefault(require("./routes/user"));
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use(express_1.default.json()); // enable parsing JSON
// Mount the auth routes
app.use('/api/auth', auth_routes_1.default);
app.use('/api/jobseeker', jobSeekerProfile_1.default);
app.use('/api/jobs', job_1.default);
app.use('/api/applications', application_1.default);
app.use('/api/skills', skills_1.default);
app.use('/api/companies', companies_1.default);
app.use('/api/interviews', interviewRequests_1.default);
app.use('/api/jobseeker-profiles', jobSeekerProfile_2.default);
app.use('/api/match', match_1.default);
app.use('/api/resources', resource_1.default);
app.use('/api/users', user_1.default);
const PORT = process.env.PORT || 80;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
