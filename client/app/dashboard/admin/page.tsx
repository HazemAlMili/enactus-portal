'use client';

// Force rebuild: 2025-12-30 03:22

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { playClick, playSuccess, playError } from '@/lib/sounds';
import { 
  Activity, Database, HardDrive, Shield, Users, FileText, Clock, 
  Trash2, Save, RefreshCw, CheckCircle, AlertTriangle, AlertOctagon,
  X
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useNotification } from "@/components/ui/notification";

export const dynamic = 'force-dynamic';

interface StorageStats {
  currentSizeMB: string;
  indexSizeMB: string;
  totalSizeMB: string;
  limit: number;
  usagePercentage: string;
  collections: number;
  objects: number;
}

interface ConnectionStats {
  isConnected: boolean;
  readyState: number;
  dbName: string;
  currentConnections: number;
  maxPoolSize: number;
  minPoolSize: number;
  connectionLimit: number;
}

interface DataStats {
  users: { total: number; regular: number; highBoard: number; test: number };
  tasks: { total: number; pending: number; completed: number; test: number };
  hourLogs: { total: number; pending: number; test: number };
}

interface BackupStats {
  exists: boolean;
  lastBackup: null | {
    date: string;
    fileName: string;
    sizeMB: string;
    age: string;
  };
  totalBackups: number;
  totalBackupSizeMB: string;
}

interface HealthCheck {
  status: 'healthy' | 'warning' | 'critical';
  message: string;
}

interface SystemStats {
  timestamp: string;
  storage: StorageStats;
  connections: ConnectionStats;
  data: DataStats;
  backup: BackupStats;
  health: {
    checks: {
      storage: HealthCheck;
      connections: HealthCheck;
      backup: HealthCheck;
      testData: HealthCheck;
    };
    overall: number;
    status: 'healthy' | 'warning' | 'critical';
  };
}

export default function AdminDashboard() {
  const router = useRouter();
  const { showNotification } = useNotification();
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cleanupLoading, setCleanupLoading] = useState(false);
  const [backupLoading, setBackupLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  
  // Modal states
  const [showCleanupModal, setShowCleanupModal] = useState(false);
  const [showBackupModal, setShowBackupModal] = useState(false);

  const fetchStats = async () => {
    try {
      const response = await api.get('/admin/stats');
      setStats(response.data);
      setError('');
    } catch (err: any) {
      console.error('Failed to fetch admin stats:', err);
      if (err.response?.status === 403) {
        setError('Access denied. Admin privileges required.');
        playError();
        setTimeout(() => router.push('/dashboard'), 2000);
      } else {
        setError(err.response?.data?.message || 'Failed to load system statistics');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    if (autoRefresh) {
      const interval = setInterval(fetchStats, 30000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const executeCleanupTestData = async () => {
    setCleanupLoading(true);
    // playClick(); // Click sound handled by modal button
    
    try {
      const response = await api.post('/admin/cleanup-test-data');
      playSuccess();
      setShowCleanupModal(false);
      showNotification(
        `Cleanup Successful: Deleted ${response.data.deleted.users} users, ${response.data.deleted.tasks} tasks, ${response.data.deleted.hourLogs} logs`,
        'success',
        6000
      );
      fetchStats();
    } catch (err: any) {
      playError();
      showNotification(
        'Cleanup failed: ' + (err.response?.data?.message || 'Unknown error'),
        'error'
      );
    } finally {
      setCleanupLoading(false);
    }
  };

  const executeTriggerBackup = async () => {
    setBackupLoading(true);
    // playClick(); // Click sound handled by modal button

    try {
      const response = await api.post('/admin/trigger-backup');
      playSuccess();
      setShowBackupModal(false);
      showNotification(
        'Backup started! check server/backups/ folder for the file.',
        'success'
      );
    } catch (err: any) {
      playError();
      showNotification(
        'Backup failed: ' + (err.response?.data?.message || 'Unknown error'),
        'error'
      );
    } finally {
      setBackupLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0a0a0f]">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-400 font-medium tracking-wide">Initializing secure dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0a0a0f]">
        <div className="bg-red-500/10 border border-red-500/50 backdrop-blur-md rounded-2xl p-8 max-w-md text-center shadow-2xl shadow-red-500/20">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-red-500 font-bold text-2xl mb-2">Access Denied</h2>
          <p className="text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-emerald-400';
      case 'warning': return 'text-amber-400';
      case 'critical': return 'text-rose-500';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] p-4 sm:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-gray-900/50 p-6 rounded-2xl border border-white/5 backdrop-blur-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-500/10 rounded-xl border border-purple-500/20">
              <Shield className="w-8 h-8 text-purple-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">Admin Monitoring Dashboard</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <p className="text-gray-400 text-sm">MongoDB M0 Cluster • Bahrain</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => { playClick(); setAutoRefresh(!autoRefresh); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                autoRefresh 
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20' 
                  : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
              }`}
            >
              <RefreshCw className={`w-4 h-4 ${autoRefresh ? 'animate-spin' : ''}`} />
              {autoRefresh ? 'Auto-Refresh On' : 'Auto-Refresh Off'}
            </button>
            <button
              onClick={() => { playClick(); fetchStats(); }}
              className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-lg shadow-purple-900/20"
            >
              Refresh Now
            </button>
          </div>
        </div>

        {/* Health Overview Card */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-900/40 border border-white/5 rounded-2xl p-6 relative overflow-hidden group hover:border-white/10 transition-all duration-300">
            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-purple-500/10 transition-all duration-500"></div>
            
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-gray-400 font-medium mb-1">System Health Score</h2>
                <div className="flex items-baseline gap-2">
                  <span className={`text-5xl font-bold ${getStatusColor(stats.health.status)}`}>
                    {stats.health.overall}%
                  </span>
                  <span className={`text-sm font-medium px-2 py-0.5 rounded-full ${
                    stats.health.status === 'healthy' ? 'bg-emerald-500/10 text-emerald-400' : 
                    stats.health.status === 'warning' ? 'bg-amber-500/10 text-amber-400' : 
                    'bg-rose-500/10 text-rose-500'
                  }`}>
                    {stats.health.status.toUpperCase()}
                  </span>
                </div>
              </div>
              <Activity className="w-8 h-8 text-gray-600" />
            </div>

            <div className="space-y-3">
              <HealthItem label="Storage" status={stats.health.checks.storage.status} message={stats.health.checks.storage.message} />
              <HealthItem label="Connections" status={stats.health.checks.connections.status} message={stats.health.checks.connections.message} />
              <HealthItem label="Backups" status={stats.health.checks.backup.status} message={stats.health.checks.backup.message} />
            </div>
          </div>

          <div className="bg-gray-900/40 border border-white/5 rounded-2xl p-6 relative overflow-hidden hover:border-white/10 transition-all duration-300">
            <div className="flex items-center gap-3 mb-6">
              <Database className="w-5 h-5 text-blue-400" />
              <h2 className="text-white font-semibold">Storage Capacity</h2>
            </div>
            
            <div className="flex justify-between items-end mb-2">
              <span className="text-3xl font-bold text-white">{stats.storage.totalSizeMB} <span className="text-lg text-gray-500 font-normal">MB</span></span>
              <span className="text-gray-400 text-sm">of {stats.storage.limit} MB</span>
            </div>

            <div className="w-full bg-gray-800 rounded-full h-3 mb-6 overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-1000 ease-out ${
                  parseFloat(stats.storage.usagePercentage) < 80 ? 'bg-emerald-500' : 
                  parseFloat(stats.storage.usagePercentage) < 90 ? 'bg-amber-500' : 'bg-rose-500'
                }`}
                style={{ width: `${Math.min(parseFloat(stats.storage.usagePercentage), 100)}%` }}
              ></div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <StatBox label="Data Size" value={`${stats.storage.currentSizeMB} MB`} />
              <StatBox label="Index Size" value={`${stats.storage.indexSizeMB} MB`} />
              <StatBox label="Collections" value={stats.storage.collections.toString()} />
              <StatBox label="Documents" value={stats.storage.objects.toString()} />
            </div>
          </div>
        </div>

        {/* Detailed Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Connection Stats */}
          <div className="relative group bg-gray-900/40 border border-white/5 rounded-2xl p-6 hover:bg-gray-900/60 transition-all overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-indigo-500/10 rounded-lg">
                  <Activity className="w-5 h-5 text-indigo-400" />
                </div>
                <h3 className="text-gray-200 font-semibold text-sm tracking-wide uppercase font-sans">Connections</h3>
              </div>
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-4xl font-bold text-white tracking-tight">{stats.connections.currentConnections}</span>
                <span className="text-gray-500 text-sm font-medium">/ {stats.connections.connectionLimit}</span>
              </div>
              <div className="flex gap-2 text-xs font-mono">
                <span className="px-2 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded text-indigo-300">Min: {stats.connections.minPoolSize}</span>
                <span className="px-2 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded text-indigo-300">Max: {stats.connections.maxPoolSize}</span>
              </div>
            </div>
          </div>

          {/* User Stats */}
          <div className="relative group bg-gray-900/40 border border-white/5 rounded-2xl p-6 hover:bg-gray-900/60 transition-all overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-pink-500/10 rounded-lg">
                  <Users className="w-5 h-5 text-pink-400" />
                </div>
                <h3 className="text-gray-200 font-semibold text-sm tracking-wide uppercase font-sans">Total Users</h3>
              </div>
              <div className="mb-4">
                <span className="text-4xl font-bold text-white tracking-tight">{stats.data.users.total}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Members: <strong className="text-white">{stats.data.users.regular}</strong></span>
                <span className="text-gray-400">Leads: <strong className="text-white">{stats.data.users.highBoard}</strong></span>
              </div>
            </div>
          </div>

          {/* Task Stats */}
          <div className="relative group bg-gray-900/40 border border-white/5 rounded-2xl p-6 hover:bg-gray-900/60 transition-all overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-cyan-500/10 rounded-lg">
                  <FileText className="w-5 h-5 text-cyan-400" />
                </div>
                <h3 className="text-gray-200 font-semibold text-sm tracking-wide uppercase font-sans">Active Tasks</h3>
              </div>
              <div className="mb-4">
                <span className="text-4xl font-bold text-white tracking-tight">{stats.data.tasks.total}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="flex items-center gap-1.5 text-amber-400 bg-amber-400/5 px-2 py-0.5 rounded border border-amber-400/10">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                  Wait: {stats.data.tasks.pending}
                </span>
                <span className="flex items-center gap-1.5 text-emerald-400 bg-emerald-400/5 px-2 py-0.5 rounded border border-emerald-400/10">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  Done: {stats.data.tasks.completed}
                </span>
              </div>
            </div>
          </div>

          {/* Hour Stats */}
          <div className="relative group bg-gray-900/40 border border-white/5 rounded-2xl p-6 hover:bg-gray-900/60 transition-all overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-orange-500/10 rounded-lg">
                  <Clock className="w-5 h-5 text-orange-400" />
                </div>
                <h3 className="text-gray-200 font-semibold text-sm tracking-wide uppercase font-sans">Hour Logs</h3>
              </div>
              <div className="mb-4">
                <span className="text-4xl font-bold text-white tracking-tight">{stats.data.hourLogs.total}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="flex items-center gap-1.5 text-amber-400 bg-amber-400/5 px-2 py-0.5 rounded border border-amber-400/10">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                  Pending: {stats.data.hourLogs.pending}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Center */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Backup Management */}
          <div className="bg-gray-900/40 border border-white/5 rounded-2xl p-6 hover:border-white/10 transition-all">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-3">
                <HardDrive className="w-5 h-5 text-emerald-400" />
                <h3 className="text-lg font-semibold text-white">Backup Management</h3>
              </div>
              {stats.backup.exists && (
                <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-xs font-medium rounded-full border border-emerald-500/20">
                  Protected
                </span>
              )}
            </div>

            <div className="bg-black/20 rounded-xl p-4 mb-6">
              {stats.backup.lastBackup ? (
                <div className="flex justify-between items-center text-sm">
                  <div>
                    <p className="text-gray-400">Last Backup</p>
                    <p className="text-white font-medium mt-1">{stats.backup.lastBackup.age}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-400">Size</p>
                    <p className="text-white font-medium mt-1">{stats.backup.lastBackup.sizeMB} MB</p>
                  </div>
                </div>
              ) : (
                <p className="text-amber-400 text-sm flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" /> No backups found
                </p>
              )}
            </div>

            <button
              onClick={() => { playClick(); setShowBackupModal(true); }}
              disabled={backupLoading}
              className="w-full py-3 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 rounded-xl font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {backupLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {backupLoading ? 'Creating Backup...' : 'Trigger Manual Backup'}
            </button>
          </div>

          {/* Danger Zone */}
          <div className="bg-rose-900/10 border border-rose-500/20 rounded-2xl p-6 hover:bg-rose-900/20 transition-all">
             <div className="flex items-center gap-3 mb-6">
              <AlertOctagon className="w-5 h-5 text-rose-400" />
              <h3 className="text-lg font-semibold text-rose-100">Danger Zone</h3>
            </div>

            <div className="bg-rose-950/30 rounded-xl p-4 mb-6 border border-rose-500/10">
              <div className="flex justify-between items-center mb-2">
                <span className="text-rose-200 text-sm font-medium">Test Data Detected</span>
                <span className="text-rose-400 text-xs">{stats.data.users.test + stats.data.tasks.test + stats.data.hourLogs.test} Items</span>
              </div>
              <p className="text-rose-300/60 text-xs leading-relaxed">
                Permanently deletes all users, tasks, and logs flagged as "test". 
                This action cannot be undone.
              </p>
            </div>

            <button
              onClick={() => { playClick(); setShowCleanupModal(true); }}
              disabled={cleanupLoading || (stats.data.users.test === 0 && stats.data.tasks.test === 0)}
              className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:bg-gray-700"
            >
              {cleanupLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              {cleanupLoading ? 'Cleaning System...' : 'Purge Test Data'}
            </button>
          </div>
        </div>

      {/* Backup Confirmation Modal */}
      <Dialog open={showBackupModal} onOpenChange={setShowBackupModal}>
        <DialogContent className="bg-[#0a0a0f] border border-white/10 text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-400">
              <Save className="w-5 h-5" />
              Confirm Manual Backup
            </DialogTitle>
            <DialogDescription className="text-gray-400 pt-2" asChild>
              <div className="text-gray-400 pt-2">
                You are about to trigger a manual system backup. This process will:
                <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                   <li>Export all database collections to JSON files</li>
                   <li>Save the backup in the server/backups directory</li>
                   <li>Run in the background without meaningful downtime</li>
                </ul>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 mt-4">
            <button
              onClick={() => setShowBackupModal(false)}
              className="px-4 py-2 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 transition-colors text-sm font-medium"
            >
              Cancel
            </button>
            <button
              onClick={executeTriggerBackup}
              disabled={backupLoading}
              className="px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 transition-colors text-sm font-medium flex items-center gap-2"
            >
              {backupLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : null}
              {backupLoading ? 'Starting...' : 'Yes, Start Backup'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cleanup Confirmation Modal */}
      <Dialog open={showCleanupModal} onOpenChange={setShowCleanupModal}>
        <DialogContent className="bg-[#0a0a0f] border border-rose-500/30 text-white sm:max-w-md shadow-2xl shadow-rose-900/20">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-500">
              <AlertOctagon className="w-5 h-5" />
              DANGER: Delete Test Data?
            </DialogTitle>
            <DialogDescription className="text-gray-400 pt-2" asChild>
              <div className="text-gray-400 pt-2">
                <div className="bg-rose-950/30 border border-rose-500/20 rounded-lg p-3 mb-3">
                  <p className="text-rose-200 font-medium text-sm">⚠️ Irreversible Action</p>
                  <p className="text-rose-300/70 text-xs mt-1">This cannot be undone. Always ensure you have a backup before proceeding.</p>
                </div>
                You are about to permanently delete <span className="text-white font-bold">{stats.data.users.test + stats.data.tasks.test + stats.data.hourLogs.test} items</span> directly from the production database.
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 mt-4">
            <button
              onClick={() => setShowCleanupModal(false)}
              className="px-4 py-2 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 transition-colors text-sm font-medium"
            >
              Cancel
            </button>
            <button
              onClick={executeCleanupTestData}
              disabled={cleanupLoading}
              className="px-4 py-2 rounded-lg bg-rose-600 text-white hover:bg-rose-700 transition-colors text-sm font-medium flex items-center gap-2"
            >
              {cleanupLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              {cleanupLoading ? 'Deleting...' : 'Yes, Delete Everything'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-black/20 p-3 rounded-lg border border-white/5">
      <p className="text-gray-500 text-xs mb-1">{label}</p>
      <p className="text-white font-medium">{value}</p>
    </div>
  );
}

function HealthItem({ label, status, message }: { label: string; status: 'healthy' | 'warning' | 'critical'; message: string }) {
  const color = status === 'healthy' ? 'bg-emerald-500' : status === 'warning' ? 'bg-amber-500' : 'bg-rose-500';
  return (
    <div className="flex items-center gap-3 text-sm bg-black/20 p-2 rounded-lg border border-white/5">
      <div className={`w-2 h-2 rounded-full ${color}`}></div>
      <span className="text-gray-300 w-24">{label}</span>
      <span className="text-gray-500 text-xs truncate flex-1">{message}</span>
    </div>
  );
}
