import express, { Request, Response } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { errorHandler, notFound } from './middlewares/errorMiddlewares';

// Import routes
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user';
import profileRoutes from './routes/jobSeekerProfile';
import companyRoutes from './routes/companies';
import jobRoutes from './routes/job';
import skillRoutes from './routes/skills';
import applicationRoutes from './routes/application';
import interviewRoutes from './routes/interviewRequests';
import matchRoutes from './routes/match';
import resourceRoutes from './routes/resource';
import certificateAndProject from './routes/certificateAndProject';

// Load environment variables
dotenv.config();

// Initialize express
const app = express();
const PORT = process.env.PORT || 80;

// Middleware
app.use(cors({
  origin: '*',
  methods:['GET','POST','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging in development
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Health check route
app.get('/', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/skills', skillRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/interviews', interviewRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/portfolio', certificateAndProject);

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

//show the server logs in the console and errors if they arise like cause of 500 errors

app.use((req: Request, res: Response, next: Function) => {
  console.log(`Request Method: ${req.method}, Request URL: ${req.url}`);
  next();
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: Error) => {
  console.error(`Unhandled Rejection: ${err.message}`);
  // Close server & exit process
  // server.close(() => process.exit(1));
});