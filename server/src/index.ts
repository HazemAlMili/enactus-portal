// Import core dependencies
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
// Security Middleware Imports
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
// import mongoSanitize from 'express-mongo-sanitize'; // Causing crash
// Custom Sanitizer Function - safely removes MongoDB operators
const sanitize = (obj: any): any => {
    if (!obj || typeof obj !== 'object') {
        return obj;
    }
    
    // Handle arrays
    if (Array.isArray(obj)) {
        obj.forEach((item: any) => sanitize(item));
        return obj;
    }
    
    // Handle plain objects
    for (const key in obj) {
        if (!Object.prototype.hasOwnProperty.call(obj, key)) continue;
        
        if (/^\$/.test(key)) {
            try {
                delete obj[key];
            } catch (e) {
                // If property is non-configurable, set to undefined
                try {
                    obj[key] = undefined;
                } catch (err) {
                    // Ignore if we can't modify it
                }
            }
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
            sanitize(obj[key]);
        }
    }
    return obj;
};
// Note: xss-clean types are sometimes tricky, using require if needed or standard import
// const xss = require('xss-clean'); // Temporarily disabled for debugging

// Initialize environment variables from .env file
dotenv.config();

// Create Express application instance
const app = express();
// Define port using environment variable or default to 5000
const PORT = process.env.PORT || 5000;

// Apply Middleware

// 1. Set Security HTTP Headers
app.use(helmet());

// 2. Enable CORS
// Allow all origins for now to fix CORS issues in dev, but in production this should be restricted
app.use(cors({
  origin: '*', 
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control', 'Pragma', 'Expires'],
  exposedHeaders: ['Cache-Control', 'Pragma', 'Expires'],
  credentials: false
}));

// Cache Busting Middleware - Prevent ANY caching
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
  next();
});

// 3. Rate Limiting - specific to API to prevent Brute Force / DDoS
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 1000, // Development: 1000, Production: 100
  message: 'Too many requests from this IP, please try again after 15 minutes',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});
app.use('/api', limiter);

// Parse incoming JSON requests with increased limit for Base64 images
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// 4. Data Sanitization against NoSQL Query Injection
// Custom Middleware to replace buggy express-mongo-sanitize
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

// 5. Data Sanitization against XSS
// app.use(xss()); // Temporarily disabled for debugging

// Import Route Handlers
import authRoutes from './routes/authRoutes';
import taskRoutes from './routes/taskRoutes';
import hourRoutes from './routes/hourRoutes';
import userRoutes from './routes/userRoutes';

// Register Route Paths
app.use('/api/auth', authRoutes); // Auth routes (login, me)
app.use('/api/tasks', taskRoutes); // Task management routes
app.use('/api/hours', hourRoutes); // Hours tracking routes
app.use('/api/users', userRoutes); // User management routes

// Basic Health Check Route
app.get('/', (req, res) => {
  res.send('Enactus Portal API Running');
});

// Global Error Handler (must be after all routes)
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Global error handler caught:', err);
  res.status(500).json({ 
    message: 'Internal server error', 
    error: process.env.NODE_ENV === 'development' ? err.message : undefined 
  });
});

// Database Connection
// Connection string from env or local fallback
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/enactus_portal';

// Connect to MongoDB
// MOVED TO lib/dbConnect.ts for Serverless/Vercel support
/*
mongoose.connect(MONGO_URI)
.then(() => console.log('MongoDB Connected'))
.catch(err => console.error(err));
*/

// Export app instance (useful for testing or serverless deployment like Vercel)
export default app;

import dbConnect from './lib/dbConnect';

// ...

// Server Startup
if (!process.env.VERCEL && process.env.NODE_ENV !== 'test') {
  // Connect to DB immediately on startup
  dbConnect().then(() => {
    // console.log('MongoDB Connected via Startup'); // Already logged inside dbConnect
  });

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}
