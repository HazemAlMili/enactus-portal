import express from 'express';
import dbConnect, { getConnectionStatus } from '../lib/dbConnect';

const router = express.Router();

/**
 * Health check endpoint with database status
 * GET /api/health
 */
router.get('/', async (req, res) => {
  try {
    const status = getConnectionStatus();
    
    // Try to connect if not connected
    if (!status.isConnected) {
      await dbConnect();
    }
    
    const finalStatus = getConnectionStatus();
    
    res.json({
      status: 'ok',
      database: {
        connected: finalStatus.isConnected,
        readyState: finalStatus.readyState,
        name: finalStatus.name
      },
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      database: {
        connected: false,
        error: error instanceof Error ? error.message : String(error)
      },
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Warm up database connection
 * GET /api/health/warm
 * Use this on server start to establish connection early
 */
router.get('/warm', async (req, res) => {
  console.log('🔥 Warming up database connection...');
  const startTime = Date.now();
  
  try {
    await dbConnect();
    const duration = Date.now() - startTime;
    const status = getConnectionStatus();
    
    res.json({
      status: 'warmed',
      duration: `${duration}ms`,
      database: status,
      message: 'Connection pool ready for requests'
    });
  } catch (error) {
    res.status(500).json({
      status: 'failed',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

export default router;
