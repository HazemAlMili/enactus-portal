// Import Express
import express from 'express';
// Import Controllers
import { submitHours, getHours, updateHourStatus } from '../controllers/hourController';
// Import Auth Middleware
import { protect, authorize } from '../middleware/authMiddleware';

// Import Validation
import { createHourLogSchema, validationMiddleware } from '../lib/validation';

// Initialize Router
const router = express.Router();

// Route: /api/hours
router.route('/')
  .post(protect, validationMiddleware(createHourLogSchema), submitHours) // Submit new hours (Authenticated users)
  .get(protect, getHours); // Get history (Authenticated users)

// Route: /api/hours/:id
router.route('/:id')
  .put(protect, authorize('HR', 'General President', 'Vice President', 'Operation Director', 'Creative Director', 'Head', 'Vice Head', 'Member'), updateHourStatus); // Approve/Reject hours

// Export Router
export default router;
