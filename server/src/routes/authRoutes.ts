// server/src/routes/authRoutes.ts
// Login is now handled directly by Supabase Auth on the client.
// This router only exposes protected routes for profile data.

import express from 'express';
import { getMe, changePassword } from '../controllers/authController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

// GET /api/auth/me — returns current user profile (validates Supabase JWT)
router.get('/me', protect, getMe);

// POST /api/auth/change-password — changes password via Supabase Auth admin
router.post('/change-password', protect, changePassword);

export default router;
