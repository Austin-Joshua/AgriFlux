import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import aiRoutes from './routes/ai.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5005;

// Security Middleware
app.use(helmet()); // Sets various security-related HTTP headers
app.use(cors({
    origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again after 15 minutes'
});
app.use('/api/', limiter);

// Request Parsing & Compression
app.use(express.json({ limit: '10kb' })); // Prevents large payload attacks
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(compression()); // Compresses response bodies for better performance

// Health Check
app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/ai', aiRoutes);

// 404 Handler
app.use((req: Request, res: Response) => {
    res.status(404).json({ message: 'Resource not found' });
});

// Global Error Handling Middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error(`[Error] ${new Date().toISOString()}: ${err.message}`);

    const status = err.status || 500;
    const message = process.env.NODE_ENV === 'production'
        ? 'Internal Server Error'
        : err.message || 'Something went wrong';

    res.status(status).json({
        success: false,
        message,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack
    });
});

app.listen(PORT, () => {
    console.log(`🚀 AgriFlux Backend running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
