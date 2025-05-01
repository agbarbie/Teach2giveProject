// Placeholder to satisfy imports
import express from 'express';
import cors from 'cors';

const app = express();

app.use(cors({
    origin: '*',
    methods:['GET','POST','DELETE','OPTIONS'],
    allowedHeaders: ['Content-Type','Authorization']
}));

app.use(express.json());

app.listen(80,'0.0.0.0', () => {
    console.log('server is running on port 80');
});
