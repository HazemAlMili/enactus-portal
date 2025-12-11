// Import Express
import express from 'express';
// Import Controllers
import { loginUser, getMe } from '../controllers/authController';
// Import Middleware
import { protect } from '../middleware/authMiddleware';

// Initialize Router
const router = express.Router();

// Define Routes
router.post('/login', loginUser); // Public route for logging in
router.get('/me', protect, getMe); // Protected route to get current user info

// Export Router
export default router;
