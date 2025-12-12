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
  .get(protect, authorize('HR', 'General President', 'Head', 'Vice Head'), getUsers) // Get All Users (HR/GP/Heads only)
  .post(protect, authorize('HR', 'General President', 'Head', 'Vice Head'), createUser); // Create New User (HR/GP/Heads only)

// Route: /api/users/:id
router.route('/:id')
  .delete(protect, authorize('HR', 'General President', 'Head', 'Vice Head'), deleteUser); // Delete User (HR/GP/Heads only)

// Export Router
export default router;
