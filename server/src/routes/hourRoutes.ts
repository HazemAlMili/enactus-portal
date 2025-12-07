import express from 'express';
import { submitHours, getHours, updateHourStatus } from '../controllers/hourController';
import { protect, authorize } from '../middleware/authMiddleware';

const router = express.Router();

router.route('/')
  .post(protect, submitHours)
  .get(protect, getHours);

router.route('/:id')
  .put(protect, authorize('HR', 'General President', 'Head', 'Vice Head'), updateHourStatus);

export default router;
