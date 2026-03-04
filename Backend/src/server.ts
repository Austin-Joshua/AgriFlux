import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import aiRoutes from './routes/ai.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/ai', aiRoutes);

// 404
app.use((_req: Request, res: Response) => {
    res.status(404).json({ message: 'Not found' });
});

// Error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || 500;
    console.error(`[Error] ${err.message}`);
    res.status(status).json({ success: false, message: err.message || 'Server error' });
});

app.listen(PORT, () => {
    console.log(`🚀 AgriFlux API running at http://localhost:${PORT}`);
});
