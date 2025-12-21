// Import Express
import express from 'express';
// Import Controllers
import { createTask, getTasks, updateTask, editTask, deleteTask } from '../controllers/taskController';
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

// Route: /api/tasks/:id/edit (Edit task details)
router.route('/:id/edit')
  .put(protect, editTask); // Edit Task (Creator only)

// Route: /api/tasks/:id (Delete task)
router.route('/:id')
  .delete(protect, deleteTask); // Delete Task (Creator only)

// Export Router
export default router;
