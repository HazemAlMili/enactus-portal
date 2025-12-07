"use client";

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

export default function TasksPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const u = JSON.parse(localStorage.getItem('user') || '{}');
    setUser(u);
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const token = localStorage.getItem('token');
      const { data } = await api.get('/tasks');
      setTasks(data);
    } catch (error) {
      console.error(error);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      const token = localStorage.getItem('token');
      await api.put(`/tasks/${id}`, 
        { status }
      );
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
              
              {user?._id === task.assignedTo?._id && task.status === 'Pending' && (
                <Button onClick={() => updateStatus(task._id, 'Submitted')} className="w-full bg-primary hover:bg-primary/80">
                  Mark as Done
                </Button>
              )}
              
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
