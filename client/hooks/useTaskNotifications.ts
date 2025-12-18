import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';

interface TaskNotificationData {
  newTasksCount: number;
  pendingTasksCount: number;
  hasNewTasks: boolean;
  lastChecked: number;
  refresh: () => Promise<void>;
}

const STORAGE_KEY = 'lastTaskCheck';

export function useTaskNotifications() {
  const [notificationData, setNotificationData] = useState<TaskNotificationData>({
    newTasksCount: 0,
    pendingTasksCount: 0,
    hasNewTasks: false,
    lastChecked: 0,
    refresh: async () => {},
  });

  const checkForNewTasks = useCallback(async () => {
    // Only run in browser environment
    if (typeof window === 'undefined') return;
    
    try {
      const user = sessionStorage.getItem('user');
      if (!user) {
        console.log('⚠️ No user found in sessionStorage for task notifications');
        return;
      }
      
      const userData = JSON.parse(user);
      console.log('🔔 Checking tasks for user:', userData.name, 'Role:', userData.role);
      
      // Only check for Members (Heads don't need task notifications)
      if (userData.role !== 'Member') {
        console.log('⚠️ User is not a Member, skipping task notifications');
        return;
      }

      // Get last check timestamp from sessionStorage
      const lastCheckStr = sessionStorage.getItem(STORAGE_KEY);
      const lastCheck = lastCheckStr ? parseInt(lastCheckStr) : 0;
      console.log('📅 Last task check was at:', lastCheck ? new Date(lastCheck).toLocaleString() : 'Never');

      // Fetch tasks
      console.log('📥 Fetching tasks from API...');
      const { data: tasks } = await api.get('/tasks');
      console.log('✅ Fetched tasks:', tasks.length, 'total');
      
      // Filter for pending/rejected tasks (active tasks for member)
      const activeTasks = tasks.filter((t: any) => 
        ['Pending', 'Rejected'].includes(t.status)
      );
      console.log('📊 Active tasks (Pending/Rejected):', activeTasks.length);
      
      // Count new tasks (created after last check)
      const newTasks = tasks.filter((t: any) => {
        const createdAt = new Date(t.createdAt).getTime();
        return createdAt > lastCheck && t.status === 'Pending';
      });
      console.log('🆕 New tasks since last check:', newTasks.length);

      const notificationState = {
        newTasksCount: newTasks.length,
        pendingTasksCount: activeTasks.length,
        hasNewTasks: newTasks.length > 0,
        lastChecked: lastCheck,
        refresh: checkForNewTasks,
      };
      
      console.log('🔔 Setting notification data:', notificationState);
      setNotificationData(notificationState);

      // Update last checked timestamp
      sessionStorage.setItem(STORAGE_KEY, Date.now().toString());
      
    } catch (error) {
      console.error('❌ Failed to check for new tasks:', error);
    }
  }, []);

  useEffect(() => {
    // Initial check
    checkForNewTasks();
    
    // Poll for new tasks every 30 seconds
    const interval = setInterval(checkForNewTasks, 30000);
    
    return () => clearInterval(interval);
  }, [checkForNewTasks]);

  return notificationData;
}
