import express from 'express';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import jobSeekerRoutes from './routes/jobSeekerProfile';
import jobRoutes from './routes/job';
import applicationRoutes from './routes/application';
import skillsRoutes from './routes/skills';
import companyRoutes from './routes/companies';
import interviewRoutes from './routes/interviewRequests';
import jobSeekerProfileRoutes from './routes/jobSeekerProfile';
import matchRoutes from './routes/match';
import resourceRoutes from './routes/resource';
import userRoutes from './routes/user';

dotenv.config();

const app = express();
app.use(express.json()); // enable parsing JSON

// Mount the auth routes
app.use('/api/auth', authRoutes);
app.use('/api/jobseeker', jobSeekerRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/skills', skillsRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/interviews', interviewRoutes);
app.use('/api/jobseeker-profiles', jobSeekerProfileRoutes);
app.use('/api/match', matchRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/users', userRoutes);

const PORT = process.env.PORT || 80;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
