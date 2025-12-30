import express from 'express';
import { protect } from '../middleware/authMiddleware';
import { getSystemStats, cleanupTestData, triggerBackup } from '../controllers/adminController';

const router = express.Router();

/**
 * Admin Routes - System Monitoring & Management
 * 
 * SECURITY: All routes protected by JWT auth + Admin role check
 * Only General President can access
 */

// Middleware to check admin role (General President OR IT Head)
const authorizeAdmin = (req: any, res: any, next: any) => {
  const isAdmin = req.user?.role === 'Head' && req.user?.department === 'IT';
  
  if (!isAdmin) {
    return res.status(403).json({ 
      message: 'Access denied. This endpoint is restricted to administrators only.' 
    });
  }
  next();
};

// GET /api/admin/stats - Get comprehensive system statistics
router.get('/stats', protect, authorizeAdmin, getSystemStats);

// POST /api/admin/cleanup-test-data - Delete all test data
router.post('/cleanup-test-data', protect, authorizeAdmin, cleanupTestData);

// POST /api/admin/trigger-backup - Manually trigger backup
router.post('/trigger-backup', protect, authorizeAdmin, triggerBackup);

export default router;
