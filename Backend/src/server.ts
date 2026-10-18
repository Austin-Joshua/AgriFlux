import express, { Request, Response, NextFunction } from 'express';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import hpp from 'hpp';
import { connectDB, isDBConnected } from './config/db';
import { env } from './config/env';
import authRoutes from './routes/auth.routes';
import aiRoutes from './routes/ai.routes';
import consultationRoutes from './routes/consultation.routes';
import integrationRoutes from './routes/integration.routes';
import iotRoutes from './routes/iot.routes';
import fieldIntelligenceRoutes from './routes/field-intelligence.routes';
import environmentalDataRoutes from './routes/environmental-data.routes';
import blockchainRoutes from './routes/blockchain.routes';
import { blockchain } from './services/blockchain.service';
import { WeatherIngestionService } from './services/weather-ingestion.service';
import { CropStatisticsService } from './services/crop-statistics.service';
import fs from 'fs';
import path from 'path';

import cluster from 'cluster';
import os from 'os';
import { setIO } from './socket';

console.log(
  `🌱 [INIT] AgriFlux Backend initializing (PID ${process.pid}, Node ${process.version}, ENV=${env.NODE_ENV})...`
);

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

// CORS Configuration
const allowedOrigins = [
  env.FRONTEND_URL,
  'https://citizenone.vercel.app',
  'https://agriflux.vercel.app',
  'https://agri-flux-sandy.vercel.app',
];

const app = express();
// Enable proxy trust for reverse proxies (Vercel, Cloudflare, AWS, Nginx) so rate limiter inspects client IP
app.set('trust proxy', 1);
const isAllowedOrigin = (origin?: string): boolean => {
  if (!origin) return true;
  if (allowedOrigins.includes(origin)) return true;
  if (env.NODE_ENV === 'development') return true;
  // Strictly bound to AgriFlux-owned Vercel domains (prevents arbitrary .vercel.app origins)
  if (/^https:\/\/agriflux(-[a-z0-9-]+)?\.vercel\.app$/.test(origin)) return true;
  return false;
};

app.use(
  cors({
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  })
);

import jwt from 'jsonwebtoken';

const httpServer = createServer(app);
const io = new SocketServer(httpServer, {
  cors: {
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST'],
    credentials: true,
  },
});
setIO(io);

/**
 * Socket.IO Handshake Auth Middleware
 */
io.use((socket, next) => {
  const token =
    (socket.handshake.auth?.token as string) ||
    socket.handshake.headers?.authorization?.replace('Bearer ', '');

  if (token) {
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET, { algorithms: ['HS256'] });
      (socket as any).user = decoded;
    } catch {
      // Invalid token, socket remains unauthenticated
    }
  }
  next();
});

/**
 * Socket.IO Connection Handler
 */
io.on('connection', (socket) => {
  const user = (socket as any).user;
  console.log(
    `🔌 [SOCKET] New client connected: ${socket.id} (user: ${user?.id || 'anonymous'}, role: ${user?.role || 'guest'})`
  );

  // Broadcast real-time pump controls to ESP32 and other dashboard clients with authorization check
  socket.on('iot-control', (data) => {
    const socketUser = (socket as any).user;
    if (!socketUser || !['farmer', 'admin'].includes(socketUser.role)) {
      console.warn(`⚠️ [SOCKET] Unauthorized iot-control attempt from socket ${socket.id}`);
      socket.emit('error', {
        message: 'Unauthorized: actuator control requires valid farmer/admin token',
      });
      return;
    }

    const targetPumpStatus = Boolean(data?.pumpStatus);
    const commandId =
      typeof data?.commandId === 'string' && data.commandId.length <= 64
        ? data.commandId
        : 'ws_' + Math.random().toString(36).substring(2, 10);

    const sanitizedControlData = {
      commandId,
      action: targetPumpStatus ? 'ACTIVATE_PUMP' : 'DEACTIVATE_PUMP',
      targetPumpStatus,
      issuedAt: new Date().toISOString(),
      issuedBy: socketUser.id,
      role: socketUser.role,
    };

    // Cryptographically seal socket actuator dispatch into the blockchain ledger
    blockchain.addBlock('ACTUATOR_OVERRIDE', {
      channel: 'websocket',
      action: sanitizedControlData.action,
      socketId: socket.id,
      userId: socketUser.id,
      role: socketUser.role,
      targetPumpStatus: sanitizedControlData.targetPumpStatus,
      commandId: sanitizedControlData.commandId,
      timestamp: sanitizedControlData.issuedAt,
    });

    socket.broadcast.emit('iot-control', sanitizedControlData);
  });

  socket.on('disconnect', () => {
    console.log(`🔌 [SOCKET] Client disconnected: ${socket.id}`);
  });
});

/**
 * Export io instance for use in other files
 */
export { io };

const PORT = env.PORT;

// Global Middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
        imgSrc: [
          "'self'",
          'data:',
          'blob:',
          'https://*.tile.openstreetmap.org',
          'https://*.tile.openstreetmap.fr',
          'https://*.basemaps.cartocdn.com',
          'https://*.google.com',
          'https://*.googleapis.com',
          'https://*.gstatic.com',
          'https://images.unsplash.com',
        ],
        connectSrc: ["'self'", 'https://*', 'http://localhost:*', 'ws://localhost:*', 'wss://*'],
        frameAncestors: ["'none'"],
        objectSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);
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

app.use(express.json({ limit: '50kb' }));
app.use(express.urlencoded({ extended: true, limit: '50kb' }));

/**
 * Strict NoSQL Injection Sanitizer
 * Recursively strips MongoDB operator keys ($gt, $ne, etc.) and dot notation from all requests.
 */
const sanitizeNoSQL = (obj: any): any => {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(sanitizeNoSQL);
  const clean: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (
      key.startsWith('$') ||
      key.includes('.') ||
      key === '__proto__' ||
      key === 'constructor' ||
      key === 'prototype'
    ) {
      continue;
    }
    clean[key] = sanitizeNoSQL(value);
  }
  return clean;
};

app.use((req: Request, _res: Response, next: NextFunction) => {
  if (req.body) req.body = sanitizeNoSQL(req.body);
  if (req.query) req.query = sanitizeNoSQL(req.query);
  if (req.params) req.params = sanitizeNoSQL(req.params);
  next();
});

// Comprehensive Health & Telemetry Diagnostic Check
app.get('/health', (_req: Request, res: Response) => {
  const mem = process.memoryUsage();
  res.status(200).json({
    status: 'healthy',
    system: 'AgriFlux Autonomous Intelligence Mesh',
    uptimeSeconds: Math.floor(process.uptime()),
    workerPid: process.pid,
    memory: {
      rssMb: Math.round(mem.rss / (1024 * 1024)),
      heapUsedMb: Math.round(mem.heapUsed / (1024 * 1024)),
      heapTotalMb: Math.round(mem.heapTotal / (1024 * 1024)),
    },
    database: isDBConnected ? 'connected_mongodb' : 'resilient_in_memory_demo',
    blockchain: {
      chainLength: blockchain.getChain().length,
      isValid: blockchain.isChainValid().isValid,
      lastBlockHash: blockchain.getLatestBlock().hash,
    },
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/consultations', consultationRoutes);
app.use('/api/integration', integrationRoutes);
app.use('/api/iot-data', iotRoutes);
app.use('/api/field-intelligence', fieldIntelligenceRoutes);
app.use('/api/environmental', environmentalDataRoutes);
app.use('/api/blockchain', blockchainRoutes);

// Root platform diagnostic endpoint for cloud health checks
app.get('/', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'online',
    service: 'AgriFlux Autonomous Intelligence Mesh API',
    version: '2.0.0',
    documentation: '/api',
    healthCheck: '/health',
    timestamp: new Date().toISOString(),
  });
});

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

  // Sanitize internal database/system errors in production to prevent information leakage (CWE-209)
  const safeMessage =
    env.NODE_ENV === 'production' && status >= 500
      ? 'An unexpected internal error occurred. Please contact system support.'
      : message;

  res.status(status).json({
    success: false,
    message: safeMessage,
    stack: env.NODE_ENV === 'production' ? undefined : err.stack,
  });
});

/**
 * Container-Aware Deployment:
 * In containerized environments (Render, Railway, Docker, K8s), os.cpus() reports the virtualized
 * host machine core count (e.g. 8-16 cores) rather than container limits. Spawning N workers
 * causes multiple Node processes to exceed the 512MB RAM tier, triggering OOM restarts.
 * We run as a single lean process by default, or respect WEB_CONCURRENCY when explicitly configured.
 */
const WEB_CONCURRENCY = parseInt(process.env.WEB_CONCURRENCY || '1', 10);

if (cluster.isPrimary && env.NODE_ENV === 'production' && WEB_CONCURRENCY > 1) {
  console.log(
    `🚀 Primary process ${process.pid} is running. Spawning ${WEB_CONCURRENCY} workers...`
  );

  for (let i = 0; i < WEB_CONCURRENCY; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    console.warn(
      `⚠️  Worker ${worker.process.pid} died (code: ${code}, signal: ${signal}). Spawning replacement...`
    );
    cluster.fork();
  });
} else {
  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(
      `🚀 AgriFlux API Server listening on 0.0.0.0:${PORT} (PID ${process.pid}) [NODE_ENV=${env.NODE_ENV}]`
    );
    console.log(`📡 WebSocket Gateway: ws://0.0.0.0:${PORT}`);
    console.log(`🩺 Health check ready at http://0.0.0.0:${PORT}/health`);

    // Auto-seed historical weather observations if available (capped to protect heap in 512MB RAM containers)
    const weatherCsvCandidates = [
      path.resolve(process.cwd(), '..', 'Data', 'open-meteo-10.79N79.10E59m.csv'),
      path.resolve(process.cwd(), 'Data', 'open-meteo-10.79N79.10E59m.csv'),
      path.resolve(__dirname, '..', '..', 'Data', 'open-meteo-10.79N79.10E59m.csv'),
    ];
    const foundCsv = weatherCsvCandidates.find((p) => fs.existsSync(p));
    if (foundCsv) {
      WeatherIngestionService.ingestOpenMeteoCSV(foundCsv, {
        maxHourlyRows: 720, // 30 days of hourly observations
        maxDailyRows: 365, // 1 year of daily summaries
      })
        .then((res) => {
          console.log(
            `⛅ [WEATHER SEED] Auto-ingested ${res.dailyRecordsImported} daily and ${res.hourlyRecordsImported} hourly observations.`
          );
        })
        .catch((err) => {
          console.warn(`⚠️ [WEATHER SEED] Ingestion notice: ${err.message}`);
        });
    }

    // Auto-seed Directorate of Economics & Statistics (DES) APY data if available
    const apyCandidates = [
      path.resolve(process.cwd(), '..', 'Data', 'horizontal_crop_vertical_year_report.xls'),
      path.resolve(process.cwd(), 'Data', 'horizontal_crop_vertical_year_report.xls'),
      path.resolve(__dirname, '..', '..', 'Data', 'horizontal_crop_vertical_year_report.xls'),
    ];
    const foundApy = apyCandidates.find((p) => fs.existsSync(p));
    if (foundApy) {
      CropStatisticsService.ingestDESReport(foundApy)
        .then((res) => {
          console.log(
            `🌾 [DES APY SEED] Auto-ingested ${res.totalRecordsImported} official crop statistics records.`
          );
        })
        .catch((err) => {
          console.warn(`⚠️ [DES APY SEED] Ingestion notice: ${err.message}`);
        });
    }
  });

  // Graceful Shutdown Handler (Zero In-Flight Request Loss)
  const shutdown = (signal: string) => {
    console.log(`\n🛑 [SHUTDOWN] Received ${signal}. Initiating graceful termination...`);

    httpServer.close(async () => {
      console.log('🛑 [SHUTDOWN] HTTP/WebSocket listener closed.');
      try {
        const mongoose = await import('mongoose');
        if (mongoose.default.connection.readyState !== 0) {
          await mongoose.default.connection.close(false);
          console.log('🛑 [SHUTDOWN] MongoDB connection closed cleanly.');
        }
      } catch (err: any) {
        console.warn('⚠️ [SHUTDOWN] MongoDB close warning:', err.message);
      }
      console.log('👋 [SHUTDOWN] Process exited gracefully.');
      process.exit(0);
    });

    // Fallback timeout to prevent hanging worker processes
    setTimeout(() => {
      console.error('⚠️ [SHUTDOWN] Forced exit due to shutdown timeout.');
      process.exit(1);
    }, 10000).unref();
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}
