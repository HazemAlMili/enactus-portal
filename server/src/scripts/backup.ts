import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import * as fs from 'fs';
import dbConnect from '../lib/dbConnect';
import User from '../models/User';
import Task from '../models/Task';
import HourLog from '../models/HourLog';
import HighBoard from '../models/HighBoard';

const execAsync = promisify(exec);

/**
 * Manual Backup Script for MongoDB M0 Free Cluster
 * 
 * M0 doesn't support automatic backups, so we need manual backups.
 * 
 * TWO METHODS:
 * 1. mongodump - Binary backup (requires mongodump installed)
 * 2. JSON Export - Exports each collection to JSON files
 * 
 * RECOMMENDED SCHEDULE: Weekly (e.g., every Sunday at 2 AM)
 * 
 * WINDOWS TASK SCHEDULER:
 * schtasks /create /tn "EnactusPortalBackup" /tr "node d:\E-Portal\enactus-portal\server\dist\scripts\backup.js" /sc weekly /d SUN /st 02:00
 * 
 * LINUX CRON:
 * 0 2 * * 0 cd /path/to/server && node dist/scripts/backup.js
 */

// Configuration
const BACKUP_DIR = path.join(__dirname, '../../backups');
const MONGO_URI = process.env.MONGO_URI || '';
const MAX_BACKUPS = 4; // Keep last 4 weeks of backups

/**
 * Ensure backup directory exists
 */
function ensureBackupDir(): void {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
    console.log(`📁 Created backup directory: ${BACKUP_DIR}`);
  }
}

/**
 * Clean up old backups (keep only MAX_BACKUPS)
 */
function cleanupOldBackups(): void {
  try {
    const files = fs.readdirSync(BACKUP_DIR)
      .filter(f => f.startsWith('backup-') && (f.endsWith('.json') || fs.statSync(path.join(BACKUP_DIR, f)).isDirectory()))
      .map(f => ({
        name: f,
        path: path.join(BACKUP_DIR, f),
        time: fs.statSync(path.join(BACKUP_DIR, f)).mtime.getTime()
      }))
      .sort((a, b) => b.time - a.time);

    if (files.length > MAX_BACKUPS) {
      console.log(`🗑️  Cleaning up old backups (keeping last ${MAX_BACKUPS})...`);
      files.slice(MAX_BACKUPS).forEach(file => {
        if (fs.statSync(file.path).isDirectory()) {
          fs.rmSync(file.path, { recursive: true });
        } else {
          fs.unlinkSync(file.path);
        }
        console.log(`   Deleted: ${file.name}`);
      });
    }
  } catch (error) {
    console.error('⚠️  Error cleaning up old backups:', error);
  }
}

/**
 * METHOD 1: Binary backup using mongodump
 * Requires mongodump to be installed on the system
 */
async function backupWithMongoDump(): Promise<void> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
  const backupPath = path.join(BACKUP_DIR, `backup-${timestamp}`);

  try {
    console.log('🔄 Starting mongodump backup...');
    
    // Extract database name from MONGO_URI
    const dbName = MONGO_URI.split('/').pop()?.split('?')[0] || 'enactus_portal';
    
    const command = `mongodump --uri="${MONGO_URI}" --out="${backupPath}"`;
    
    const { stdout, stderr } = await execAsync(command);
    
    if (stderr && !stderr.includes('done dumping')) {
      console.error('⚠️  mongodump stderr:', stderr);
    }
    
    console.log(`✅ Backup completed successfully!`);
    console.log(`📁 Location: ${backupPath}`);
    console.log(stdout);
    
    cleanupOldBackups();
    
  } catch (error: any) {
    console.error('❌ mongodump failed:', error.message);
    console.log('💡 Falling back to JSON export method...');
    await backupAsJSON();
  }
}

/**
 * METHOD 2: Export collections to JSON
 * Works without mongodump, but slower
 */
async function backupAsJSON(): Promise<void> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
  const backupFileName = `backup-${timestamp}.json`;
  const backupPath = path.join(BACKUP_DIR, backupFileName);

  try {
    console.log('🔄 Starting JSON export backup...');
    
    await dbConnect();
    
    // Export all collections
    console.log('📦 Exporting Users...');
    const users = await User.find({}).lean();
    
    console.log('📦 Exporting HighBoard...');
    const highboard = await HighBoard.find({}).lean();
    
    console.log('📦 Exporting Tasks...');
    const tasks = await Task.find({}).lean();
    
    console.log('📦 Exporting HourLogs...');
    const hourlogs = await HourLog.find({}).lean();
    
    const backup = {
      metadata: {
        timestamp: new Date().toISOString(),
        collections: ['users', 'highboard', 'tasks', 'hourlogs'],
        counts: {
          users: users.length,
          highboard: highboard.length,
          tasks: tasks.length,
          hourlogs: hourlogs.length
        }
      },
      data: {
        users,
        highboard,
        tasks,
        hourlogs
      }
    };
    
    // Write to file
    fs.writeFileSync(backupPath, JSON.stringify(backup, null, 2), 'utf-8');
    
    const fileSizeMB = (fs.statSync(backupPath).size / (1024 * 1024)).toFixed(2);
    
    console.log(`✅ Backup completed successfully!`);
    console.log(`📁 Location: ${backupPath}`);
    console.log(`📊 Size: ${fileSizeMB} MB`);
    console.log(`📈 Stats:`);
    console.log(`   - Users: ${users.length}`);
    console.log(`   - HighBoard: ${highboard.length}`);
    console.log(`   - Tasks: ${tasks.length}`);
    console.log(`   - HourLogs: ${hourlogs.length}`);
    
    cleanupOldBackups();
    
  } catch (error) {
    console.error('❌ JSON export failed:', error);
    throw error;
  }
}

/**
 * Main backup function
 * Try mongodump first, fall back to JSON if not available
 */
async function performBackup(): Promise<void> {
  console.log('='.repeat(60));
  console.log('🔐 ENACTUS PORTAL - MONGODB BACKUP');
  console.log('='.repeat(60));
  console.log(`📅 Started: ${new Date().toLocaleString()}`);
  console.log(`🌐 Database: ${MONGO_URI.split('@')[1]?.split('/')[0] || 'Unknown'}`);
  console.log('');
  
  ensureBackupDir();
  
  try {
    // Try mongodump first (faster and more reliable)
    await backupWithMongoDump();
  } catch (error) {
    // If mongodump fails, use JSON export
    console.log('💡 Using JSON export method...');
    await backupAsJSON();
  }
  
  console.log('');
  console.log('='.repeat(60));
  console.log(`✅ Backup process completed at ${new Date().toLocaleString()}`);
  console.log('='.repeat(60));
  
}

// Run backup if executed directly
if (require.main === module) {
  performBackup()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('💥 Backup failed:', error);
      process.exit(1);
    });
}

export { performBackup, backupAsJSON, backupWithMongoDump };
