// src/app.ts
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';

// TODO: Import routes here when ready
// import authRoutes from './routes/authRoutes';

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));

// Simple health check
app.get('/', (req, res) => {
  res.send('Welcome to SkillmatchesAI API 🚀');
});

// TODO: Use routes when ready
// app.use('/api/auth', authRoutes);

export default app;


