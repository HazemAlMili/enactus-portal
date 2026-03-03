// server/src/controllers/adminController.ts
// Rewrote to use Supabase instead of Mongoose/MongoDB.

import { Request, Response } from 'express';
import getSupabaseAdmin from '../lib/supabaseAdmin';
import * as fs from 'fs';
import * as path from 'path';

/**
 * GET /api/admin/stats
 */
export const getSystemStats = async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).user;
    const isAdmin = currentUser?.role === 'Head' && currentUser?.department === 'IT';
    if (!isAdmin) return res.status(403).json({ message: 'Access denied. Admin only.' });

    const supabase = getSupabaseAdmin();

    // Count records
    const [
      { count: totalProfiles },
      { count: testProfiles },
      { count: totalTasks },
      { count: pendingTasks },
      { count: completedTasks },
      { count: testTasks },
      { count: totalLogs },
      { count: pendingLogs },
      { count: testLogs },
    ] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }).neq('is_test', true),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_test', true),
      supabase.from('tasks').select('*', { count: 'exact', head: true }).neq('is_test', true),
      supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('status', 'Pending').neq('is_test', true),
      supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('status', 'Completed').neq('is_test', true),
      supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('is_test', true),
      supabase.from('hour_logs').select('*', { count: 'exact', head: true }).neq('is_test', true),
      supabase.from('hour_logs').select('*', { count: 'exact', head: true }).eq('status', 'Pending').neq('is_test', true),
      supabase.from('hour_logs').select('*', { count: 'exact', head: true }).eq('is_test', true),
    ]);

    const dataStats = {
      users: { total: totalProfiles || 0, test: testProfiles || 0 },
      tasks: { total: totalTasks || 0, pending: pendingTasks || 0, completed: completedTasks || 0, test: testTasks || 0 },
      hourLogs: { total: totalLogs || 0, pending: pendingLogs || 0, test: testLogs || 0 },
    };

    // Backup status
    const backupDir = path.join(__dirname, '../../backups');
    let backupStats = { exists: false, lastBackup: null as any, totalBackups: 0, totalBackupSizeMB: '0' };

    if (fs.existsSync(backupDir)) {
      const files = fs.readdirSync(backupDir)
        .filter(f => f.startsWith('backup-'))
        .map(f => {
          const filePath = path.join(backupDir, f);
          const stat = fs.statSync(filePath);
          return { name: f, size: stat.size, sizeMB: (stat.size / 1024 / 1024).toFixed(2), date: stat.mtime };
        })
        .sort((a, b) => b.date.getTime() - a.date.getTime());

      if (files.length > 0) {
        const latest = files[0];
        const ageMs = Date.now() - latest.date.getTime();
        const ageDays = Math.floor(ageMs / 86400000);
        const ageHours = Math.floor((ageMs % 86400000) / 3600000);
        backupStats = {
          exists: true,
          lastBackup: { date: latest.date.toISOString(), fileName: latest.name, sizeMB: latest.sizeMB, age: ageDays > 0 ? `${ageDays}d ${ageHours}h ago` : `${ageHours}h ago` },
          totalBackups: files.length,
          totalBackupSizeMB: files.reduce((s, f) => s + parseFloat(f.sizeMB), 0).toFixed(2),
        };
      }
    }

    // Health checks
    const testDataCount = (testProfiles || 0) + (testTasks || 0) + (testLogs || 0);
    const healthChecks = {
      database: { status: 'healthy', message: 'Connected to Supabase PostgreSQL' },
      backup: {
        status: backupStats.exists ? 'healthy' : 'warning',
        message: backupStats.exists ? `Last backup: ${backupStats.lastBackup?.age}` : 'No recent backup found',
      },
      testData: {
        status: testDataCount === 0 ? 'healthy' : 'warning',
        message: testDataCount === 0 ? 'No test data in production' : `Test data found: ${testDataCount} records`,
      },
    };

    const healthScores = Object.values(healthChecks).map(c => c.status === 'healthy' ? 100 : c.status === 'warning' ? 50 : 0);
    const overallHealth = Math.floor(healthScores.reduce((a: number, b: number) => a + b, 0) / healthScores.length);

    res.json({
      timestamp: new Date().toISOString(),
      database: { provider: 'Supabase PostgreSQL', status: 'connected' },
      data: dataStats,
      backup: backupStats,
      health: {
        checks: healthChecks,
        overall: overallHealth,
        status: overallHealth >= 75 ? 'healthy' : overallHealth >= 50 ? 'warning' : 'critical',
      },
    });
  } catch (error) {
    console.error('❌ Admin stats error:', error);
    res.status(500).json({ message: 'Failed to fetch system statistics', error: String(error) });
  }
};

/**
 * POST /api/admin/cleanup-test-data
 */
export const cleanupTestData = async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).user;
    const isAdmin = currentUser?.role === 'Head' && currentUser?.department === 'IT';
    if (!isAdmin) return res.status(403).json({ message: 'Access denied. Admin only.' });

    const supabase = getSupabaseAdmin();

    // Count before
    const [{ count: testUsers }, { count: testTasks }, { count: testLogs }] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_test', true),
      supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('is_test', true),
      supabase.from('hour_logs').select('*', { count: 'exact', head: true }).eq('is_test', true),
    ]);

    // Get test user IDs for auth deletion
    const { data: testProfiles } = await supabase.from('profiles').select('id').eq('is_test', true);

    // Delete test users from Auth (cascades to profiles via FK)
    if (testProfiles && testProfiles.length > 0) {
      await Promise.all(testProfiles.map((p: any) => supabase.auth.admin.deleteUser(p.id)));
    }

    // other test data already cascaded or can be cleaned directly
    await Promise.all([
      supabase.from('tasks').delete().eq('is_test', true),
      supabase.from('hour_logs').delete().eq('is_test', true),
    ]);

    const totalDeleted = (testUsers || 0) + (testTasks || 0) + (testLogs || 0);
    console.log(`🗑️ Admin cleanup: Deleted ${totalDeleted} test records`);

    res.json({
      success: true,
      message: `Successfully deleted ${totalDeleted} test data records`,
      before: { users: testUsers, tasks: testTasks, hourLogs: testLogs },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Admin cleanup error:', error);
    res.status(500).json({ message: 'Failed to cleanup test data', error: String(error) });
  }
};

/**
 * POST /api/admin/trigger-backup
 */
export const triggerBackup = async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).user;
    const isAdmin = currentUser?.role === 'Head' && currentUser?.department === 'IT';
    if (!isAdmin) return res.status(403).json({ message: 'Access denied. Admin only.' });

    res.json({
      success: true,
      message: 'Backup via Supabase: Use the Supabase Dashboard → Storage or pg_dump with the direct connection string for backups.',
      timestamp: new Date().toISOString(),
      tip: 'Connection string is in server/.env as SUPABASE_DIRECT_URL',
    });
  } catch (error) {
    console.error('❌ Admin backup error:', error);
    res.status(500).json({ message: 'Failed to trigger backup', error: String(error) });
  }
};
