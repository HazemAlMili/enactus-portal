// Import Express
import express from 'express';
// Import Controllers
import { loginUser, getMe, changePassword } from '../controllers/authController';
// Import Middleware
import { protect } from '../middleware/authMiddleware';

// Import Validation
import { loginSchema, validationMiddleware } from '../lib/validation';

// Initialize Router
const router = express.Router();

// Define Routes
router.post('/login', validationMiddleware(loginSchema), loginUser); // Public route for logging in
router.get('/me', protect, getMe); // Protected route to get current user info
router.post('/change-password', protect, changePassword); // Protected route to change password

// Export Router
export default router;
