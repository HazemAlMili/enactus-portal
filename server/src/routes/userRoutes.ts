// Import Express
import express from 'express';
// Import Controllers
import { getLeaderboard, getUsers, createUser, deleteUser } from '../controllers/userController';
// Import Auth Middleware
import { protect, authorize } from '../middleware/authMiddleware';

// Initialize Router
const router = express.Router();

// Public/Private Leaderboard Route
router.get('/leaderboard', protect, getLeaderboard); // Fetch Top Users

// Route: /api/users (User Management)
router.route('/')
  .get(protect, authorize('HR', 'General President'), getUsers) // Get All Users (HR/GP only)
  .post(protect, authorize('HR', 'General President'), createUser); // Create New User (HR/GP only)

// Route: /api/users/:id
router.route('/:id')
  .delete(protect, authorize('HR', 'General President'), deleteUser); // Delete User (HR/GP only)

// Export Router
export default router;
