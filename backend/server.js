import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import doctorRoutes from './routes/doctorRoutes.js';
import patientRoutes from './routes/patientRoutes.js';
import sessionRoutes from './routes/sessionRoutes.js';
import vrDataRoutes from './routes/vrDataRoutes.js';
import ratingRoutes from './routes/ratingRoutes.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// VR Therapy System Routes
app.use('/api/doctors', doctorRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/vr-data', vrDataRoutes);
app.use('/api/ratings', ratingRoutes); 

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ message: 'VR Therapy System API is running', timestamp: new Date().toISOString() });
});

// Error Handling Middleware
app.use((err, req, res, next) => {
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    res.status(statusCode);
    res.json({
        message: err.message,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
});

mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log('MongoDB connected - VR Therapy System');
        app.listen(process.env.PORT || 5000, () =>
            console.log(`VR Therapy System Server running on port ${process.env.PORT || 5000}`)
        );
    })
    .catch(err => console.log(err));