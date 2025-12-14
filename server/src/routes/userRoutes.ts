// Import Express
import express from 'express';
// Import Controllers
import { getLeaderboard, getUsers, createUser, deleteUser, updateAvatar, addWarning } from '../controllers/userController';
// Import Auth Middleware
import { protect, authorize } from '../middleware/authMiddleware';

// Initialize Router
const router = express.Router();

// Update Avatar Route
router.put('/avatar', protect, updateAvatar);

// Public/Private Leaderboard Route
router.get('/leaderboard', protect, getLeaderboard); // Fetch Top Users

// Route: /api/users (User Management)
router.route('/')
  .get(protect, authorize('HR', 'General President', 'Vice President', 'Operation Director', 'Creative Director', 'Head', 'Vice Head'), getUsers)
  .post(protect, authorize('HR', 'General President', 'Vice President', 'Head', 'Vice Head'), createUser); // OPs/Creative usually don't recruit? I'll let them just in case or exclude. Sticking to HR/GP/Head for adding.

// Route: /api/users/:id/warning
router.post('/:id/warning', protect, authorize('HR', 'General President', 'Vice President'), addWarning); // VP can warn too?

// Route: /api/users/:id
router.route('/:id')
  .delete(protect, authorize('HR', 'General President', 'Vice President'), deleteUser);

// Export Router
export default router;
