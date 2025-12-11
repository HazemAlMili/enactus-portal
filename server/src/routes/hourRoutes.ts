// Import Express
import express from 'express';
// Import Controllers
import { submitHours, getHours, updateHourStatus } from '../controllers/hourController';
// Import Auth Middleware
import { protect, authorize } from '../middleware/authMiddleware';

// Initialize Router
const router = express.Router();

// Route: /api/hours
router.route('/')
  .post(protect, submitHours) // Submit new hours (Authenticated users)
  .get(protect, getHours); // Get history (Authenticated users)

// Route: /api/hours/:id
router.route('/:id')
  .put(protect, authorize('HR', 'General President', 'Head', 'Vice Head'), updateHourStatus); // Approve/Reject hours (Leaders only)

// Export Router
export default router;
