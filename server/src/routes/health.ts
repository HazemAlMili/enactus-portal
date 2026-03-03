// server/src/routes/health.ts
// Health check using Supabase connection instead of MongoDB.

import express from 'express';
import getSupabaseAdmin from '../lib/supabaseAdmin';

const router = express.Router();

/**
 * GET /api/health
 */
router.get('/', async (req, res) => {
  try {
    // Light ping — count 1 row from profiles to verify DB is reachable
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from('profiles').select('id').limit(1);

    if (error) throw error;

    res.json({
      status: 'ok',
      database: { provider: 'Supabase PostgreSQL', connected: true },
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      database: { connected: false, error: error instanceof Error ? error.message : String(error) },
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/health/warm
 */
router.get('/warm', async (req, res) => {
  const startTime = Date.now();
  try {
    const supabase = getSupabaseAdmin();
    await supabase.from('profiles').select('id').limit(1);
    res.json({ status: 'warmed', duration: `${Date.now() - startTime}ms`, provider: 'Supabase PostgreSQL' });
  } catch (error) {
    res.status(500).json({ status: 'failed', error: error instanceof Error ? error.message : String(error) });
  }
});

export default router;
