"use client";

// Import React hooks and API utility
import { useState, useEffect } from 'react';
import api from '@/lib/api';
// Import UI components
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

// Define TasksPage Component
export default function TasksPage() {
  // State for storing the list of tasks
  const [tasks, setTasks] = useState<any[]>([]);
  // State for storing the current user info
  const [user, setUser] = useState<any>(null);

  // Effect to load user from local storage and fetch tasks on mount
  useEffect(() => {
    const u = JSON.parse(localStorage.getItem('user') || '{}');
    setUser(u);
    fetchTasks();
  }, []);

  // Function to fetch tasks from the backend
  const fetchTasks = async () => {
    try {
      const token = localStorage.getItem('token');
      // GET request to /tasks endpoint
      const { data } = await api.get('/tasks');
      setTasks(data);
    } catch (error) {
      console.error(error);
    }
  };

  /**
   * Function to update the status of a task.
   * used for members to 'Submit' and Heads to 'Complete' (Approve) tasks.
   * @param id - The ID of the task to update
   * @param status - The new status ('Submitted' or 'Completed')
   */
  const updateStatus = async (id: string, status: string) => {
    try {
      const token = localStorage.getItem('token');
      // PUT request to update task status
      await api.put(`/tasks/${id}`, 
        { status }
      );
      // Refresh the task list
      fetchTasks();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-white">Task Board</h2>
        {/* Ability to Add Task would go here for Leaders */}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Map through tasks and display each in a Card */}
        {tasks.map((task) => (
          <Card key={task._id} className="bg-card border-l-4 border-l-accent border-y-primary/20 border-r-primary/20">
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-xl text-white">{task.title}</CardTitle>
                <Badge>{task.scoreValue} XP</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-400">{task.description}</p>
              <div className="flex justify-between text-sm text-gray-500">
                <span>To: {task.assignedTo?.name}</span>
                <span>Status: <span className="text-secondary">{task.status}</span></span>
              </div>
              
              {/* Button for Assignee to mark task as Done (Submitted) */}
              {user?._id === task.assignedTo?._id && task.status === 'Pending' && (
                <Button onClick={() => updateStatus(task._id, 'Submitted')} className="w-full bg-primary hover:bg-primary/80">
                  Mark as Done
                </Button>
              )}
              
              {/* Button for Head/HR to Approve Completion */}
              {(user?.role === 'Head' || user?.role === 'HR') && task.status === 'Submitted' && (
                <Button onClick={() => updateStatus(task._id, 'Completed')} className="w-full bg-green-600 hover:bg-green-700">
                  Approve Completion
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
