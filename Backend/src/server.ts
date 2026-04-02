import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import hpp from 'hpp';
import { connectDB } from './config/db';
import authRoutes from './routes/auth.routes';
import aiRoutes from './routes/ai.routes';
import consultationRoutes from './routes/consultation.routes';
import integrationRoutes from './routes/integration.routes';

dotenv.config();

// Connect to Database
connectDB();

const app = express();
const PORT = process.env.PORT || 5001;

// Global Middleware
app.use(helmet()); // Security Headers
app.use(hpp()); // HTTP Parameter Pollution protection
app.use(compression()); // Gzip compression
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev')); // Logging

// Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: { success: false, message: 'Too many requests, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api/', limiter);

// CORS
const allowedOrigins = [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    'https://citizenone.vercel.app',
    'https://agriflux.vercel.app' // Added production candidate
];
app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development') {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));

app.use(express.json({ limit: '10kb' })); // Body limit for security
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Health Check
app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
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
    
    // Log error in production
    if (process.env.NODE_ENV === 'production') {
        console.error(`[Error] ${err.name}: ${message}`);
    } else {
        console.error(err);
    }

    res.status(status).json({ 
        success: false, 
        message,
        stack: process.env.NODE_ENV === 'production' ? undefined : err.stack
    });
});

app.listen(PORT, () => {
    console.log(`🚀 AgriFlux API running at http://localhost:${PORT}`);
});
