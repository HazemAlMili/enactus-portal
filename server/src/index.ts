// Import core dependencies
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

// Initialize environment variables from .env file
dotenv.config();

// Create Express application instance
const app = express();
// Define port using environment variable or default to 5000
const PORT = process.env.PORT || 5000;

// Apply Middleware
// Enable CORS to allow requests from any origin (development mode)
app.use(cors({
  origin: '*', // Allow all origins for now to fix CORS issues in dev
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Allowed HTTP methods
  allowedHeaders: ['Content-Type', 'Authorization'] // Allowed headers
}));
// Parse incoming JSON requests
app.use(express.json());

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

// Server Startup
// Only listen on specific port if not running in a serverless environment (detected via VERCEL env var)
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}
