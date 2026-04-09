import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import { initDb } from './db';
import { router } from './routes';
import { performanceMiddleware } from './database-optimizations';

export async function createApp() {
  const app = express();

  // Compression
  app.use(compression());

  // Security headers
  app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  }));

  app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
      ? [process.env.CORS_ORIGIN || 'https://your-app-name.onrender.com', 'http://localhost:3000']
      : true,
    credentials: true
  }));
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: process.env.NODE_ENV === 'production' ? 300 : 100000,
    standardHeaders: true,
    legacyHeaders: false,
    // Keep dev iteration smooth while preserving production protection.
    skip: () => process.env.NODE_ENV !== 'production'
  });
  app.use(express.json());

  // Performance monitoring
  app.use(performanceMiddleware);

  // Initialize Database
  await initDb();

  // API routes
  app.use('/api', apiLimiter, router);

  // Serve uploads
  app.use('/uploads', express.static('uploads', {
    maxAge: '1d',
    etag: true
  }));

  return app;
}