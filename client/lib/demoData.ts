
export const MOCK_USER = {
  _id: 'demo-user-id',
  name: 'Visitor Guest',
  email: 'visitor@enactus.com',
  role: 'guest', // Using specialized role for Demo Mode detection
  department: 'IT',
  points: 1250,
  isTest: true,
  createdAt: new Date().toISOString()
};

export const MOCK_STATS = {
  timestamp: new Date().toISOString(),
  storage: {
    currentSizeMB: "124.50",
    indexSizeMB: "4.20",
    totalSizeMB: "128.70",
    limit: 512,
    usagePercentage: "25.14",
    collections: 8,
    objects: 1542
  },
  connections: {
    isConnected: true,
    readyState: 1,
    dbName: "enactus_portal_demo",
    currentConnections: 42, // The answer to everything
    maxPoolSize: 10,
    minPoolSize: 2,
    connectionLimit: 500
  },
  data: {
    users: { total: 156, regular: 140, highBoard: 16, test: 0 },
    tasks: { total: 45, pending: 12, completed: 33, test: 0 },
    hourLogs: { total: 320, pending: 15, test: 0 }
  },
  backup: {
    exists: true,
    lastBackup: {
      date: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
      fileName: "backup-demo.json",
      sizeMB: "12.5",
      age: "1d 0h ago"
    },
    totalBackups: 4,
    totalBackupSizeMB: "45.0"
  },
  health: {
    checks: {
      storage: { status: 'healthy', message: 'Storage usage is within safe limits' },
      connections: { status: 'healthy', message: 'Connection usage is optimal' },
      backup: { status: 'healthy', message: 'Last backup: 1d 0h ago' },
      testData: { status: 'healthy', message: 'No test data in production' }
    },
    overall: 100,
    status: 'healthy'
  }
};

export const MOCK_TASKS = [
  {
    _id: "demo-task-1",
    title: "Review Project Proposals",
    description: "Evaluate the new submissions for the upcoming regional competition.",
    status: "Pending",
    assignedTo: "demo-user-id",
    dueDate: new Date(Date.now() + 86400000 * 2).toISOString(),
    points: 50
  },
  {
    _id: "demo-task-2",
    title: "Update Team Roster",
    description: "Ensure all new members are correctly listed in the system.",
    status: "Completed",
    assignedTo: "demo-user-id",
    dueDate: new Date(Date.now() - 86400000).toISOString(),
    points: 30
  }
];

export const MOCK_USERS = [
  MOCK_USER,
  {
    _id: 'demo-user-2',
    name: 'Demo User',
    email: 'demo@enactus.com',
    role: 'Head',
    department: 'HR',
    points: 850,
    hoursApproved: 45,
    isTest: true
  },
  {
    _id: 'demo-user-3',
    name: 'Hazem Milli',
    email: 'hazem@enactus.com',
    role: 'Head',
    department: 'IT',
    points: 920,
    hoursApproved: 52,
    isTest: true
  },
  {
    _id: 'demo-user-4',
    name: 'Demo User 2',
    email: 'demo@enactus.com',
    role: 'Member',
    department: 'Marketing',
    points: 450,
    hoursApproved: 20,
    isTest: true
  }
];
