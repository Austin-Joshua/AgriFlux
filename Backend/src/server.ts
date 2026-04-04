import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import hpp from 'hpp';
import { connectDB } from './config/db';
import { env } from './config/env';
import authRoutes from './routes/auth.routes';
import aiRoutes from './routes/ai.routes';
import consultationRoutes from './routes/consultation.routes';
import integrationRoutes from './routes/integration.routes';

import cluster from 'cluster';
import os from 'os';

/**
 * Handle uncaught exceptions and unhandled rejections globally 
 * to prevent the entire process from crashing silently.
 */
process.on('uncaughtException', (err) => {
    console.error(`💥 [CRITICAL ERROR] UNCAUGHT EXCEPTION: ${err.name} - ${err.message}`);
    process.exit(1);
});

process.on('unhandledRejection', (err: any) => {
    console.error(`🔥 [CRITICAL ERROR] UNHANDLED REJECTION: ${err.name} - ${err.message}`);
    // Only exit the worker, primary will restart it
    process.exit(1);
});

// Connect to Database
connectDB();

const app = express();
const PORT = env.PORT;

// Global Middleware
app.use(helmet()); 
app.use(hpp()); 
app.use(compression()); 
app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev')); 

// Rate Limiting (Optimized for higher traffic)
const limiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 500, // Increased limit for heavy traffic
    message: { success: false, message: 'Too many requests, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api/', limiter);

// CORS
const allowedOrigins = [
    env.FRONTEND_URL,
    'https://citizenone.vercel.app',
    'https://agriflux.vercel.app',
    'https://agri-flux-sandy.vercel.app'
];
app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin) || (origin && origin.endsWith('.vercel.app')) || env.NODE_ENV === 'development') {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));

app.use(express.json({ limit: '50kb' })); // Increased limit slightly for analysis data
app.use(express.urlencoded({ extended: true, limit: '50kb' }));

// Health Check
app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({ status: 'healthy', worker: process.pid, timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/consultations', consultationRoutes);
app.use('/api/integration', integrationRoutes);

// 404
app.use((_req: Request, res: Response) => {
    res.status(404).json({ message: 'Not found' });
});

// Error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || 500;
    const message = err.message || 'Server error';
    
    if (env.NODE_ENV === 'production') {
        console.error(`[Error] ${err.name}: ${message}`);
    } else {
        console.error(err);
    }

    res.status(status).json({ 
        success: false, 
        message,
        stack: env.NODE_ENV === 'production' ? undefined : err.stack
    });
});

/**
 * Cluster Deployment:
 */
if (cluster.isPrimary && env.NODE_ENV === 'production') {
    const numCPUs = os.cpus().length;
    console.log(`🚀 Primary process ${process.pid} is running. Spawning ${numCPUs} workers...`);

    for (let i = 0; i < numCPUs; i++) {
        cluster.fork();
    }

    cluster.on('exit', (worker, code, signal) => {
        console.warn(`⚠️  Worker ${worker.process.pid} died (code: ${code}, signal: ${signal}). Spawning replacement...`);
        cluster.fork();
    });
} else {
    app.listen(PORT, () => {
        console.log(`🚀 Worker ${process.pid} started. AgriFlux API: http://localhost:${PORT}`);
    });
}
