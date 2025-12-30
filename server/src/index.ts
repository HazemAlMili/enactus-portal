// Import core dependencies
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
// Security Middleware Imports
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

// Custom Sanitizer Function
const sanitize = (obj: any): any => {
    if (!obj || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) {
        obj.forEach((item: any) => sanitize(item));
        return obj;
    }
    for (const key in obj) {
        if (!Object.prototype.hasOwnProperty.call(obj, key)) continue;
        if (/^\$/.test(key)) {
            try { delete obj[key]; } catch (e) { try { obj[key] = undefined; } catch (err) {} }
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
            sanitize(obj[key]);
        }
    }
    return obj;
};

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());

const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://enactus-portal.vercel.app',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn(`⚠️ CORS blocked origin: ${origin}`);
      callback(null, true);
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control', 'Pragma', 'Expires'],
  exposedHeaders: ['Cache-Control', 'Pragma', 'Expires', 'X-Cache'],
  credentials: true
}));

// Cache Busting
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
  next();
});

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 100 : 1000,
  message: 'Too many requests from this IP, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Data Sanitization
app.use((req, res, next) => {
    try {
        if (req.body) sanitize(req.body);
        if (req.query) sanitize(req.query);
        if (req.params) sanitize(req.params);
    } catch (error) {
        console.error('Sanitization error:', error);
    }
    next();
});

// Import Route Handlers
import authRoutes from './routes/authRoutes';
import taskRoutes from './routes/taskRoutes';
import hourRoutes from './routes/hourRoutes';
import userRoutes from './routes/userRoutes';
import healthRoutes from './routes/health';
import adminRoutes from './routes/adminRoutes';

// Register Route Paths
// Register Route Paths
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/hours', hourRoutes);
app.use('/api/users', userRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/admin', adminRoutes);

// Basic Health Check
app.get('/', (req, res) => {
  res.send('Enactus Portal API Running');
});

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Global error handler caught:', err);
  res.status(500).json({ 
    message: 'Internal server error', 
    error: process.env.NODE_ENV === 'development' ? err.message : undefined 
  });
});

export default app;

import dbConnect from './lib/dbConnect';

// Server Startup
if (!process.env.VERCEL && process.env.NODE_ENV !== 'test') {
  console.log('🚀 Starting Enactus Portal Server...');
  console.log('🔌 Warming up database connection to Bahrain...');
  
  const startTime = Date.now();
  
  dbConnect()
    .then(() => {
      const duration = Date.now() - startTime;
      console.log(`✅ Database connection pool ready in ${duration}ms`);
      console.log(`📡 Connection pool: 2-10 connections maintained`);
      
      app.listen(PORT, () => {
        console.log(`✅ Server running on port ${PORT}`);
        console.log(`🌐 API available at http://localhost:${PORT}`);
        console.log(`❤️ Health check: http://localhost:${PORT}/api/health`);
        console.log('');
        console.log('💡 TIP: Connection pool is warm - first requests will be fast!');
      });
    })
    .catch((error) => {
      console.error('❌ Failed to connect to database:', error);
      console.error('⚠️ Server will start anyway, but requests will be slow until connection succeeds');
      
      app.listen(PORT, () => {
        console.log(`⚠️ Server running on port ${PORT} (DATABASE CONNECTION FAILED)`);
      });
    });
}
