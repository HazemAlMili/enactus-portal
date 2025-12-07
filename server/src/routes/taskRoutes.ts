import express from 'express';
import { createTask, getTasks, updateTask } from '../controllers/taskController';
import { protect, authorize } from '../middleware/authMiddleware';

const router = express.Router();

router.route('/')
  .post(protect, authorize('HR', 'General President', 'Head', 'Vice Head'), createTask)
  .get(protect, getTasks);

router.route('/:id')
  .put(protect, updateTask);

export default router;
