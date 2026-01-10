"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, XCircle, Clock, AlertCircle, Link as LinkIcon, Upload } from 'lucide-react';
import { useTaskNotifications } from '@/hooks/useTaskNotifications';
import { useNotification } from '@/components/ui/notification';
import { playClick, playSuccess, playError, playWin } from '@/lib/sounds';

// Force dynamic rendering - disable Next.js caching
export const dynamic = 'force-dynamic';

export default function TasksPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Get notification refresh function
  const { refresh: refreshNotifications } = useTaskNotifications();
  const { showNotification } = useNotification();


  // Create Task State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [resourceLinks, setResourceLinks] = useState<string[]>(['']); // Multiple resource links
  const [deadline, setDeadline] = useState('');
  const [taskHours, setTaskHours] = useState(''); // Hours awarded on completion
  const [team, setTeam] = useState(''); // Selected team for task assignment
  const [isCreating, setIsCreating] = useState(false);

  // Selected Task for Details
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Submission State - Multiple links
  const [submissionLinks, setSubmissionLinks] = useState<string[]>(['']);
  
  useEffect(() => {
    const u = JSON.parse(sessionStorage.getItem('user') || '{}');
    setUser(u);
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    setIsLoading(true);
    try {
      const { data } = await api.get('/tasks');
      setTasks(data);
    } catch (error) { 
      console.error(error); 
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      // Filter out empty links
      const filteredLinks = resourceLinks.filter(link => link.trim() !== '');
      
      const taskData: any = {
        description,
      };
      
      if (title) taskData.title = title;
      if (filteredLinks.length > 0) taskData.resourcesLink = filteredLinks;
      if (deadline) taskData.deadline = new Date(deadline).toISOString();
      if (taskHours) taskData.taskHours = Number(taskHours);
      if (team) taskData.team = team;
      
      await api.post('/tasks', taskData);
      playWin(); // 🏆 Task deployed!
      // Reset form
      setTitle('');
      setDescription('');
      setResourceLinks(['']); // Reset to one empty field
      setDeadline('');
      setTaskHours(''); // Reset hours
      setTeam(''); // Reset team
      // Refresh list
      fetchTasks();
    } catch (err: any) { 
        console.error('Task creation error:', err);
        console.error('Error response:', err.response?.data);
        playError(); // ❌ Error buzz
        const msg = err.response?.data?.message || 'Failed to deploy mission.';
        const errors = err.response?.data?.errors;
        if (errors) {
          console.error('Validation errors:', errors);
          const errorMsg = errors.map((e: any) => `${e.field}: ${e.message}`).join(', ');
          showNotification(`❌ VALIDATION ERROR: ${errorMsg}`, 'error');
        } else {
          showNotification(`❌ MISSION FAILED: ${msg}`, 'error');
        }
    } finally {
        setIsCreating(false);
    }
  };

  // Helper functions for managing resource links
  const addResourceLink = () => {
    setResourceLinks([...resourceLinks, '']);
  };

  const removeResourceLink = (index: number) => {
    if (resourceLinks.length > 1) {
      setResourceLinks(resourceLinks.filter((_, i) => i !== index));
    }
  };

  const updateResourceLink = (index: number, value: string) => {
    const newLinks = [...resourceLinks];
    newLinks[index] = value;
    
    // Auto-remove if emptied (except last field) - INSTANT removal
    if (value.trim() === '' && resourceLinks.length > 1 && index !== resourceLinks.length - 1) {
      // Remove this field immediately
      setResourceLinks(resourceLinks.filter((_, i) => i !== index));
      return; // Don't set the value, just remove
    }
    
    setResourceLinks(newLinks);
    
    // Auto-add new field if last field is filled
    if (index === resourceLinks.length - 1 && value.trim() !== '') {
      setResourceLinks([...newLinks, '']);
    }
  };

  const updateStatus = async (id: string, status: string, links?: string[]) => {
    try {
      // Filter out empty links
      const filteredLinks = links?.filter(link => link.trim() !== '') || [];
      
      await api.put(`/tasks/${id}`, { 
        status, 
        submissionLink: filteredLinks.length > 0 ? filteredLinks : undefined 
      });
      
      // 🔊 Play sound based on status
      if (status === 'Submitted') {
        playClick(); // 📤 Task submitted
      } else if (status === 'Completed') {
        playSuccess(); // ✅ Task approved
      } else if (status === 'Rejected') {
        playError(); // ❌ Task rejected
      }
      
      setIsDialogOpen(false); // Close dialog on success
      setSubmissionLinks(['']); // Reset to one empty field
      fetchTasks();
      
      // Refresh notification badge immediately
      if (status === 'Submitted') {
        console.log('🔔 Task submitted! Refreshing notification badge...');
        await refreshNotifications();
      }
    } catch (error) { console.error(error); }
  };

  // Helper functions for managing submission links
  const addSubmissionLink = () => {
    setSubmissionLinks([...submissionLinks, '']);
  };

  const removeSubmissionLink = (index: number) => {
    if (submissionLinks.length > 1) {
      setSubmissionLinks(submissionLinks.filter((_, i) => i !== index));
    }
  };

  const updateSubmissionLink = (index: number, value: string) => {
    const newLinks = [...submissionLinks];
    newLinks[index] = value;
    
    // Auto-remove if emptied (except last field) - INSTANT removal
    if (value.trim() === '' && submissionLinks.length > 1 && index !== submissionLinks.length - 1) {
      // Remove this field immediately
      setSubmissionLinks(submissionLinks.filter((_, i) => i !== index));
      return; // Don't set the value, just remove
    }
    
    setSubmissionLinks(newLinks);
    
    // Auto-add new field if last field is filled
    if (index === submissionLinks.length - 1 && value.trim() !== '') {
      setSubmissionLinks([...newLinks, '']);
    }
  };

  // No longer needed - removal is instant on onChange
  // Keeping for backward compatibility if needed elsewhere
  const handleSubmissionLinkBlur = (index: number) => {
    // This function is now optional/deprecated
  };

  // ✏️ EDIT TASK
  const handleEditTask = async (taskId: string, updates: any) => {
    try {
      await api.put(`/tasks/${taskId}/edit`, updates);
      playSuccess();
      showNotification('Task updated successfully!', 'success');
      fetchTasks();
    } catch (error) {
      playError();
      showNotification('Failed to update task', 'error');
      console.error(error);
    }
  };

  // 🗑️ DELETE TASK
  const handleDeleteTask = async (taskId: string) => {
    try {
      await api.delete(`/tasks/${taskId}`);
      playSuccess();
      showNotification('Task deleted successfully!', 'success');
      fetchTasks();
    } catch (error) {
      playError();
      showNotification('Failed to delete task', 'error');
      console.error(error);
    }
  };

  const boardRoles = ['General President', 'Vice President']; // Directors NOT included - read-only
  const directorRoles = ['Operation Director', 'Creative Director']; // Directors for view-only logic
  const canCreate = user && (['Head', 'Vice Head', 'HR'].includes(user.role) || boardRoles.includes(user.role));
  const isHeadView = user && (['Head', 'Vice Head'].includes(user.role) || boardRoles.includes(user.role) || directorRoles.includes(user.role)); // Directors see head view but can't create
  const isMember = user && ['Member', 'HR'].includes(user.role); 
  const isStrictMember = user && user.role === 'Member'; // For gamification/messages only
  
  // ⚡ MEMOIZED - Prevents recreation on every render
  const getStatusColor = useCallback((status: string) => {
      switch(status) {
          case 'Completed': return 'text-green-500 border-green-500 bg-green-500/10';
          case 'Rejected': return 'text-red-500 border-red-500 bg-red-500/10';
          case 'Submitted': return 'text-yellow-500 border-yellow-500 bg-yellow-500/10';
          default: return 'text-gray-400 border-gray-400 bg-gray-400/10';
      }
  }, []); // No dependencies - never changes

  // UPDATED LOGIC: 
  // - Members: Show individual tasks assigned to them
  // - Heads: Group tasks by taskGroupId AND status to show separate cards per status
  const processedTasks = useMemo(() => {
      if (!user) return [];

      // For Heads/Directors: Group by taskGroupId AND status
      if (isHeadView) {
        const grouped = new Map();
        
        tasks.forEach(task => {
          // Create unique key combining groupId and status
          // This creates separate cards for different statuses
          const groupId = task.taskGroupId || task._id;
          const groupKey = `${groupId}-${task.status}`; // KEY CHANGE: Group by status too!
          
          if (!grouped.has(groupKey)) {
            // First task in this status group
            grouped.set(groupKey, {
              ...task,
              assignedToList: [task.assignedTo], // Store all assigned members with this status
              individualTasks: [task], // Store all individual tasks with this status
              taskGroupId: groupId, // Keep original group ID
              statusCounts: {
                [task.status]: 1,
                Submitted: task.status === 'Submitted' ? 1 : 0,
                Completed: task.status === 'Completed' ? 1 : 0,
                Rejected: task.status === 'Rejected' ? 1 : 0,
                Pending: task.status === 'Pending' ? 1 : 0
              }
            });
          } else {
            // Add this member to the existing status group
            const existing = grouped.get(groupKey);
            existing.assignedToList.push(task.assignedTo);
            existing.individualTasks.push(task);
            existing.statusCounts[task.status]++;
          }
        });
        
        // Return all groups sorted by status priority
        return Array.from(grouped.values()).sort((a, b) => {
          // Prioritize: Submitted > Pending > Rejected > Completed
          const priority: any = { Submitted: 1, Pending: 2, Rejected: 3, Completed: 4 };
          return priority[a.status] - priority[b.status];
        });
      }

      // For Members: Show individual tasks
      const myWork = tasks.filter(t => t.assignedTo?._id === user._id);
      const othersWork = tasks.filter(t => t.assignedTo?._id !== user._id);

      // NO GROUPING for members - Show each task individually
      // Sort: My Work first, then others by status priority
      return [
          ...myWork,
          ...othersWork.sort((a, b) => {
              // Prioritize: Submitted > Pending > Rejected > Completed
              const priority: any = { Submitted: 1, Pending: 2, Rejected: 3, Completed: 4 };
              return priority[a.status] - priority[b.status];
          })
      ];
  }, [tasks, user, isHeadView]);

  // Helper to check overdue
  const isOverdue = (t: any) => t.deadline && new Date() > new Date(t.deadline) && ['Pending', 'Rejected'].includes(t.status);

  // Split logic for Heads
  const incomingSubmissions = useMemo(() => canCreate ? processedTasks.filter(t => t.status === 'Submitted') : [], [canCreate, processedTasks]);
  
  const expiredMissions = useMemo(() => processedTasks.filter(t => isOverdue(t)), [processedTasks]);

  // Active Deployments:
  // Heads: Pending only (Submitted is Incoming, Done/Rejected is History)
  // Members: Pending, Rejected, Submitted (All active states) - ONLY Completed is History
  // EXCLUDE OVERDUE
  const activeDeployments = useMemo(() => canCreate 
      ? processedTasks.filter(t => t.status === 'Pending' && !isOverdue(t)) 
      : processedTasks.filter(t => t.status !== 'Completed' && !isOverdue(t)), [canCreate, processedTasks]);

  // Mission History:
  // Heads: Completed + Rejected (Active Rejected handled in Active? No, Heads see Rejected in History typically, but let's stick to current: Head history = Completed|Rejected)
  // But if Rejected is Overdue, it goes to Expired?
  // Let's say Expired takes precedence for visual clarity.
  const missionHistory = useMemo(() => canCreate 
      ? processedTasks.filter(t => ['Completed', 'Rejected'].includes(t.status) && !isOverdue(t)) 
      : processedTasks.filter(t => t.status === 'Completed'), [canCreate, processedTasks]);

  return (
    <div className="space-y-8 p-2 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b-2 border-primary/20 pb-4">
        <div>
           <h1 className="text-3xl pixel-font text-white glow-text">
             {canCreate ? 'COMMAND CENTER' : 'MISSION BOARD'}
           </h1>
           <p className="text-gray-400 font-mono text-sm mt-1">
             {canCreate ? 'Assign and review department tasks.' : 'Complete missions to earn XP and Reputation.'}
           </p>
        </div>
      </div>

      {/* HEAD: Create Task Form */}
      {canCreate && (
        <Card className="bg-card border-l-4 border-l-secondary border-y border-r border-primary/20 pixel-corners shadow-lg shadow-primary/5">
          <CardHeader>
             <CardTitle className="pixel-font text-lg text-secondary flex items-center gap-2">
                <Upload className="w-5 h-5" />
                DEPLOY NEW MISSION
             </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateTask} className="space-y-6">
               {/* Row 0: Title */}
               <div className="space-y-2">
                 <Label htmlFor="title" className="pixel-font text-xs text-secondary flex items-center gap-2">
                    <span className="w-2 h-2 bg-secondary inline-block"></span>
                    MISSION TITLE
                 </Label>
                 <Input 
                   id="title"
                   value={title}
                   onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
                   placeholder="Enter mission title..."
                   className="bg-black/20 border-secondary/30 focus:border-secondary pixel-corners text-sm font-mono tracking-wide"
                   required
                 />
               </div>

               {/* Row 1: Description */}
               <div className="space-y-2">
                 <Label htmlFor="desc" className="pixel-font text-xs text-primary flex items-center gap-2">
                    <span className="w-2 h-2 bg-primary inline-block"></span>
                    MISSION BRIEF / DESCRIPTION
                 </Label>
                 <Textarea 
                   id="desc"
                   value={description}
                   onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
                   placeholder="Enter detailed mission objectives, constraints, and requirements..."
                   className="bg-black/20 border-primary/30 focus:border-accent min-h-[100px] pixel-corners text-sm font-mono tracking-wide"
                   required
                 />
               </div>


               {/* Row 2: Resources & Action & Deadline */}
               <div className="flex flex-col md:flex-row gap-4 items-end">
                    {/* Three fields in one row - compact layout */}
                    <div className="flex flex-wrap gap-3 w-full">
                      {/* Intelligence Links - Multiple */}
                       <div className="space-y-2 flex-1 min-w-[200px]">
                         <Label className="pixel-font text-[10px] text-secondary flex items-center gap-1.5">
                            <LinkIcon className="w-2.5 h-2.5" />
                            INTEL LINKS
                         </Label>
                         <div className="space-y-1.5">
                           {resourceLinks.map((link, index) => (
                             <div key={index} className="flex gap-1.5">
                               <Input 
                                 value={link}
                                 onChange={e => updateResourceLink(index, e.target.value)}
                                 placeholder={`Link ${index + 1}: https://drive.google.com/...`}
                                 className="bg-black/20 border-secondary/30 focus:border-secondary pixel-corners font-mono text-xs h-8"
                               />
                               {resourceLinks.length > 1 && (
                                 <Button
                                   type="button"
                                   onClick={() => removeResourceLink(index)}
                                   className="h-8 w-8 p-0 bg-red-500/20 hover:bg-red-500/40 border border-red-500/50 pixel-corners"
                                 >
                                   ✕
                                 </Button>
                               )}
                             </div>
                           ))}
                         </div>
                       </div>

                      {/* Deadline */}
                      <div className="space-y-1.5 w-36">
                        <Label htmlFor="deadline" className="pixel-font text-[10px] text-red-400 flex items-center gap-1.5">
                           <Clock className="w-2.5 h-2.5" />
                           DEADLINE
                        </Label>
                        <Input 
                          id="deadline"
                          type="date"
                          value={deadline}
                          onChange={e => setDeadline(e.target.value)}
                          className="bg-black/20 border-red-500/30 focus:border-red-500 pixel-corners font-mono text-xs text-white [color-scheme:dark] h-9"
                        />
                      </div>
                      
                      {/* Auto Hours */}
                      <div className="space-y-1.5 w-28">
                        <Label htmlFor="taskHours" className="pixel-font text-[10px] text-accent flex items-center gap-1.5">
                           ⏰ HOURS
                        </Label>
                        <Input 
                          id="taskHours"
                          type="number"
                          min="0"
                          step="0.5"
                          value={taskHours}
                          onChange={e => setTaskHours(e.target.value)}
                          placeholder="0"
                          className="bg-black/20 border-accent/30 focus:border-accent pixel-corners font-mono text-xs h-9"
                        />
                      </div>

                      {/* Team Selection - Only for IT, Multi-Media, and Presentation */}
                      {user && (user.department === 'IT' || user.department === 'Multi-Media' || user.department === 'Presentation') && (
                        <div className="space-y-1.5 w-40">
                          <Label htmlFor="team" className="pixel-font text-[10px] text-purple-400 flex items-center gap-1.5">
                             👥 TEAM
                          </Label>
                          <select
                            id="team"
                            value={team}
                            onChange={e => setTeam(e.target.value)}
                            className="w-full bg-black/40 border border-purple-500/30 focus:border-purple-500 hover:border-purple-400 pixel-corners font-mono text-xs h-9 text-white px-2 cursor-pointer transition-colors outline-none [&>option]:bg-card [&>option]:text-white"
                          >
                            <option value="">All Teams</option>
                            {user.department === 'IT' && (
                              <>
                                <option value="Frontend">Frontend</option>
                                <option value="UI/UX">UI/UX</option>
                              </>
                            )}
                            {user.department === 'Multi-Media' && (
                              <>
                                <option value="Graphics">Graphics</option>
                                <option value="Photography">Photography</option>
                              </>
                            )}
                            {user.department === 'Presentation' && (
                              <>
                                <option value="Presentation">Presentation</option>
                                <option value="Script Writing">Script Writing</option>
                              </>
                            )}
                          </select>
                        </div>
                      )}
                    </div>
                   
                   <Button 
                      type="submit" 
                      disabled={isCreating}
                      className="w-full md:w-auto bg-gradient-to-r from-secondary to-yellow-500 text-black hover:scale-[1.02] transition-transform pixel-corners pixel-font font-bold px-8 h-10 shadow-[0_0_15px_rgba(255,204,0,0.3)]"
                   >
                     {isCreating ? (
                        <>
                            <span className="animate-spin mr-2">⟳</span> DEPLOYING...
                        </>
                     ) : (
                        <>
                            DEPLOY MISSION <Upload className="ml-2 w-4 h-4" />
                        </>
                     )}
                   </Button>
               </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* SECTION 1: INCOMING TRANSMISSIONS (Submissions) */}
      {incomingSubmissions.length > 0 && (
          <div className="space-y-4">
              <h2 className="text-xl pixel-font text-yellow-500 flex items-center gap-2 border-b border-yellow-500/30 pb-2">
                  <span className="animate-pulse">●</span> INCOMING TRANSMISSIONS
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {incomingSubmissions.map((task) => (
                  <TaskItem key={task._id} task={task} canCreate={canCreate} isHeadView={isHeadView} isStrictMember={isStrictMember} getStatusColor={getStatusColor} user={user} updateStatus={updateStatus} selectedTask={selectedTask} setSelectedTask={setSelectedTask} submissionLinks={submissionLinks} setSubmissionLinks={setSubmissionLinks} updateSubmissionLink={updateSubmissionLink} removeSubmissionLink={removeSubmissionLink} handleSubmissionLinkBlur={handleSubmissionLinkBlur} handleEditTask={handleEditTask} handleDeleteTask={handleDeleteTask} />
                ))}
              </div>
          </div>
      )}

      {/* SECTION 2: ACTIVE DEPLOYMENTS (Pending/Main Tasks) */}
      <div className="space-y-4">
          <h2 className="text-xl pixel-font text-blue-400 border-b border-blue-400/20 pb-2">ACTIVE DEPLOYMENTS</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeDeployments.map((task) => (
               <TaskItem key={task._id} task={task} canCreate={canCreate} isHeadView={isHeadView} isStrictMember={isStrictMember} getStatusColor={getStatusColor} user={user} updateStatus={updateStatus} selectedTask={selectedTask} setSelectedTask={setSelectedTask} submissionLinks={submissionLinks} setSubmissionLinks={setSubmissionLinks} updateSubmissionLink={updateSubmissionLink} removeSubmissionLink={removeSubmissionLink} handleSubmissionLinkBlur={handleSubmissionLinkBlur} handleEditTask={handleEditTask} handleDeleteTask={handleDeleteTask} />
            ))}
            {activeDeployments.length === 0 && (
                <div className="col-span-full text-center py-10 opacity-30 font-mono text-sm">
                    NO ACTIVE DEPLOYMENTS
                </div>
            )}
          </div>
      </div>

      {/* SECTION 2.5: EXPIRED / FAILED MISSIONS */}
      {expiredMissions.length > 0 && (
          <div className="space-y-4">
              <h2 className="text-xl pixel-font text-red-500 border-b border-red-500/20 pb-2 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 animate-pulse" />
                  FAILED / EXPIRED MISSIONS
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-90">
                {expiredMissions.map((task) => (
                  <TaskItem key={task._id} task={task} canCreate={canCreate} isHeadView={isHeadView} isStrictMember={isStrictMember} getStatusColor={getStatusColor} user={user} updateStatus={updateStatus} selectedTask={selectedTask} setSelectedTask={setSelectedTask} submissionLinks={submissionLinks} setSubmissionLinks={setSubmissionLinks} updateSubmissionLink={updateSubmissionLink} removeSubmissionLink={removeSubmissionLink} handleSubmissionLinkBlur={handleSubmissionLinkBlur} handleEditTask={handleEditTask} handleDeleteTask={handleDeleteTask} />
                ))}
              </div>
          </div>
      )}

       {/* SECTION 3: MISSION HISTORY (Completed/Rejected) */}
       {missionHistory.length > 0 && (
          <div className="space-y-4 pt-8">
              <h2 className="text-xl pixel-font text-white/50 border-b border-white/10 pb-2">MISSION LOGS & HISTORY</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-80 hover:opacity-100 transition-opacity">
                {missionHistory.map((task) => (
                  <TaskItem key={task._id} task={task} canCreate={canCreate} isHeadView={isHeadView} isStrictMember={isStrictMember} getStatusColor={getStatusColor} user={user} updateStatus={updateStatus} selectedTask={selectedTask} setSelectedTask={setSelectedTask} submissionLinks={submissionLinks} setSubmissionLinks={setSubmissionLinks} updateSubmissionLink={updateSubmissionLink} removeSubmissionLink={removeSubmissionLink} handleSubmissionLinkBlur={handleSubmissionLinkBlur} handleEditTask={handleEditTask} handleDeleteTask={handleDeleteTask} />
                ))}
              </div>
          </div>
      )}

      {tasks.length === 0 && !isLoading && (
        <div className="text-center py-20 opacity-50">
            <h3 className="pixel-font text-xl text-primary mb-2">NO ACTIVE MISSIONS</h3>
            <p className="font-mono text-sm">The fleet is awaiting orders...</p>
        </div>
      )}
    </div>
  );
}

// Extracted Component to avoid code duplication errors and maintain structure
const TaskItem = ({ task, canCreate, isHeadView, isStrictMember, getStatusColor, user, updateStatus, selectedTask, setSelectedTask, submissionLinks, setSubmissionLinks, updateSubmissionLink, removeSubmissionLink, handleSubmissionLinkBlur, handleEditTask, handleDeleteTask }: any) => {
    const [open, setOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [editTitle, setEditTitle] = useState('');
    const [editDescription, setEditDescription] = useState('');
    const [editDeadline, setEditDeadline] = useState('');
    const [editHours, setEditHours] = useState('');
    const [editResources, setEditResources] = useState('');
    const isOverdue = task.deadline && new Date() > new Date(task.deadline) && task.status === 'Pending';
    
    return (
        <Dialog open={selectedTask?._id === task._id && open} onOpenChange={(val) => { setOpen(val); if(val) setSelectedTask(task); else setSelectedTask(null); }}>
            <DialogTrigger asChild>
            <Card 
                className={`cursor-pointer group hover:border-accent transition-all duration-300 bg-card pixel-corners overflow-hidden relative
                    ${isOverdue ? 'border-red-500/80 shadow-[0_0_15px_rgba(239,68,68,0.2)]' : 'border-primary/30'}
                `}
                onClick={() => setSelectedTask(task)}
            >
                <div className={`absolute top-0 left-0 w-1 h-full ${
                    task.status === 'Completed' ? 'bg-green-500' : 
                    task.status === 'Rejected' ? 'bg-red-500' :
                    task.status === 'Submitted' ? 'bg-yellow-500' : 
                    isOverdue ? 'bg-red-600 animate-pulse' : 'bg-gray-500'
                }`} />
                
                <CardHeader className="pl-6 pb-2">
                    <div className="flex justify-between items-start">
                        {/* Badges: Members OR Heads(Results only) */}
                        {(isStrictMember || (canCreate && ['Completed', 'Rejected'].includes(task.status))) && (
                            <Badge variant="outline" className={`pixel-font text-[10px] rounded-none py-1 px-2 ${getStatusColor(task.status)}`}>
                                {task.status}
                            </Badge>
                        )}
                        <span className="text-secondary pixel-font text-xs">{task.scoreValue} XP</span>
                    </div>
                    {task.deadline && (
                        <div className={`
                            mt-1 mb-1 px-1.5 py-0.5 border pixel-corners flex items-center gap-1.5 w-fit
                            ${isOverdue 
                                ? 'bg-red-500/20 border-red-500 text-red-400 animate-pulse shadow-[0_0_5px_rgba(239,68,68,0.4)]' 
                                : 'bg-orange-500/10 border-orange-500/50 text-orange-400'
                            }
                        `}>
                            <Clock className="w-2.5 h-2.5" />
                            <span className="text-[9px] font-bold tracking-wide pixel-font">
                                {isOverdue ? "EXPIRED!" : `${new Date(task.deadline).toLocaleDateString()}`}
                            </span>
                        </div>
                    )}
                    <CardTitle className="text-white pixel-font text-sm pt-2 truncate leading-tight">
                        {task.title || 'Department Task'}
                    </CardTitle>
                    
                    {/* Show Submitter Name Prominently for Submitted Tasks */}
                    {task.status === 'Submitted' && (
                        <div className="mt-2 flex items-center gap-2">
                            <div className="px-2 py-1 bg-yellow-500/20 border border-yellow-500/50 pixel-corners flex items-center gap-1.5">
                                <span className="text-yellow-500 pixel-font text-[10px] font-bold tracking-wider">SUBMITTED BY:</span>
                                <span className="text-yellow-300 pixel-font text-[10px] font-bold">
                                  {task.individualTasks 
                                    ? task.individualTasks
                                        .filter((t: any) => t.status === 'Submitted')
                                        .map((t: any) => t.assignedTo?.name)
                                        .join(', ')
                                    : task.assignedTo?.name}
                                </span>
                            </div>
                        </div>
                    )}
                    
                    {/* Show Assignee Name for Pending Tasks */}
                    {task.status === 'Pending' && canCreate && (
                        <div className="mt-2 flex items-center gap-2">
                            <div className="px-2 py-1 bg-blue-500/10 border border-blue-500/30 pixel-corners flex items-center gap-1.5">
                                <span className="text-blue-400 pixel-font text-[10px] font-bold tracking-wider">ASSIGNED TO:</span>
                                <span className="text-blue-300 pixel-font text-[10px] font-bold">
                                  {task.assignedToList && task.assignedToList.length > 1 
                                    ? 'ALL MEMBERS' 
                                    : task.assignedTo?.name}
                                </span>
                            </div>
                        </div>
                    )}
                    
                    {/* Show Submission Progress for Submitted Grouped Tasks */}
                    {task.status === 'Submitted' && canCreate && task.statusCounts && (
                        <div className="mt-2 flex items-center gap-2">
                            <div className="px-2 py-1 bg-yellow-500/10 border border-yellow-500/30 pixel-corners flex items-center gap-1.5">
                                <span className="text-yellow-400 pixel-font text-[10px] font-bold tracking-wider">SUBMISSIONS:</span>
                                <span className="text-yellow-300 pixel-font text-[10px] font-bold">
                                  {task.statusCounts.Submitted} / {task.assignedToList?.length || 1}
                                </span>
                            </div>
                        </div>
                    )}
                    
                    {/* Show Rejected Task in Red */}
                    {task.status === 'Rejected' && canCreate && (
                        <div className="mt-2 flex items-center gap-2">
                            <div className="px-2 py-1 bg-red-500/20 border border-red-500/50 pixel-corners flex items-center gap-1.5">
                                <span className="text-red-500 pixel-font text-[10px] font-bold tracking-wider">REJECTED:</span>
                                <span className="text-red-300 pixel-font text-[10px] font-bold">
                                  {task.individualTasks 
                                    ? task.individualTasks
                                        .filter((t: any) => t.status === 'Rejected')
                                        .map((t: any) => t.assignedTo?.name)
                                        .join(', ')
                                    : task.assignedTo?.name}
                                </span>
                            </div>
                        </div>
                    )}
                    
                    {/* Show Completer Name for Completed Tasks */}
                    {task.status === 'Completed' && canCreate && (
                        <div className="mt-2 flex items-center gap-2">
                            <div className="px-2 py-1 bg-green-500/20 border border-green-500/50 pixel-corners flex items-center gap-1.5">
                                <span className="text-green-500 pixel-font text-[10px] font-bold tracking-wider">COMPLETED BY:</span>
                                <span className="text-green-300 pixel-font text-[10px] font-bold">
                                  {task.individualTasks 
                                    ? task.individualTasks
                                        .filter((t: any) => t.status === 'Completed')
                                        .map((t: any) => t.assignedTo?.name)
                                        .join(', ')
                                    : task.assignedTo?.name}
                                </span>
                            </div>
                        </div>
                    )}
                </CardHeader>
                <CardContent className="pl-6 text-sm text-gray-400 font-mono h-[60px] overflow-hidden relative">
                        <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent pointer-events-none" />
                        {task.description}
                </CardContent>
                <CardFooter className="pl-6 pt-2 pb-4 text-[9px] text-primary/60 pixel-font flex justify-end items- center">
                        <span className="opacity-0 group-hover:opacity-100 transition-opacity text-accent">OPEN &gt;</span>
                </CardFooter>
            </Card>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-2 border-primary pixel-corners text-white">
            <DialogHeader>
                <div className="flex justify-between items-center mb-2">
                    {(isStrictMember || (canCreate && ['Completed', 'Rejected'].includes(task.status))) && (
                        <Badge variant="outline" className={`pixel-font w-fit ${getStatusColor(task.status)}`}>
                            {task.status.toUpperCase()}
                        </Badge>
                    )}
                    <span className="text-secondary pixel-font">{task.scoreValue} XP REWARD</span>
                </div>
                <DialogTitle className="text-2xl pixel-font text-accent mb-2">
                    {task.title || 'Mission Details'}
                </DialogTitle>

                {/* ADMIN CONTROLS: Edit & Delete (Creator Only) */}
                {canCreate && String(task.assignedBy?._id || task.assignedBy) === String(user?._id) && task.status === 'Pending' && !isEditMode && (
                    <div className="flex gap-2 mb-4">
                        <Button
                            onClick={() => {
                                setEditTitle(task.title);
                                setEditDescription(task.description);
                                setEditDeadline(task.deadline ? new Date(task.deadline).toISOString().split('T')[0] : '');
                                setEditHours(task.taskHours?.toString() || '');
                                setEditResources(task.resourcesLink || '');
                                setIsEditMode(true);
                            }}
                            variant="outline"
                            size="sm"
                            className="pixel-corners pixel-font text-xs border-blue-500 text-blue-400 hover:bg-blue-500/10"
                        >
                            ✏️ EDIT
                        </Button>
                        <Button
                            onClick={() => setShowDeleteConfirm(true)}
                            variant="outline"
                            size="sm"
                            className="pixel-corners pixel-font text-xs border-red-500 text-red-400 hover:bg-red-500/10"
                        >
                            🗑️ DELETE
                        </Button>
                    </div>
                )}

                {/* EDIT MODE UI */}
                {isEditMode && (
                    <div className="space-y-4 mb-4 p-4 bg-blue-500/10 border border-blue-500/30 pixel-corners">
                        <div className="flex justify-between items-center mb-2">
                            <span className="pixel-font text-blue-400 text-xs">📝 EDIT MODE</span>
                        </div>
                        
                        {/* Title */}
                        <div className="space-y-2">
                            <Label className="pixel-font text-xs text-blue-400">MISSION TITLE</Label>
                            <Input
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                                className="bg-background pixel-corners font-mono text-sm border-blue-500/50"
                                placeholder="Enter new title..."
                            />
                        </div>

                        {/* Description */}
                        <div className="space-y-2">
                            <Label className="pixel-font text-xs text-blue-400">MISSION DESCRIPTION</Label>
                            <Textarea
                                value={editDescription}
                                onChange={(e) => setEditDescription(e.target.value)}
                                className="bg-background pixel-corners font-mono text-sm border-blue-500/50 min-h-[100px]"
                                placeholder="Enter new description..."
                            />
                        </div>

                        {/* Resources Link */}
                        <div className="space-y-2">
                            <Label className="pixel-font text-xs text-blue-400">INTELLIGENCE / RESOURCES LINK</Label>
                            <Input
                                value={editResources}
                                onChange={(e) => setEditResources(e.target.value)}
                                className="bg-background pixel-corners font-mono text-sm border-blue-500/50"
                                placeholder="https://drive.google.com/..."
                            />
                        </div>

                        {/* Row: Deadline + Hours */}
                        <div className="grid grid-cols-2 gap-4">
                            {/* Deadline */}
                            <div className="space-y-2">
                                <Label className="pixel-font text-xs text-red-400">⏰ DEADLINE</Label>
                                <Input
                                    type="date"
                                    value={editDeadline}
                                    onChange={(e) => setEditDeadline(e.target.value)}
                                    className="bg-background pixel-corners font-mono text-sm border-red-500/50 [color-scheme:dark]"
                                />
                            </div>

                            {/* Task Hours */}
                            <div className="space-y-2">
                                <Label className="pixel-font text-xs text-yellow-400">💎 REWARD HOURS</Label>
                                <Input
                                    type="number"
                                    min="0"
                                    step="0.5"
                                    value={editHours}
                                    onChange={(e) => setEditHours(e.target.value)}
                                    className="bg-background pixel-corners font-mono text-sm border-yellow-500/50"
                                    placeholder="0"
                                />
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2 pt-2">
                            <Button
                                onClick={() => {
                                    if (editTitle.trim() && editDescription.trim()) {
                                        const updates: any = {
                                            title: editTitle,
                                            description: editDescription,
                                            resourcesLink: editResources,
                                        };
                                        if (editDeadline) updates.deadline = editDeadline;
                                        if (editHours) updates.taskHours = parseFloat(editHours);
                                        
                                        handleEditTask(task._id, updates);
                                        setIsEditMode(false);
                                        setOpen(false);
                                    }
                                }}
                                className="pixel-corners pixel-font text-xs bg-green-600 hover:bg-green-500"
                                disabled={!editTitle.trim() || !editDescription.trim()}
                            >
                                ✅ SAVE CHANGES
                            </Button>
                            <Button
                                onClick={() => setIsEditMode(false)}
                                variant="outline"
                                className="pixel-corners pixel-font text-xs border-gray-500 text-gray-400"
                            >
                                ✖️ CANCEL
                            </Button>
                        </div>
                    </div>
                )}

                {/* DELETE CONFIRMATION MODAL */}
                {showDeleteConfirm && (
                    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setShowDeleteConfirm(false)}>
                        <div className="bg-card border-2 border-red-500 pixel-corners p-6 max-w-md w-full shadow-[0_0_30px_rgba(239,68,68,0.5)]" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center gap-3 mb-4">
                                <span className="text-3xl">⚠️</span>
                                <h3 className="pixel-font text-red-500 text-lg">DELETE MISSION?</h3>
                            </div>
                            
                            <div className="space-y-3 mb-6">
                                <p className="font-mono text-sm text-gray-300">
                                    You are about to delete:
                                </p>
                                <div className="p-3 bg-red-500/10 border border-red-500/30 pixel-corners">
                                    <p className="pixel-font text-red-400 text-xs mb-1">MISSION:</p>
                                    <p className="font-mono text-white text-sm">{task.title}</p>
                                </div>
                                <p className="font-mono text-xs text-red-400">
                                    ⚠️ This action cannot be undone.
                                </p>
                            </div>

                            <div className="flex gap-3">
                                <Button
                                    onClick={() => {
                                        handleDeleteTask(task._id);
                                        setShowDeleteConfirm(false);
                                        setOpen(false);
                                    }}
                                    className="flex-1 bg-red-600 hover:bg-red-500 pixel-corners pixel-font text-xs"
                                >
                                    🗑️ CONFIRM DELETE
                                </Button>
                                <Button
                                    onClick={() => setShowDeleteConfirm(false)}
                                    variant="outline"
                                    className="flex-1 pixel-corners pixel-font text-xs border-gray-500"
                                >
                                    ✖️ CANCEL
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-2 gap-4 text-xs font-mono text-gray-400 bg-primary/10 p-3 pixel-corners">
                        <div>
                        <span className="text-primary block mb-1">ASSIGNED TO:</span>
                        {task.assignedToList && task.assignedToList.length > 1 
                          ? `ALL DEPARTMENT MEMBERS (${task.assignedToList.length})` 
                          : `${task.assignedTo?.name} (${task.assignedTo?.email})`}
                        </div>
                        <div>
                        <span className="text-primary block mb-1">ISSUED BY:</span>
                        {task.assignedBy?.name}
                        </div>
                        {task.deadline && (
                            <div className="col-span-2 border-t border-primary/20 pt-2 mt-1">
                                <span className={`block mb-1 ${isOverdue ? 'text-red-500' : 'text-primary'}`}>DEADLINE:</span>
                                <span className={`${isOverdue ? 'text-red-400 font-bold' : ''}`}>
                                    {new Date(task.deadline).toLocaleDateString()}
                                    {isOverdue && " (MISSION TIMEOUT)"}
                                </span>
                            </div>
                        )}
                </div>
            </DialogHeader>

            <div className="space-y-6 py-4">
                <div className="space-y-2">
                    <Label className="pixel-font text-primary text-xs">MISSION BRIEFING</Label>
                    <div className="p-4 bg-background/50 border border-primary/20 pixel-corners text-sm leading-relaxed font-mono max-h-32 overflow-y-auto">
                        {task.description}
                    </div>
                </div>

                {task.resourcesLink && (
                    <div className="space-y-2">
                        <Label className="pixel-font text-primary text-xs">INTELLIGENCE / RESOURCES</Label>
                        <div className="max-h-24 overflow-y-auto">
                          <a href={task.resourcesLink} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 bg-secondary/10 border border-secondary/30 pixel-corners hover:bg-secondary/20 transition-colors group">
                              <LinkIcon className="w-4 h-4 text-secondary" />
                              <span className="text-sm text-secondary truncate underline decoration-secondary/50 group-hover:decoration-secondary">
                                  {task.resourcesLink}
                              </span>
                          </a>
                        </div>
                    </div>
                )}

                {/* Submission Form */}
                {['Pending', 'Rejected'].includes(task.status) && task.assignedTo?._id === user._id && (
                    <>
                        {!isOverdue ? (
                            <div className="space-y-3 pt-4 border-t border-white/10">
                                <Label className="pixel-font text-secondary text-xs text-glow">SUBMIT MISSION WORK</Label>
                                {task.status === 'Rejected' && (
                                    <p className="text-red-400 text-xs font-mono mb-2">
                                        <AlertCircle className="w-3 h-3 inline mr-1" />
                                        Your previous submission was rejected.
                                    </p>
                                )}
                                
                                {/* Dynamic Submission Links */}
                                <div className="space-y-2">
                                    {submissionLinks.map((link: string, index: number) => (
                                        <div key={index} className="flex gap-2">
                                            <Input
                                                placeholder={index === 0 ? "Paste link..." : "Additional link..."}
                                                className="bg-background pixel-corners font-mono text-xs"
                                                value={link}
                                                onChange={(e) => updateSubmissionLink(index, e.target.value)}
                                                onBlur={() => handleSubmissionLinkBlur?.(index)}
                                            />
                                            {submissionLinks.length > 1 && (
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => removeSubmissionLink(index)}
                                                    className="pixel-corners text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                                >
                                                    ×
                                                </Button>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                <Button
                                    onClick={() => updateStatus(task._id, 'Submitted', submissionLinks)}
                                    className="bg-accent hover:bg-accent/80 text-white pixel-corners pixel-font w-full"
                                    disabled={!submissionLinks || !submissionLinks.some((link: string) => link.trim())}
                                >
                                    SUBMIT
                                </Button>
                            </div>
                        ) : (
                            <div className="pt-4 border-t border-red-500/30">
                                <div className="p-3 bg-red-500/10 border border-red-500/50 pixel-corners text-center">
                                    <span className="text-red-500 pixel-font text-xs flex items-center justify-center gap-2">
                                        <AlertCircle className="w-4 h-4" /> MISSION FAILED
                                    </span>
                                    <p className="text-[10px] text-red-400 font-mono mt-1">DEADLINE EXCEEDED - SUBMISSION LOCKED</p>
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* Review Actions */}
                {canCreate && task.status === 'Submitted' && (
                    <div className="space-y-3 pt-4 border-t border-white/10">
                        <Label className="pixel-font text-yellow-500 text-xs text-glow">PENDING APPROVAL</Label>
                        
                        {/* For grouped tasks, show each submitted member's work */}
                        {task.individualTasks ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {task.individualTasks
                            .filter((t: any) => t.status === 'Submitted')
                            .map((individualTask: any) => (
                              <div key={individualTask._id} className="p-3 bg-yellow-500/5 border border-yellow-500/20 pixel-corners">
                                <div className="flex justify-between items-center mb-2">
                                  <span className="text-yellow-400 pixel-font text-xs">{individualTask.assignedTo?.name}</span>
                                </div>
                                <div className="p-2 bg-yellow-500/10 border border-yellow-500/30 pixel-corners mb-2">
                                  <span className="text-xs text-yellow-500 block mb-1">SUBMITTED WORK:</span>
                                  {individualTask.submissionLink && individualTask.submissionLink.length > 0 ? (
                                    <div className="space-y-1">
                                      {individualTask.submissionLink.map((link: string, idx: number) => (
                                        <a key={idx} href={link} target="_blank" className="text-sm text-blue-400 hover:underline break-all block">
                                          {link}
                                        </a>
                                      ))}
                                    </div>
                                  ) : (
                                    <span className="text-xs text-gray-500">No links provided</span>
                                  )}
                                </div>
                                <div className="space-y-2">
                                  <Button 
                                    onClick={() => updateStatus(individualTask._id, 'Completed')}
                                    size="sm"
                                    className="w-full bg-green-600 hover:bg-green-500 pixel-corners pixel-font text-xs"
                                  >
                                    <CheckCircle2 className="w-3 h-3 mr-1" />
                                    APPROVE
                                  </Button>
                                  <Button 
                                    onClick={() => updateStatus(individualTask._id, 'Rejected')}
                                    variant="destructive"
                                    size="sm"
                                    className="w-full pixel-corners pixel-font text-xs"
                                  >
                                    <XCircle className="w-3 h-3 mr-1" />
                                    REJECT
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          // For non-grouped tasks (old tasks or single assignments)
                          <>
                            <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 pixel-corners mb-4">
                              <span className="text-xs text-yellow-500 block mb-1">SUBMITTED WORK:</span>
                              {task.submissionLink && task.submissionLink.length > 0 ? (
                                <div className="space-y-1">
                                  {task.submissionLink.map((link: string, idx: number) => (
                                    <a key={idx} href={link} target="_blank" className="text-sm text-blue-400 hover:underline break-all block">
                                      {link}
                                    </a>
                                  ))}
                                </div>
                              ) : (
                                <a href={task.submissionLink} target="_blank" className="text-sm text-blue-400 hover:underline break-all">
                                  {task.submissionLink}
                                </a>
                              )}
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <Button 
                                onClick={() => updateStatus(task._id, 'Rejected')}
                                variant="destructive"
                                className="pixel-corners pixel-font"
                              >
                                <XCircle className="w-4 h-4 mr-2" />
                                REJECT
                              </Button>
                              <Button 
                                onClick={() => updateStatus(task._id, 'Completed')}
                                className="bg-green-600 hover:bg-green-500 pixel-corners pixel-font"
                              >
                                <CheckCircle2 className="w-4 h-4 mr-2" />
                                APPROVE
                              </Button>
                            </div>
                          </>
                        )}
                    </div>
                )}
                
                {/* Show Completed Work for Heads */}
                {canCreate && task.status === 'Completed' && task.individualTasks && (
                    <div className="space-y-3 pt-4 border-t border-white/10">
                        <Label className="pixel-font text-green-500 text-xs text-glow">COMPLETED WORK</Label>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {task.individualTasks
                            .filter((t: any) => t.status === 'Completed')
                            .map((individualTask: any) => (
                              <div key={individualTask._id} className="p-3 bg-green-500/5 border border-green-500/20 pixel-corners">
                                <div className="flex justify-between items-center mb-2">
                                  <span className="text-green-400 pixel-font text-xs">{individualTask.assignedTo?.name}</span>
                                </div>
                                <div className="p-2 bg-green-500/10 border border-green-500/30 pixel-corners">
                                  <span className="text-xs text-green-500 block mb-1">SUBMITTED WORK:</span>
                                  {individualTask.submissionLink && individualTask.submissionLink.length > 0 ? (
                                    <div className="space-y-1">
                                      {individualTask.submissionLink.map((link: string, idx: number) => (
                                        <a key={idx} href={link} target="_blank" className="text-sm text-blue-400 hover:underline break-all block">
                                          {link}
                                        </a>
                                      ))}
                                    </div>
                                  ) : (
                                    <span className="text-xs text-gray-500">No links provided</span>
                                  )}
                                </div>
                              </div>
                            ))}
                        </div>
                    </div>
                )}

                {isStrictMember && task.status === 'Completed' && (
                        <div className="p-3 bg-green-500/20 border border-green-500 text-center pixel-corners">
                            <span className="text-green-500 pixel-font text-xs flex items-center justify-center gap-2">
                                <CheckCircle2 className="w-4 h-4" /> MISSION COMPLETED
                            </span>
                            <p className="text-[10px] text-green-300 font-mono mt-1">XP AWARDED</p>
                        </div>
                )}
            </div>
            </DialogContent>
        </Dialog>
    );

}
