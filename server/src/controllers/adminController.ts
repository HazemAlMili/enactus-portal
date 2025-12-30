import { Request, Response } from 'express';
import User from '../models/User';
import HighBoard from '../models/HighBoard';
import Task from '../models/Task';
import HourLog from '../models/HourLog';
import dbConnect from '../lib/dbConnect';
import mongoose from 'mongoose';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Admin Controller - System Monitoring & Health Checks
 * 
 * SECURITY: All routes are protected by authorizeAdmin middleware
 * Only General President can access these endpoints
 */

/**
 * Get comprehensive system statistics
 * Route: GET /api/admin/stats
 * Access: Admin Only
 */
export const getSystemStats = async (req: Request, res: Response) => {
  await dbConnect();
  
  try {
    const currentUser = (req as any).user;
    
    // SECURITY: Double-check admin role (General President OR IT Head)
    const isAdmin =currentUser?.role === 'Head' && currentUser?.department === 'IT';
    
    if (!isAdmin) {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    // 1. DATABASE STORAGE STATS
    const db = mongoose.connection.db;
    if (!db) {
      return res.status(500).json({ message: 'Database connection not ready' });
    }
    const stats = await db.stats();
    
    const storageStats = {
      currentSize: stats.dataSize, // Bytes
      currentSizeMB: (stats.dataSize / (1024 * 1024)).toFixed(2),
      indexSize: stats.indexSize,
      indexSizeMB: (stats.indexSize / (1024 * 1024)).toFixed(2),
      totalSize: stats.dataSize + stats.indexSize,
      totalSizeMB: ((stats.dataSize + stats.indexSize) / (1024 * 1024)).toFixed(2),
      limit: 512, // MB
      limitBytes: 512 * 1024 * 1024,
      usagePercentage: (((stats.dataSize + stats.indexSize) / (512 * 1024 * 1024)) * 100).toFixed(2),
      collections: stats.collections,
      objects: stats.objects
    };

    // 2. CONNECTION STATS
    const connectionStats = {
      isConnected: mongoose.connection.readyState === 1,
      readyState: mongoose.connection.readyState,
      dbName: mongoose.connection.name || 'Unknown',
      // Get pool stats from mongoose
      currentConnections: mongoose.connections.length,
      maxPoolSize: 10, // From dbConnect.ts
      minPoolSize: 2,
      connectionLimit: 500 // M0 limit
    };

    // 3. USER & DATA COUNTS (lightweight - only counts)
    const [
      totalUsers,
      totalHighBoard,
      testUsers,
      totalTasks,
      pendingTasks,
      completedTasks,
      testTasks,
      totalHourLogs,
      pendingHours,
      testHourLogs
    ] = await Promise.all([
      User.countDocuments({ isTest: { $ne: true } }),
      HighBoard.countDocuments({ isTest: { $ne: true } }),
      User.countDocuments({ isTest: true }),
      Task.countDocuments({ isTest: { $ne: true } }),
      Task.countDocuments({ status: 'Pending', isTest: { $ne: true } }),
      Task.countDocuments({ status: 'Completed', isTest: { $ne: true } }),
      Task.countDocuments({ isTest: true }),
      HourLog.countDocuments({ isTest: { $ne: true } }),
      HourLog.countDocuments({ status: 'Pending', isTest: { $ne: true } }),
      HourLog.countDocuments({ isTest: true })
    ]);

    const dataStats = {
      users: {
        total: totalUsers + totalHighBoard,
        regular: totalUsers,
        highBoard: totalHighBoard,
        test: testUsers
      },
      tasks: {
        total: totalTasks,
        pending: pendingTasks,
        completed: completedTasks,
        test: testTasks
      },
      hourLogs: {
        total: totalHourLogs,
        pending: pendingHours,
        test: testHourLogs
      }
    };

    // 4. BACKUP STATUS
    const backupDir = path.join(__dirname, '../../backups');
    let backupStats = {
      exists: false,
      lastBackup: null as null | {
        date: string;
        fileName: string;
        sizeMB: string;
        age: string;
      },
      totalBackups: 0,
      totalBackupSizeMB: '0'
    };

    if (fs.existsSync(backupDir)) {
      const files = fs.readdirSync(backupDir)
        .filter(f => f.startsWith('backup-') && (f.endsWith('.json') || !f.includes('.')))
        .map(f => {
          const filePath = path.join(backupDir, f);
          const stats = fs.statSync(filePath);
          return {
            name: f,
            path: filePath,
            size: stats.size,
            sizeMB: (stats.size / (1024 * 1024)).toFixed(2),
            date: stats.mtime,
            isDirectory: stats.isDirectory()
          };
        })
        .sort((a, b) => b.date.getTime() - a.date.getTime());

      if (files.length > 0) {
        const latest = files[0];
        const ageMs = Date.now() - latest.date.getTime();
        const ageDays = Math.floor(ageMs / (1000 * 60 * 60 * 24));
        const ageHours = Math.floor((ageMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

        backupStats = {
          exists: true,
          lastBackup: {
            date: latest.date.toISOString(),
            fileName: latest.name,
            sizeMB: latest.sizeMB,
            age: ageDays > 0 ? `${ageDays}d ${ageHours}h ago` : `${ageHours}h ago`
          },
          totalBackups: files.length,
          totalBackupSizeMB: files.reduce((sum, f) => sum + parseFloat(f.sizeMB), 0).toFixed(2)
        };
      }
    }

    // 5. SYSTEM HEALTH INDICATORS
    const healthChecks = {
      storage: {
        status: parseFloat(storageStats.usagePercentage) < 80 ? 'healthy' : parseFloat(storageStats.usagePercentage) < 90 ? 'warning' : 'critical',
        message: parseFloat(storageStats.usagePercentage) < 80 
          ? 'Storage usage is within safe limits' 
          : parseFloat(storageStats.usagePercentage) < 90
          ? 'Storage approaching limit - consider cleanup'
          : 'CRITICAL: Storage nearly full - immediate cleanup required'
      },
      connections: {
        status: connectionStats.currentConnections < 50 ? 'healthy' : connectionStats.currentConnections < 100 ? 'warning' : 'critical',
        message: connectionStats.currentConnections < 50
          ? 'Connection usage is optimal'
          : connectionStats.currentConnections < 100
          ? 'Connection count elevated - monitor closely'
          : 'CRITICAL: High connection count - check for leaks'
      },
      backup: {
        status: backupStats.exists && backupStats.lastBackup ? 'healthy' : 'warning',
        message: backupStats.exists && backupStats.lastBackup
          ? `Last backup: ${backupStats.lastBackup.age}`
          : 'No recent backup found - run backup script'
      },
      testData: {
        status: testUsers === 0 && testTasks === 0 && testHourLogs === 0 ? 'healthy' : 'warning',
        message: testUsers === 0 && testTasks === 0 && testHourLogs === 0
          ? 'No test data in production'
          : `Test data found: ${testUsers + testTasks + testHourLogs} records - consider cleanup`
      }
    };

    // Overall health score
    const healthScores = Object.values(healthChecks).map(check => 
      check.status === 'healthy' ? 100 : check.status === 'warning' ? 50 : 0
    );
    const overallHealth = Math.floor(healthScores.reduce((a: number, b: number) => a + b, 0) / healthScores.length);

    // RESPONSE
    res.json({
      timestamp: new Date().toISOString(),
      storage: storageStats,
      connections: connectionStats,
      data: dataStats,
      backup: backupStats,
      health: {
        checks: healthChecks,
        overall: overallHealth,
        status: overallHealth >= 75 ? 'healthy' : overallHealth >= 50 ? 'warning' : 'critical'
      }
    });

  } catch (error) {
    console.error('❌ Admin stats error:', error);
    res.status(500).json({ message: 'Failed to fetch system statistics', error: String(error) });
  }
};

/**
 * Clean up test data
 * Route: POST /api/admin/cleanup-test-data
 * Access: Admin Only
 */
export const cleanupTestData = async (req: Request, res: Response) => {
  await dbConnect();
  
  try {
    const currentUser = (req as any).user;
    
    // SECURITY: Double-check admin role (General President OR IT Head)
    const isAdmin = currentUser?.role === 'Head' && currentUser?.department === 'IT';
    
    if (!isAdmin) {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    // Count before deletion
    const beforeCounts = {
      users: await User.countDocuments({ isTest: true }),
      highboard: await HighBoard.countDocuments({ isTest: true }),
      tasks: await Task.countDocuments({ isTest: true }),
      hourLogs: await HourLog.countDocuments({ isTest: true })
    };

    // Delete test data
    const results = await Promise.all([
      User.deleteMany({ isTest: true }),
      HighBoard.deleteMany({ isTest: true }),
      Task.deleteMany({ isTest: true }),
      HourLog.deleteMany({ isTest: true })
    ]);

    const deletedCounts = {
      users: results[0].deletedCount || 0,
      highboard: results[1].deletedCount || 0,
      tasks: results[2].deletedCount || 0,
      hourLogs: results[3].deletedCount || 0
    };

    const totalDeleted = Object.values(deletedCounts).reduce((sum, count) => sum + count, 0);

    console.log(`🗑️ Admin cleanup: Deleted ${totalDeleted} test records`);

    res.json({
      success: true,
      message: `Successfully deleted ${totalDeleted} test data records`,
      before: beforeCounts,
      deleted: deletedCounts,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Admin cleanup error:', error);
    res.status(500).json({ message: 'Failed to cleanup test data', error: String(error) });
  }
};

/**
 * Trigger manual backup
 * Route: POST /api/admin/trigger-backup
 * Access: Admin Only
 */
export const triggerBackup = async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).user;
    
    // SECURITY: Double-check admin role (General President OR IT Head)
    const isAdmin = currentUser?.role === 'Head' && currentUser?.department === 'IT';
    
    if (!isAdmin) {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    // Import and run backup function
    const { performBackup } = await import('../scripts/backup');
    
    // Run backup in background (don't wait)
    performBackup().catch(err => {
      console.error('❌ Background backup failed:', err);
    });

    res.json({
      success: true,
      message: 'Backup process started in background',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Admin backup trigger error:', error);
    res.status(500).json({ message: 'Failed to trigger backup', error: String(error) });
  }
};
