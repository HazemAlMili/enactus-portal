"use client";

import { useState, useEffect, useMemo } from 'react';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, XCircle, Clock, AlertCircle, Link as LinkIcon, Upload } from 'lucide-react';

export default function TasksPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Create Task State
  const [description, setDescription] = useState('');
  const [resourceLink, setResourceLink] = useState('');
  const [deadline, setDeadline] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Selected Task for Details
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Submission State
  const [submissionLink, setSubmissionLink] = useState('');
  
  useEffect(() => {
    const u = JSON.parse(localStorage.getItem('user') || '{}');
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
      // Backend auto-generates title or uses default
      await api.post('/tasks', { 
        description, 
        resourcesLink: resourceLink,
        deadline: deadline ? new Date(deadline) : undefined
      });
      // Reset form
      setDescription('');
      setResourceLink('');
      setDeadline('');
      // Refresh list
      fetchTasks();
    } catch (err: any) { 
        console.error(err);
        const msg = err.response?.data?.message || 'Failed to deploy mission.';
        alert(`MISSION FAILED: ${msg}`);
    } finally {
        setIsCreating(false);
    }
  };

  const updateStatus = async (id: string, status: string, link?: string) => {
    try {
      await api.put(`/tasks/${id}`, { status, submissionLink: link });
      setIsDialogOpen(false); // Close dialog on success
      setSubmissionLink(''); // Reset submission link
      fetchTasks();
    } catch (error) { console.error(error); }
  };

  const boardRoles = ['General President', 'Vice President', 'Operation Director', 'Creative Director'];
  const canCreate = user && (['Head', 'Vice Head', 'HR'].includes(user.role) || boardRoles.includes(user.role));
  const isHeadView = user && (['Head', 'Vice Head'].includes(user.role) || boardRoles.includes(user.role)); // Board sees head view
  const isMember = user && ['Member', 'HR'].includes(user.role); 
  const isStrictMember = user && user.role === 'Member'; // For gamification/messages only
  
  const getStatusColor = (status: string) => {
      switch(status) {
          case 'Completed': return 'text-green-500 border-green-500 bg-green-500/10';
          case 'Rejected': return 'text-red-500 border-red-500 bg-red-500/10';
          case 'Submitted': return 'text-yellow-500 border-yellow-500 bg-yellow-500/10';
          default: return 'text-gray-400 border-gray-400 bg-gray-400/10';
      }
  };

  // UNIVERSAL SMART GROUPING LOGIC
  // 1. "My Work" (Assigned TO me) is never grouped (I must do it).
  // 2. "Delegated Work" (Assigned to others) is grouped if Status is 'Pending' to avoid clutter.
  // UNIVERSAL SMART GROUPING LOGIC
  // 1. "My Work" (Assigned TO me) is never grouped (I must do it).
  // 2. "Delegated Work" (Assigned to others) is grouped if Status is 'Pending' to avoid clutter.
  const processedTasks = useMemo(() => {
      if (!user) return [];

      const myWork = tasks.filter(t => t.assignedTo?._id === user._id);
      const othersWork = tasks.filter(t => t.assignedTo?._id !== user._id); // Tasks I assigned or Dept tasks

      // Group 'Pending' tasks from others to show a summary
      const othersNonPending = othersWork.filter(t => t.status !== 'Pending');
      const othersPending = othersWork.filter(t => t.status === 'Pending');
      
      const uniqueOthersPending = othersPending.filter((task, index, self) => 
        index === self.findIndex((t) => (
          t.title === task.title && t.description === task.description
        ))
      );
      
      // Sort: My Work first, then Actionable Delegated (Submitted), then Pending Delegated
      return [...myWork, ...othersNonPending, ...uniqueOthersPending];
  }, [tasks, user]);

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
                   <div className="space-y-2 flex-1 w-full">
                     <Label htmlFor="link" className="pixel-font text-xs text-secondary flex items-center gap-2">
                        <LinkIcon className="w-3 h-3" />
                        INTELLIGENCE LINK (OPTIONAL)
                     </Label>
                     <Input 
                       id="link"
                       value={resourceLink}
                       onChange={e => setResourceLink(e.target.value)}
                       placeholder="https://drive.google.com/..."
                       className="bg-black/20 border-secondary/30 focus:border-secondary pixel-corners font-mono text-sm"
                     />
                   </div>

                   <div className="space-y-2 w-full md:w-48">
                     <Label htmlFor="deadline" className="pixel-font text-xs text-red-400 flex items-center gap-2">
                        <Clock className="w-3 h-3" />
                        DEADLINE
                     </Label>
                     <Input 
                       id="deadline"
                       type="date"
                       value={deadline}
                       onChange={e => setDeadline(e.target.value)}
                       className="bg-black/20 border-red-500/30 focus:border-red-500 pixel-corners font-mono text-sm text-white [color-scheme:dark]"
                     />
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
                  <TaskItem key={task._id} task={task} canCreate={canCreate} isHeadView={isHeadView} isStrictMember={isStrictMember} getStatusColor={getStatusColor} user={user} updateStatus={updateStatus} selectedTask={selectedTask} setSelectedTask={setSelectedTask} submissionLink={submissionLink} setSubmissionLink={setSubmissionLink} />
                ))}
              </div>
          </div>
      )}

      {/* SECTION 2: ACTIVE DEPLOYMENTS (Pending/Main Tasks) */}
      <div className="space-y-4">
          <h2 className="text-xl pixel-font text-blue-400 border-b border-blue-400/20 pb-2">ACTIVE DEPLOYMENTS</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeDeployments.map((task) => (
               <TaskItem key={task._id} task={task} canCreate={canCreate} isHeadView={isHeadView} isStrictMember={isStrictMember} getStatusColor={getStatusColor} user={user} updateStatus={updateStatus} selectedTask={selectedTask} setSelectedTask={setSelectedTask} submissionLink={submissionLink} setSubmissionLink={setSubmissionLink} />
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
                  <TaskItem key={task._id} task={task} canCreate={canCreate} isHeadView={isHeadView} isStrictMember={isStrictMember} getStatusColor={getStatusColor} user={user} updateStatus={updateStatus} selectedTask={selectedTask} setSelectedTask={setSelectedTask} submissionLink={submissionLink} setSubmissionLink={setSubmissionLink} />
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
                  <TaskItem key={task._id} task={task} canCreate={canCreate} isHeadView={isHeadView} isStrictMember={isStrictMember} getStatusColor={getStatusColor} user={user} updateStatus={updateStatus} selectedTask={selectedTask} setSelectedTask={setSelectedTask} submissionLink={submissionLink} setSubmissionLink={setSubmissionLink} />
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
const TaskItem = ({ task, canCreate, isHeadView, isStrictMember, getStatusColor, user, updateStatus, selectedTask, setSelectedTask, submissionLink, setSubmissionLink }: any) => {
    const [open, setOpen] = useState(false);
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
                </CardHeader>
                <CardContent className="pl-6 text-sm text-gray-400 font-mono h-[60px] overflow-hidden relative">
                        <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent pointer-events-none" />
                        {task.description}
                </CardContent>
                <CardFooter className="pl-6 pt-2 pb-4 text-[9px] text-primary/60 pixel-font flex justify-between items-center">
                        {task.status === 'Submitted' ? (
                            <span className="truncate max-w-[140px] text-yellow-500 font-bold tracking-widest">FROM: {task.assignedTo?.name}</span>
                        ) : (
                             <span className="truncate max-w-[140px] text-primary/70 font-bold tracking-widest">TO: {task.assignedTo?.name || 'Member'}</span>
                        )}
                        <span className="opacity-0 group-hover:opacity-100 transition-opacity text-accent">OPEN &gt;</span>
                </CardFooter>
            </Card>
            </DialogTrigger>
            <DialogContent className="max-w-2xl bg-card border-2 border-primary pixel-corners text-white">
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
                <div className="grid grid-cols-2 gap-4 text-xs font-mono text-gray-400 bg-primary/10 p-3 pixel-corners">
                        <div>
                        <span className="text-primary block mb-1">ASSIGNED TO:</span>
                        {task.assignedTo?.name} ({task.assignedTo?.email})
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
                    <div className="p-4 bg-background/50 border border-primary/20 pixel-corners text-sm leading-relaxed font-mono">
                        {task.description}
                    </div>
                </div>

                {task.resourcesLink && (
                    <div className="space-y-2">
                        <Label className="pixel-font text-primary text-xs">INTELLIGENCE / RESOURCES</Label>
                        <a href={task.resourcesLink} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 bg-secondary/10 border border-secondary/30 pixel-corners hover:bg-secondary/20 transition-colors group">
                            <LinkIcon className="w-4 h-4 text-secondary" />
                            <span className="text-sm text-secondary truncate underline decoration-secondary/50 group-hover:decoration-secondary">
                                {task.resourcesLink}
                            </span>
                        </a>
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
                                <div className="flex gap-2">
                                    <Input 
                                        placeholder="Paste link..."
                                        className="bg-background pixel-corners font-mono text-xs"
                                        value={submissionLink}
                                        onChange={(e) => setSubmissionLink(e.target.value)}
                                    />
                                    <Button 
                                        onClick={() => updateStatus(task._id, 'Submitted', submissionLink)}
                                        className="bg-accent hover:bg-accent/80 text-white pixel-corners pixel-font"
                                        disabled={!submissionLink}
                                    >
                                        SUBMIT
                                    </Button>
                                </div>
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
                        <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 pixel-corners mb-4">
                            <span className="text-xs text-yellow-500 block mb-1">SUBMITTED WORK:</span>
                            <a href={task.submissionLink} target="_blank" className="text-sm text-blue-400 hover:underline break-all">
                                {task.submissionLink}
                            </a>
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
