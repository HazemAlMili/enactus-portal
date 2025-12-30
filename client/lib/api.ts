/// <reference types="node" />
// Import axios for making HTTP requests
import axios from 'axios';

import { MOCK_STATS, MOCK_USER, MOCK_TASKS, MOCK_USERS } from './demoData';

// Define the API Base URL. Uses environment variable or defaults to localhost.
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Log the API URL to the console for debugging purposes
console.log('🔌 Connected to Backend at:', API_URL);

// Create an axios instance with the defined Base URL
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // ⚡ CRITICAL: Send cookies/credentials with requests!
  timeout: 30000, // 30 second timeout for Bahrain DB
});

// Custom error class for Demo Mode interception
class DemoModeError extends Error {
  mockResponse: any;
  constructor(mockResponse: any) {
    super('Demo Mode Interception');
    this.name = 'DemoModeError';
    this.mockResponse = mockResponse;
  }
}

// 🛡️ DEMO MODE REQUEST INTERCEPTOR
api.interceptors.request.use(async (config) => {
  // Retrieve the JWT token from sessionStorage
  const token = sessionStorage.getItem('token');
  
  // Check if we are in "Demo Mode" (Strict Guard)
  const isDemo = typeof window !== 'undefined' && sessionStorage.getItem('isDemo') === 'true';
  
  // A real JWT is usually very long. If it's present and looks real, we MUST bypass demo mode.
  const hasRealToken = token && token.length > 50;
  const isGuestUser = isDemo && !hasRealToken && (!token || token.startsWith('demo-'));

  if (isGuestUser) {
    console.log(`🛡️ [GUEST MODE] Intercepted ${config.method?.toUpperCase()} ${config.url}`);
    
    // Simulate network latency (300-600ms)
    await new Promise(r => setTimeout(r, 300 + Math.random() * 300));
    
    // Helper to format mock response
    const mockRes = (data: any, status = 200) => ({
      data,
      status,
      statusText: status === 200 ? 'OK' : 'Not Found',
      headers: {},
      config,
      request: {}
    });

    // --- LOCAL STORAGE PERSISTENCE HELPERS ---
    const getLocal = (key: string, defaultData: any) => {
      try {
        const stored = localStorage.getItem(`demo_${key}`);
        return stored ? JSON.parse(stored) : defaultData;
      } catch (e) {
        return defaultData;
      }
    };

    const setLocal = (key: string, data: any) => {
      localStorage.setItem(`demo_${key}`, JSON.stringify(data));
    };

    // --- MOCK ROUTE HANDLERS ---
    
    let responseData;
    const url = config.url || '';
    const path = url.split('?')[0]; // Strip query params for matching
    const method = config.method?.toLowerCase() || 'get';

    // 1. Auth / Me
    if (path.endsWith('/auth/me')) {
      responseData = mockRes(MOCK_USER);
    }
    // 2. Admin Stats
    else if (path.endsWith('/admin/stats')) {
      responseData = mockRes(MOCK_STATS);
    }
    // 3. Admin Actions (Cleanup)
    else if (path.endsWith('/admin/cleanup-test-data')) {
      localStorage.removeItem('demo_tasks'); // Reset tasks
      localStorage.removeItem('demo_hours'); // Reset hours
      localStorage.removeItem('demo_users'); // Reset users (back to mock defaults)
      responseData = mockRes({
        success: true,
        message: 'Deleted all test data (Simulated)',
        deleted: { users: 0, tasks: getLocal('tasks', MOCK_TASKS).length, hourLogs: 0 }
      });
    }
    // 4. Admin Actions (Backup)
    else if (path.endsWith('/admin/trigger-backup')) {
      responseData = mockRes({
        success: true,
        message: 'Backup created successfully (Simulated)'
      });
    }
    // 5. Tasks: GET ALL
    else if (path.endsWith('/tasks') && method === 'get') {
      const tasks = getLocal('tasks', MOCK_TASKS);
      responseData = mockRes(tasks);
    }
    // 6. Tasks: CREATE
    else if (path.endsWith('/tasks') && method === 'post') {
      const newTask = JSON.parse(config.data || '{}');
      const tasks = getLocal('tasks', MOCK_TASKS);
      const createdTask = {
        ...newTask,
        _id: `demo-task-${Date.now()}`,
        status: 'Pending',
        isTest: true,
        createdAt: new Date().toISOString()
      };
      setLocal('tasks', [createdTask, ...tasks]);
      responseData = mockRes(createdTask);
    }
    // 7. Tasks: UPDATE/COMPLETE
    else if (path.includes('/tasks/') && (method === 'put' || method === 'patch')) {
      const taskId = path.split('/').pop();
      const updates = JSON.parse(config.data || '{}');
      const tasks = getLocal('tasks', MOCK_TASKS);
      
      const updatedTasks = tasks.map((t: any) => 
        t._id === taskId ? { ...t, ...updates } : t
      );
      setLocal('tasks', updatedTasks);
      responseData = mockRes(updatedTasks.find((t: any) => t._id === taskId));
    }
    // 8. Hours: LOG
    else if (path.endsWith('/hours') && method === 'post') {
      const newLog = JSON.parse(config.data || '{}');
      const logs = getLocal('hours', []);
      const createdLog = {
        ...newLog,
        _id: `demo-log-${Date.now()}`,
        status: 'Approved', // Auto-approve in demo
        isTest: true,
        date: new Date().toISOString()
      };
      setLocal('hours', [createdLog, ...logs]);
      responseData = mockRes(createdLog);
    }
    // 8.5 Hours: GET ALL
    else if (path.endsWith('/hours') && method === 'get') {
      const logs = getLocal('hours', []);
      responseData = mockRes(logs);
    }
    // 8.7 Leaderboard: GET
    else if (path.endsWith('/users/leaderboard')) {
      const users = getLocal('users', MOCK_USERS);
      // Sort by hoursApproved descending
      const sorted = [...users].sort((a, b) => (b.hoursApproved || 0) - (a.hoursApproved || 0));
      responseData = mockRes(sorted);
    }
    // 9. Users: GET ALL
    else if (path.endsWith('/users') && method === 'get') {
      const users = getLocal('users', MOCK_USERS);
      responseData = mockRes(users);
    }
    // 10. Users: CREATE
    else if (path.endsWith('/users') && method === 'post') {
      const newUser = JSON.parse(config.data || '{}');
      const users = getLocal('users', MOCK_USERS);
      const createdUser = {
        ...newUser,
        _id: `demo-user-${Date.now()}`,
        points: 0,
        hoursApproved: 0,
        tasksCompleted: 0,
        isTest: true,
        createdAt: new Date().toISOString()
      };
      setLocal('users', [createdUser, ...users]);
      responseData = mockRes(createdUser);
    }
    // 11. Users: DELETE
    else if (path.includes('/users/') && method === 'delete') {
      const userId = path.split('/').pop();
      const users = getLocal('users', MOCK_USERS);
      const filtered = users.filter((u: any) => u._id !== userId);
      setLocal('users', filtered);
      responseData = mockRes({ success: true, message: 'User deleted (Simulated)' });
    }
    // Fallback for unhandled demo routes
    else {
      console.warn('⚠️ Unhandled Demo Route:', method, url);
      responseData = mockRes({ 
        success: false, 
        message: `Simulated endpoint not found: ${method} ${path}` 
      }, 404);
    }

    // Throw special error to bypass actual network request
    // This will be caught by the response interceptor
    throw new DemoModeError(responseData);
  }


  
  // If a token exists, add it to the Authorization header as a Bearer token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  // CACHE BUSTING: Add aggressive cache control headers
  config.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
  config.headers['Pragma'] = 'no-cache';
  config.headers['Expires'] = '0';
  
  // Add timestamp to prevent browser caching (for GET requests)
  if (config.method === 'get') {
    config.params = {
      ...config.params,
      _t: Date.now(), // Cache buster timestamp
    };
  }
  
  // Return the modified config
  return config;
});

// 🛡️ DEMO MODE RESPONSE INTERCEPTOR
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If this is our custom DemoModeError, return the mock response as success
    if (error instanceof DemoModeError) {
      return Promise.resolve(error.mockResponse);
    }
    // Otherwise, reject as normal error
    return Promise.reject(error);
  }
);

// Export the configured axios instance for use throughout the app
export default api;

