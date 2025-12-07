import express from 'express';
import { getLeaderboard, getUsers, createUser, deleteUser } from '../controllers/userController';
import { protect, authorize } from '../middleware/authMiddleware';

const router = express.Router();

router.get('/leaderboard', protect, getLeaderboard);
router.route('/')
  .get(protect, authorize('HR', 'General President'), getUsers)
  .post(protect, authorize('HR', 'General President'), createUser);

router.route('/:id')
  .delete(protect, authorize('HR', 'General President'), deleteUser);

export default router;
