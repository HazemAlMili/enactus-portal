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
  
  // Create Task State (Removed assignedTo and scoreValue)
  const [newTask, setNewTask] = useState({ title: '', description: '', resourcesLink: '' });
  
  // Submission Links State
  const [submissionLinks, setSubmissionLinks] = useState<Record<string, string>>({});

  useEffect(() => {
    const u = JSON.parse(localStorage.getItem('user') || '{}');
    setUser(u);
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const { data } = await api.get('/tasks');
      setTasks(data);
    } catch (error) { console.error(error); }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/tasks', newTask);
      setNewTask({ title: '', description: '', resourcesLink: '' });
      fetchTasks();
    } catch (error) { console.error(error); }
  };

  const updateStatus = async (id: string, status: string, link?: string) => {
    try {
      await api.put(`/tasks/${id}`, { status, submissionLink: link });
      fetchTasks();
    } catch (error) { console.error(error); }
  };

  const isLeader = user && ['Head', 'Vice Head', 'HR', 'General President'].includes(user.role);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-card p-6 border-b-4 border-b-primary pixel-corners">
        <h2 className="text-3xl text-white pixel-font text-glow">QUEST LOG</h2>
      </div>

      {/* Create Task Form (Leaders Only - Bulk Assign to Dept) */}
      {isLeader && (
        <Card className="bg-card border-2 border-accent pixel-corners">
          <CardHeader className="border-b border-accent/20 pb-2">
            <CardTitle className="text-accent pixel-font text-sm">POST NEW GUILD BOUNTY (ALL MEMBERS)</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <form onSubmit={handleCreateTask} className="flex flex-col gap-4">
              <div className="flex flex-col md:flex-row gap-4">
                 <Input 
                   placeholder="QUEST TITLE" 
                   value={newTask.title}
                   onChange={e => setNewTask({...newTask, title: e.target.value})}
                   className="pixel-corners bg-background/50 border-accent font-mono text-sm flex-1"
                   required
                 />
                 <Input 
                   placeholder="ATTACH RESOURCES (LINK)" 
                   value={newTask.resourcesLink}
                   onChange={e => setNewTask({...newTask, resourcesLink: e.target.value})}
                   className="pixel-corners bg-background/50 border-accent font-mono text-sm flex-1"
                 />
              </div>
              <Input 
                 placeholder="MISSION BRIEFING..." 
                 value={newTask.description}
                 onChange={e => setNewTask({...newTask, description: e.target.value})}
                 className="pixel-corners bg-background/50 border-accent font-mono text-sm"
                 required
               />
              <Button type="submit" className="bg-accent text-white pixel-corners pixel-font w-full md:w-auto self-end">
                PUBLISH TO GUILD
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tasks.map((task) => (
          <Card key={task._id} className="bg-card border-2 border-primary pixel-corners hover:scale-[1.01] transition-transform">
            <CardHeader className="border-b border-primary/20 pb-2">
              <div className="flex justify-between items-start gap-2">
                <CardTitle className="text-sm text-accent pixel-font leading-relaxed">{task.title}</CardTitle>
                <div className="bg-yellow-500/20 text-yellow-500 border border-yellow-500 px-2 py-1 text-xs pixel-font pixel-corners whitespace-nowrap">
                  {task.scoreValue} XP
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <p className="text-gray-300 font-mono text-sm border-l-2 border-white/10 pl-2 min-h-[40px]">{task.description}</p>
              
              <div className="flex flex-col gap-2 text-xs font-mono text-gray-500 bg-background/50 p-2 pixel-corners">
                <div className="flex justify-between">
                   <span>HERO:</span>
                   <span className="text-white">{task.assignedTo?.name || 'Unknown'}</span>
                </div>
                <div className="flex justify-between">
                   <span>AUTHOR:</span>
                   <span className="text-white">{task.assignedBy?.name || 'System'}</span>
                </div>
                <div className="flex justify-between">
                   <span>STATUS:</span>
                   <span className={
                     task.status === 'Completed' ? 'text-green-500' : 
                     task.status === 'Submitted' ? 'text-yellow-500' : 'text-primary'
                   }>
                     {task.status.toUpperCase()}
                   </span>
                </div>
                
                {/* HEAD RESOURCES LINK */}
                {task.resourcesLink && (
                  <div className="mt-1 border-t border-white/10 pt-1">
                    <span className="block text-[10px] text-accent">RESOURCES:</span>
                    <a href={task.resourcesLink} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline truncate block">
                      {task.resourcesLink}
                    </a>
                  </div>
                )}
                
                {/* MEMBER SUBMISSION LINK */}
                {task.submissionLink && (
                  <div className="mt-1 border-t border-white/10 pt-1">
                    <span className="block text-[10px] text-gray-400">PROOF:</span>
                    <a href={task.submissionLink} target="_blank" rel="noreferrer" className="text-yellow-400 hover:underline truncate block">
                      {task.submissionLink}
                    </a>
                  </div>
                )}
              </div>
              
              {/* Submission Flow for Members */}
              {user?._id === task.assignedTo?._id && task.status === 'Pending' && (
                <div className="space-y-2 pt-2">
                   <label className="text-[10px] text-primary pixel-font">ATTACH WORK (LINK)</label>
                   <Input 
                      placeholder="PASTE PROOF LINK..." 
                      className="pixel-corners bg-background border-primary h-8 text-xs font-mono"
                      value={submissionLinks[task._id] || ''}
                      onChange={e => setSubmissionLinks({...submissionLinks, [task._id]: e.target.value})}
                   />
                   <Button 
                     onClick={() => updateStatus(task._id, 'Submitted', submissionLinks[task._id])} 
                     className="w-full bg-primary pixel-corners pixel-font text-xs h-8"
                     disabled={!submissionLinks[task._id]}
                   >
                     SUBMIT WORK
                   </Button>
                </div>
              )}
              
              {/* Approval Flow for Heads */}
              {isLeader && task.status === 'Submitted' && (
                <Button onClick={() => updateStatus(task._id, 'Completed')} className="w-full bg-green-600 hover:bg-green-500 pixel-corners pixel-font text-xs h-10 mt-2">
                  VERIFY & GRANT XP
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
        {tasks.length === 0 && <p className="text-gray-500 font-mono text-sm col-span-full text-center">NO ACTIVE QUESTS...</p>}
      </div>
    </div>
  );
}
