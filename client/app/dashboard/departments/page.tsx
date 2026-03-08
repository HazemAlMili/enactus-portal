"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import LoadingSpinner from '@/components/ui/loading-spinner';
import { Users, CheckSquare } from 'lucide-react';
import { useNotification } from '@/components/ui/notification';

// Force dynamic rendering - disable Next.js caching
export const dynamic = 'force-dynamic';

interface User {
  id: string;
  name: string;
  department: string;
  role: string;
  position?: string;
  hoursApproved: number;
}

interface Task {
  id: string;
  title: string;
  description: string;
  status: 'Pending' | 'Submitted' | 'Completed' | 'Rejected';
  department?: string;
  deadline?: string;
  taskHours?: number;
  resourcesLink?: string;
  assignedTo?: { id: string; name: string; email: string };
  assignedBy?: { id: string; name: string };
  assignedToList?: any[];
  taskGroupId?: string;
  individualTasks?: any[];
  statusCounts?: Record<string, number>;
}

export default function DepartmentsPage() {
  const router = useRouter();
  const { showNotification } = useNotification();
  const [users, setUsers] = useState<User[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeTab, setActiveTab] = useState<'members' | 'missions'>('members');
  const [selectedDept, setSelectedDept] = useState<string>('All');
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Edit task state
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [deleteTaskId, setDeleteTaskId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editDeadline, setEditDeadline] = useState('');
  const [editHours, setEditHours] = useState('');
  const [editResources, setEditResources] = useState('');

  useEffect(() => {
    const storedUser = sessionStorage.getItem('user');
    if (storedUser) {
        const u = JSON.parse(storedUser);
        setUser(u);
        
        const isHRCoordinator = u.role === 'Member' && u.department === 'HR' && u.title?.startsWith('HR Coordinator');
        const isTeamLeader = u.department === 'HR' && u.position === 'Team Leader';
        const isDirector = u.role === 'Operation Director' || u.role === 'Creative Director';
        const isGuest = u.role === 'guest';
        
        if (!['Head', 'Vice Head', 'HR', 'General President', 'Vice President'].includes(u.role) && !isHRCoordinator && !isTeamLeader && !isDirector && !isGuest) {
            router.push('/dashboard');
            return;
        }

        // Lock departments for heads/coordinators
        if (['Head', 'Vice Head'].includes(u.role) && u.department) {
            setSelectedDept(u.department);
        } else if (isHRCoordinator) {
            const coordDept = u.title?.split(' - ')[1];
            if (coordDept) setSelectedDept(coordDept);
        } else if (u.role === 'Operation Director') {
            setSelectedDept('PR');
        } else if (u.role === 'Creative Director') {
            setSelectedDept('Marketing');
        }
    } else {
        router.push('/');
        return;
    }
    fetchUsers();
    fetchTasks();
  }, [router]);

  const isTeamLeader = user?.department === 'HR' && user?.role === 'Member' && user?.position === 'Team Leader';
  const isHRCoordinator = user?.role === 'Member' && user?.department === 'HR' && !isTeamLeader;
  const canManage = isHRCoordinator || isTeamLeader;
  const isHead = user && ['Head', 'Vice Head'].includes(user.role);
  const isLocked = isHead || isHRCoordinator;

  const fetchUsers = async () => {
    try {
      const { data } = await api.get('/users');
      setUsers(data);
    } catch (error) {
      console.error("Failed to fetch guild data", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTasks = async () => {
    try {
      // view=responsible: HR Coordinators/TLs see their responsible dept tasks (not HR dept tasks)
      const { data } = await api.get('/tasks?view=responsible');
      setTasks(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch tasks", error);
    }
  };

  const handleEditTask = async (taskId: string, specificTask?: { taskHours: number, applyToAll: boolean }) => {
    if (!specificTask && (!editTitle.trim() || !editDescription.trim())) return;
    try {
      let updates: any = {};
      
      if (specificTask) {
         updates = { taskHours: specificTask.taskHours, applyToAll: specificTask.applyToAll };
      } else {
         updates = { title: editTitle, description: editDescription, resourcesLink: editResources, applyToAll: true };
         if (editDeadline) updates.deadline = editDeadline;
         if (editHours) updates.taskHours = parseFloat(editHours);
      }
      
      await api.put(`/tasks/${taskId}/edit`, updates);
      fetchTasks();
      if (!specificTask) setIsEditOpen(false);
      showNotification('Mission updated successfully!', 'success');
    } catch (error: any) {
      console.error(error);
      showNotification(error.response?.data?.message || 'Failed to edit mission.', 'error');
    }
  };

  const confirmDelete = async () => {
    if (!deleteTaskId) return;
    try {
      await api.delete(`/tasks/${deleteTaskId}`);
      fetchTasks();
      setDeleteTaskId(null);
      showNotification('Task deleted successfully!', 'success');
    } catch (error: any) {
      console.error(error);
      showNotification(error.response?.data?.message || 'Failed to delete task.', 'error');
    }
  };

  const openEdit = (task: Task) => {
    setSelectedTask(task);
    setEditTitle(task.title);
    setEditDescription(task.description);
    setEditDeadline(task.deadline ? new Date(task.deadline).toISOString().split('T')[0] : '');
    setEditHours(task.taskHours?.toString() || '');
    setEditResources(task.resourcesLink || '');
    setIsEditOpen(true);
  };

  // ⚡ MEMOIZED
  const groupedUsers = useMemo(() => {
    return users
      .filter((u: User) => u.role === 'Member')
      .reduce((acc: Record<string, User[]>, u: User) => {
        const dept = u.department || 'Unassigned';
        if (!acc[dept]) acc[dept] = [];
        acc[dept].push(u);
        return acc;
      }, {});
  }, [users]);

  const groupedTasks = useMemo(() => {
    // First, group duplicate tasks by taskGroupId || id
    const grouped = new Map<string, Task>();
    
    tasks.forEach(task => {
        const groupId = task.taskGroupId || task.id;
        if (!grouped.has(groupId)) {
            grouped.set(groupId, {
               ...task,
               assignedToList: task.assignedTo ? [task.assignedTo] : [],
               individualTasks: [task],
               statusCounts: {
                 [task.status]: 1,
                 Submitted: task.status === 'Submitted' ? 1 : 0,
                 Completed: task.status === 'Completed' ? 1 : 0,
                 Rejected: task.status === 'Rejected' ? 1 : 0,
                 Pending: task.status === 'Pending' ? 1 : 0
               }
            });
        } else {
            const existing = grouped.get(groupId)!;
            if (task.assignedTo) existing.assignedToList?.push(task.assignedTo);
            existing.individualTasks?.push(task);
            if (existing.statusCounts) {
              existing.statusCounts[task.status] = (existing.statusCounts[task.status] || 0) + 1;
              const total = existing.individualTasks?.length || 1;
              const subs = existing.statusCounts['Submitted'] || 0;
              const comps = existing.statusCounts['Completed'] || 0;
              const rejs = existing.statusCounts['Rejected'] || 0;

              if (comps === total) existing.status = 'Completed';
              else if (rejs === total) existing.status = 'Rejected';
              else if (subs > 0 || comps > 0) existing.status = 'Submitted';
              else existing.status = 'Pending';
            }
        }
    });

    // Sub-group by department
    return Array.from(grouped.values()).reduce((acc: Record<string, Task[]>, t: Task) => {
      const dept = t.department || 'General';
      if (!acc[dept]) acc[dept] = [];
      acc[dept].push(t);
      return acc;
    }, {});
  }, [tasks]);

  useEffect(() => {
    if (selectedTask) {
        let found = false;
        for (const deptTasks of Object.values(groupedTasks)) {
            const match = deptTasks.find(t => (t.taskGroupId && t.taskGroupId === selectedTask.taskGroupId) || t.id === selectedTask.id);
            if (match) {
                setSelectedTask(match);
                found = true;
                break;
            }
        }
        if (!found) setSelectedTask(null);
    }
  }, [groupedTasks]);

  const displayedUserGroups = selectedDept === 'All'
    ? groupedUsers
    : { [selectedDept]: groupedUsers[selectedDept] || [] };

  const displayedTaskGroups = selectedDept === 'All'
    ? groupedTasks
    : { [selectedDept]: groupedTasks[selectedDept] || [] };

  let allDepartments = ['IT','HR','PM','PR','FR','Logistics','Organization','Marketing','Multi-Media','Presentation'];
  if (user?.role === 'Operation Director') {
    allDepartments = ['PR', 'FR', 'Logistics', 'PM'];
  } else if (user?.role === 'Creative Director') {
    allDepartments = ['Marketing', 'Multi-Media', 'Presentation', 'Organization'];
  } else if (user?.department === 'HR' && user?.position === 'Team Leader' && user?.responsibleDepartments) {
    allDepartments = user.responsibleDepartments;
  }

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'Pending': return 'border-yellow-500/50 text-yellow-400 bg-yellow-500/5';
      case 'Submitted': return 'border-blue-500/50 text-blue-400 bg-blue-500/5';
      case 'Completed': return 'border-green-500/50 text-green-400 bg-green-500/5';
      case 'Rejected': return 'border-red-500/50 text-red-400 bg-red-500/5';
      default: return 'border-gray-500/50 text-gray-400';
    }
  }, []);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-8 w-full max-w-full overflow-hidden">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card p-6 border-b-4 border-b-primary pixel-corners">
        <div className="min-w-0">
          <h2 className="text-2xl md:text-3xl text-white pixel-font text-glow truncate">GUILD HALL</h2>
          <p className="text-gray-400 font-mono text-xs mt-2">VIEW ACTIVE AGENTS AND DEPARTMENT MISSIONS</p>
        </div>
        
        {/* Department Filter */}
        {!isLocked && (
          <div className="w-full md:w-48 shrink-0">
            <Select value={selectedDept} onValueChange={setSelectedDept}>
              <SelectTrigger className="pixel-corners border-secondary bg-background/50 text-xs pixel-font h-10 w-full">
                <SelectValue placeholder="FILTER GUILD" />
              </SelectTrigger>
              <SelectContent className="pixel-corners bg-card border-secondary">
                {(user?.role === 'HR' || user?.role === 'General President' || user?.role === 'Vice President' || isTeamLeader) && (
                  <SelectItem value="All">ALL GUILDS</SelectItem>
                )}
                {allDepartments.map(dept => {
                  const shortName = ({
                    'Organization': 'ORG', 'Marketing': 'MKT',
                    'Multi-Media': 'MM', 'Presentation': 'PRES', 'Logistics': 'LOG'
                  } as Record<string, string>)[dept] || dept;
                  return <SelectItem key={dept} value={dept}>{shortName} GUILD</SelectItem>;
                })}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-2 px-1">
        <Button
          onClick={() => setActiveTab('members')}
          variant={activeTab === 'members' ? 'default' : 'outline'}
          className={`pixel-corners pixel-font text-xs gap-2 ${activeTab === 'members' ? 'bg-primary text-background' : 'border-primary/50 text-gray-400 hover:text-white'}`}
        >
          <Users className="h-4 w-4" />
          AGENTS
        </Button>
        {!isHead && (
          <Button
            onClick={() => setActiveTab('missions')}
            variant={activeTab === 'missions' ? 'default' : 'outline'}
            className={`pixel-corners pixel-font text-xs gap-2 ${activeTab === 'missions' ? 'bg-accent text-background' : 'border-accent/50 text-gray-400 hover:text-white'}`}
          >
            <CheckSquare className="h-4 w-4" />
            MISSIONS
            {tasks.length > 0 && (
              <span className="bg-accent/30 text-accent px-1.5 py-0.5 rounded text-[10px] font-bold ml-1">
                {tasks.length}
              </span>
            )}
          </Button>
        )}
      </div>

      {/* ═══════════ AGENTS TAB ═══════════ */}
      {activeTab === 'members' && (
        <div className="space-y-8 pb-8">
          {Object.keys(groupedUsers).length === 0 && (
            <p className="text-white font-mono text-center opacity-50">NO GUILD DATA ACCESSIBLE...</p>
          )}
          {Object.entries(displayedUserGroups).map(([dept, members]) => {
            if (!members) return null;
            return (
              <div key={dept} className="space-y-4">
                <div className="flex flex-wrap items-center gap-4">
                  <Badge className="bg-accent text-white pixel-font pixel-corners text-lg px-4 py-1 whitespace-nowrap">{dept} GUILD</Badge>
                  <div className="h-1 bg-white/20 flex-1 pixel-corners min-w-[50px]"></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {members.map(member => (
                    <Card key={member.id} className="bg-card border-2 border-white/10 pixel-corners hover:border-primary transition-colors min-w-0">
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-sm font-bold text-white pixel-font truncate pr-2 w-full">{member.name}</CardTitle>
                          <div className="flex flex-col items-end gap-1 shrink-0">
                            <span className="text-[10px] bg-white/10 px-1 py-0.5 rounded text-gray-300 font-mono">{member.role}</span>
                            {member.department === 'HR' && (
                              member.position === 'Team Leader' ? (
                                <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/50 pixel-corners font-mono text-[8px] h-4 py-0 uppercase">TL</Badge>
                              ) : (
                                <Badge variant="outline" className="border-blue-500/50 text-blue-400 pixel-corners font-mono text-[8px] h-4 py-0 uppercase bg-blue-500/5">MB</Badge>
                              )
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex justify-between items-end border-t border-white/5 pt-2 mt-1">
                          <span className="text-xs text-secondary font-mono">HOURS:</span>
                          <span className="text-xl text-primary pixel-font">{member.hoursApproved || 0}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ═══════════ MISSIONS TAB ═══════════ */}
      {!isHead && activeTab === 'missions' && (
        <div className="space-y-6 pb-8">
          {tasks.length === 0 && (
            <p className="text-white font-mono text-center opacity-50">NO MISSIONS FOUND FOR YOUR DEPARTMENTS...</p>
          )}
          {Object.entries(displayedTaskGroups).map(([dept, deptTasks]) => {
            if (!deptTasks || deptTasks.length === 0) return null;
            return (
              <div key={dept} className="space-y-4">
                {/* Dept Header */}
                <div className="flex flex-wrap items-center gap-4">
                  <Badge className="bg-primary/20 text-primary border border-primary/50 pixel-font pixel-corners text-lg px-4 py-1 whitespace-nowrap">
                    {dept} MISSIONS
                  </Badge>
                  <div className="h-1 bg-primary/20 flex-1 pixel-corners min-w-[50px]"></div>
                  <span className="text-xs font-mono text-gray-500">{deptTasks.length} MISSION{deptTasks.length !== 1 ? 'S' : ''}</span>
                </div>

                {/* Task Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {deptTasks.map(task => {
                    const isOverdue = task.deadline && new Date(task.deadline) < new Date() && task.status !== 'Completed';
                    return (
                      <Card key={task.id} className={`bg-card border-2 pixel-corners min-w-0 transition-colors ${
                        isOverdue ? 'border-red-500/40' : 'border-white/10 hover:border-primary/50'
                      }`}>
                        <CardHeader className="pb-2 space-y-2">
                          <div className="flex justify-between items-start gap-2">
                            <CardTitle className="text-sm text-white pixel-font leading-tight flex-1">{task.title}</CardTitle>
                            <Badge variant="outline" className={`pixel-corners font-mono text-[10px] shrink-0 px-1.5 py-0.5 ${getStatusColor(task.status)}`}>
                              {task.status.toUpperCase()}
                            </Badge>
                          </div>

                          <p className="text-xs font-mono text-gray-400 line-clamp-2">{task.description}</p>

                          <div className="flex flex-wrap gap-2 text-[10px] font-mono text-gray-500">
                            {task.taskHours && user?.role !== 'Member' && (
                              <span className="text-yellow-400">💎 {task.taskHours}h</span>
                            )}
                            {task.deadline && (
                              <span className={isOverdue ? 'text-red-400' : 'text-gray-500'}>
                                ⏰ {new Date(task.deadline).toLocaleDateString()}
                                {isOverdue && ' (OVERDUE)'}
                              </span>
                            )}
                          </div>

                          <div className="flex flex-col gap-1 mt-2 border-t border-white/5 pt-2">
                            {/* Pending State */}
                            {task.status === 'Pending' && (
                              <div className="flex items-center gap-1.5 px-2 py-1 bg-blue-500/10 border border-blue-500/30 pixel-corners">
                                <span className="text-blue-400 font-bold tracking-wider text-[10px] uppercase">Assigned To:</span>
                                <span className="text-blue-300 font-bold text-[10px] break-all leading-snug">
                                  {task.assignedToList && task.assignedToList.length > 1
                                    ? `ALL DEPT MEMBERS (${task.assignedToList.length})`
                                    : task.assignedTo?.name || '—'}
                                </span>
                              </div>
                            )}

                            {/* Submitted State */}
                            {task.status === 'Submitted' && task.statusCounts && (
                              <div className="flex items-center gap-1.5 px-2 py-1 bg-yellow-500/10 border border-yellow-500/30 pixel-corners">
                                <span className="text-yellow-400 font-bold tracking-wider text-[10px] uppercase">Submissions:</span>
                                <span className="text-yellow-300 font-bold text-[10px] break-all leading-snug">
                                  {task.statusCounts.Submitted} / {task.assignedToList?.length || 1}
                                  {task.individualTasks && ` (${task.individualTasks.filter(t => t.status === 'Submitted').map(t => t.assignedTo?.name).join(', ')})`}
                                </span>
                              </div>
                            )}

                            {/* Rejected State */}
                            {task.status === 'Rejected' && (
                              <div className="flex items-center gap-1.5 px-2 py-1 bg-red-500/20 border border-red-500/50 pixel-corners">
                                <span className="text-red-500 font-bold tracking-wider text-[10px] uppercase">Rejected:</span>
                                <span className="text-red-200 font-bold text-[10px] break-all leading-snug">
                                  {task.individualTasks 
                                    ? task.individualTasks.filter(t => t.status === 'Rejected').map(t => t.assignedTo?.name).join(', ')
                                    : task.assignedTo?.name || '—'}
                                </span>
                              </div>
                            )}

                            {/* Completed State */}
                            {task.status === 'Completed' && (
                              <div className="flex items-center gap-1.5 px-2 py-1 bg-green-500/20 border border-green-500/50 pixel-corners">
                                <span className="text-green-500 font-bold tracking-wider text-[10px] uppercase">Completed By:</span>
                                <span className="text-green-200 font-bold text-[10px] break-all leading-snug">
                                  {task.individualTasks
                                    ? task.individualTasks.filter(t => t.status === 'Completed').map(t => t.assignedTo?.name).join(', ')
                                    : task.assignedTo?.name || '—'}
                                </span>
                              </div>
                            )}

                            <div className="text-[10px] font-mono text-gray-500 mt-1">
                              <span className="text-primary">ISSUED BY: </span>
                              {task.assignedBy?.name || '—'}
                            </div>
                          </div>
                        </CardHeader>

                        {/* Edit / Delete — only for canManage users */}
                        {canManage && (
                          <CardContent className="pt-0">
                            <div className="flex gap-2 border-t border-white/5 pt-3">
                              <Button
                                onClick={() => openEdit(task)}
                                variant="outline"
                                size="sm"
                                className="flex-1 pixel-corners pixel-font text-xs border-blue-500/50 text-blue-400 hover:bg-blue-500/10"
                              >
                                ✏️ EDIT
                              </Button>
                              <Button
                                onClick={() => setDeleteTaskId(task.id)}
                                variant="outline"
                                size="sm"
                                className="flex-1 pixel-corners pixel-font text-xs border-red-500/50 text-red-400 hover:bg-red-500/10"
                              >
                                🗑️ DELETE
                              </Button>
                            </div>
                          </CardContent>
                        )}
                      </Card>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ═══════════ EDIT TASK MODAL ═══════════ */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="bg-card border-2 border-blue-500 pixel-corners max-w-lg shadow-[0_0_30px_rgba(59,130,246,0.3)]">
          <DialogHeader>
            <DialogTitle className="pixel-font text-blue-400 text-sm">📝 EDIT MISSION</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="pixel-font text-xs text-blue-400">MISSION TITLE</Label>
              <Input
                value={editTitle}
                onChange={e => setEditTitle(e.target.value)}
                className="bg-background pixel-corners font-mono text-sm border-blue-500/50"
                placeholder="Enter new title..."
              />
            </div>
            <div className="space-y-2">
              <Label className="pixel-font text-xs text-blue-400">MISSION DESCRIPTION</Label>
              <Textarea
                value={editDescription}
                onChange={e => setEditDescription(e.target.value)}
                className="bg-background pixel-corners font-mono text-sm border-blue-500/50 min-h-[100px]"
                placeholder="Enter new description..."
              />
            </div>
            <div className="space-y-2">
              <Label className="pixel-font text-xs text-blue-400">INTELLIGENCE / RESOURCES LINK</Label>
              <Input
                value={editResources}
                onChange={e => setEditResources(e.target.value)}
                className="bg-background pixel-corners font-mono text-sm border-blue-500/50"
                placeholder="https://drive.google.com/..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="pixel-font text-xs text-red-400">⏰ DEADLINE</Label>
                <Input
                  type="date"
                  value={editDeadline}
                  onChange={e => setEditDeadline(e.target.value)}
                  className="bg-background pixel-corners font-mono text-sm border-red-500/50 [color-scheme:dark]"
                />
              </div>
              <div className="space-y-2">
                <Label className="pixel-font text-xs text-yellow-400">💎 REWARD HOURS</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.5"
                  value={editHours}
                  onChange={e => setEditHours(e.target.value)}
                  className="bg-background pixel-corners font-mono text-sm border-yellow-500/50"
                  placeholder="0"
                />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                onClick={() => selectedTask && handleEditTask(selectedTask.id)}
                disabled={!editTitle.trim() || !editDescription.trim()}
                className="pixel-corners pixel-font text-xs bg-green-600 hover:bg-green-500 disabled:opacity-50"
              >
                ✅ SAVE CHANGES
              </Button>
              <Button
                onClick={() => setIsEditOpen(false)}
                variant="outline"
                className="pixel-corners pixel-font text-xs border-gray-500 text-gray-400"
              >
                ✖️ CANCEL
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ═══════════ DELETE CONFIRMATION MODAL ═══════════ */}
      {deleteTaskId && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4" onClick={() => setDeleteTaskId(null)}>
          <div className="bg-card border-2 border-red-500 pixel-corners p-6 max-w-md w-full shadow-[0_0_30px_rgba(239,68,68,0.5)]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">⚠️</span>
              <h3 className="pixel-font text-red-500 text-lg">DELETE MISSION?</h3>
            </div>
            
            <div className="space-y-3 mb-6">
              <p className="font-mono text-sm text-gray-300">
                Are you sure you want to delete this mission?
              </p>
              <p className="font-mono text-xs text-red-400">
                ⚠️ This action cannot be undone.
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={confirmDelete}
                className="flex-1 bg-red-600 hover:bg-red-500 pixel-corners pixel-font text-xs"
              >
                🗑️ CONFIRM DELETE
              </Button>
              <Button
                onClick={() => setDeleteTaskId(null)}
                variant="outline"
                className="flex-1 pixel-corners pixel-font text-xs border-gray-500"
              >
                ✖️ CANCEL
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
