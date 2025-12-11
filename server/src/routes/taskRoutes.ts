// Import Express
import express from 'express';
// Import Controllers
import { createTask, getTasks, updateTask } from '../controllers/taskController';
// Import Auth Middleware
import { protect, authorize } from '../middleware/authMiddleware';

// Initialize Router
const router = express.Router();

// Route: /api/tasks
router.route('/')
  .post(protect, authorize('HR', 'General President', 'Head', 'Vice Head'), createTask) // Create Task (Leaders only)
  .get(protect, getTasks); // Get Tasks (Authenticated users)

// Route: /api/tasks/:id
router.route('/:id')
  .put(protect, updateTask); // Update Task Status (Submit/Complete) - Logic handled in controller for who can do what

// Export Router
export default router;
