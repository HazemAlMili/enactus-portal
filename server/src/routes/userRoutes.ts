// Import Express
import express from 'express';
// Import Controllers
import { getLeaderboard, getUsers, createUser, deleteUser, updateAvatar, addWarning } from '../controllers/userController';
// Import Auth Middleware
import { protect, authorize, authorizeHROnly } from '../middleware/authMiddleware';

// Initialize Router
const router = express.Router();

// Avatar Routes
router.put('/avatar', protect, updateAvatar);
router.delete('/avatar', protect, updateAvatar); // Reuse updateAvatar with null payload

// Public/Private Leaderboard Route
router.get('/leaderboard', protect, getLeaderboard); // Fetch Top Users

// Route: /api/users (User Management)
router.route('/')
  .get(protect, authorize('HR', 'General President', 'Vice President', 'Operation Director', 'Creative Director', 'Head', 'Vice Head'), getUsers)
  .post(protect, authorizeHROnly, createUser); // ONLY HR DEPARTMENT can recruit

// Route: /api/users/:id/warning - ONLY HR DEPARTMENT
router.post('/:id/warning', protect, authorizeHROnly, addWarning);

// Route: /api/users/:id (Delete User) - ONLY HR DEPARTMENT
router.route('/:id')
  .delete(protect, authorizeHROnly, deleteUser);

// Export Router
export default router;
