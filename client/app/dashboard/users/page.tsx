"use client";

// Import hooks and API
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
// Import UI Components from shadcn and lucide icons
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trash2, UserPlus, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useNotification } from '@/components/ui/notification';
import { playWin, playError } from '@/lib/sounds';

// Force dynamic rendering - disable Next.js caching
export const dynamic = 'force-dynamic';

// Define UsersPage Component (Squad Management)
export default function UsersPage() {
  const router = useRouter();
  const { showNotification, showAlert } = useNotification();
  
  const [users, setUsers] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [nameFilter, setNameFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [warningTarget, setWarningTarget] = useState<any>(null);
  const [warningReason, setWarningReason] = useState('');
  
  // State for the new user form data
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'Member',
    department: 'IT',
    team: '', // Team within department
    hrResponsibility: '', // New field for HR Head
    title: '' // New field for Title
  });

  // Function to fetch all users from the backend
  const fetchUsers = async () => {
    try {
      const token = sessionStorage.getItem('token');
      // GET /users
      const { data } = await api.get('/users');
      setUsers(data);
    } catch (error) {
      console.error(error);
    }
  };

  // Fetch users AND current profile on component mount
  useEffect(() => {
    const storedUser = sessionStorage.getItem('user');
    if (storedUser) {
        const u = JSON.parse(storedUser);
        const isHRCoordinator = u.role === 'Member' && u.department === 'HR' && u.title?.startsWith('HR Coordinator');
        const isDirector = u.role === 'Operation Director' || u.role === 'Creative Director';
        const isGuest = u.role === 'guest';
        
        if (!['Head', 'Vice Head', 'HR', 'General President', 'Vice President'].includes(u.role) && !isHRCoordinator && !isDirector && !isGuest) {
            router.push('/dashboard');
            return;
        }
    } else {
        router.push('/');
        return;
    }

    fetchUsers();
    api.get('/auth/me').then(res => {
      setCurrentUser(res.data);
      
      // Set default department filter for Directors
      if (res.data.role === 'Operation Director') {
        setDeptFilter('PR'); // Default to first assigned department
      } else if (res.data.role === 'Creative Director') {
        setDeptFilter('Marketing'); // Default to first assigned department
      }
    }).catch(console.error);
  }, [router]);

  // Effect to reset form and set defaults when Modal opens
  useEffect(() => {
     if (isOpen) {
         // Check HR Roles (Head or Vice Head)
         const isHRHead = (currentUser?.role === 'Head' || currentUser?.role === 'Vice Head') && currentUser?.department === 'HR';
         // Check HR Coordinator
         const isHRCoordinator = currentUser?.role === 'Member' && currentUser?.department === 'HR' && currentUser?.title?.startsWith('HR Coordinator');
         
         let defaultDept = 'IT';
         if (isHRHead) defaultDept = 'HR';
         else if (isHRCoordinator) {
             // Parse department from title "HR Coordinator - [Dept]"
             const coordDept = currentUser?.title?.split(' - ')[1];
             if (coordDept) defaultDept = coordDept;
         } else if (currentUser?.department) {
             // Fallback to user department (e.g. Head of IT -> IT)
             defaultDept = currentUser.department;
         }

         setFormData({
             name: '',
             email: '',
             password: '',
             role: 'Member', 
             department: defaultDept,
             team: '',
             hrResponsibility: '',
             title: ''
         });
     }
  }, [isOpen, currentUser]);

  // Filtered Users
  const filteredUsers = users.filter(u => {
      const matchName = u.name.toLowerCase().includes(nameFilter.toLowerCase());
      const matchDept = deptFilter === 'ALL' || u.department === deptFilter;
      return matchName && matchDept;
  });

  const issueWarning = async () => {
      if (!warningTarget) return;
      try {
          await api.post(`/users/${warningTarget._id}/warning`, { reason: warningReason });
          showNotification(`USER WARNED: ${warningTarget.name}`, 'success');
          setWarningTarget(null);
          setWarningReason('');
      } catch (err: any) {
          console.error(err);
          const msg = err.response?.data?.message || "Failed to issue warning.";
          showNotification(`WARNING ERROR: ${msg}`, 'error');
      }
  };

  // Handler for creating a new user
  const handleCreate = async () => {
    // ⚔️ UNIFIED FRONTEND VALIDATION
    if (formData.name.trim().length < 3) {
      showNotification("NAME MUST BE AT LEAST 3 CHARACTERS", 'error');
      return;
    }
    if (!formData.email.trim().toLowerCase().endsWith('@enactus.com')) {
      showNotification("INVALID DOMAIN: ACCOUNT MUST USE @enactus.com", 'error');
      return;
    }
    if (formData.password.length < 6) {
      showNotification("PASSWORD MUST BE AT LEAST 6 CHARACTERS", 'error');
      return;
    }

    try {
      const token = sessionStorage.getItem('token');
      // POST to /users with form data
      let payload: any = { ...formData };
      
      // LOGIC: If Creating HR Member and Responsibility is set
      if (formData.department === 'HR' && formData.role !== 'Head' && formData.hrResponsibility) {
          // Store the responsibility in the 'title' so we know what they do.
          payload.title = `HR Coordinator - ${formData.hrResponsibility}`;
      }

      // HR Head or Vice Head must assign responsibility when creating HR Members
      if ((currentUser?.role === 'Head' || currentUser?.role === 'Vice Head') && currentUser?.department === 'HR' && formData.department === 'HR' && !formData.hrResponsibility && formData.role !== 'Head') {
         showAlert("YOU MUST ASSIGN A RESPONSIBILITY TO THIS NEW HR MEMBER.", 'warning');
         return;
      }

      await api.post('/users', payload);
      playWin(); // 🏆 Victory fanfare!
      setIsOpen(false);
      fetchUsers();
      showNotification('USER RECRUITED SUCCESSFULLY!', 'success');
    } catch (error: any) {
      console.error(error);
      playError(); // ❌ Error buzz
      const msg = error.response?.data?.message || 'Failed to recruit player.';
      showNotification(`RECRUITMENT ERROR: ${msg}`, 'error');
    }
  };

  // Handler for deleting a user by ID
  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      const token = sessionStorage.getItem('token');
      await api.delete(`/users/${deleteId}`);
      fetchUsers();
      setDeleteId(null);
      showNotification('USER DELETED SUCCESSFULLY', 'success');
    } catch (error: any) {
      console.error(error);
      const msg = error.response?.data?.message || "Delete failed";
      showNotification(`DELETE ERROR: ${msg}`, 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card p-6 border-l-4 border-l-accent pixel-corners">
        <h2 className="text-3xl text-white pixel-font text-glow">SQUAD ROSTER</h2>
        
        {/* Add Member Dialog (Modal) - ONLY HR can recruit */}
        {(() => {
          const isHR = currentUser?.department === 'HR' && 
                      (currentUser?.role === 'Head' || 
                       currentUser?.role === 'Vice Head' || 
                       currentUser?.role === 'HR' ||
                       (currentUser?.role === 'Member' && currentUser?.title?.startsWith('HR Coordinator')));
          
          if (!isHR) return null; // Directors and other roles cannot recruit
          
          return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="w-full md:w-auto bg-secondary text-secondary-foreground hover:bg-yellow-500 pixel-corners pixel-font">
              <UserPlus className="mr-2 h-4 w-4" />
              RECRUIT PLAYER
            </Button>
          </DialogTrigger>
          <DialogContent className="pixel-corners border-2 border-primary bg-card">
            <DialogHeader>
              <DialogTitle className="pixel-font text-primary">NEW PLAYER ENTRY</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
               {/* ... (Existing Form Code) ... */}
               <div className="space-y-2">
                <Label className="pixel-font text-xs">PLAYER NAME</Label>
                <Input className="pixel-corners bg-background/50 border-primary" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label className="pixel-font text-xs">EMAIL</Label>
                <Input className="pixel-corners bg-background/50 border-primary" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label className="pixel-font text-xs">PASSWORD</Label>
                <Input className="pixel-corners bg-background/50 border-primary" type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label className="pixel-font text-xs">CLASS (ROLE)</Label>
                <Select 
                    onValueChange={v => setFormData({...formData, role: v})} 
                    defaultValue={formData.role}
                    // HR HEAD/VICE HEAD LOCKED TO MEMBER
                    // HR COORDINATOR LOCKED TO MEMBER
                    disabled={
                        ((currentUser?.role === 'Head' || currentUser?.role === 'Vice Head') && currentUser?.department === 'HR') ||
                        (currentUser?.role === 'Member' && currentUser?.department === 'HR' && currentUser?.title?.startsWith('HR Coordinator'))
                    }
                >
                  <SelectTrigger className="pixel-corners border-primary bg-background/50"><SelectValue /></SelectTrigger>
                  <SelectContent className="pixel-corners border-primary bg-card">
                    <SelectItem value="Member">Member</SelectItem>
                    {/* Only show other options if NOT HR Head or Vice Head */}
                    {!((currentUser?.role === 'Head' || currentUser?.role === 'Vice Head') && currentUser?.department === 'HR') && (
                        <>
                            <SelectItem value="Vice Head">Vice Head</SelectItem>
                            <SelectItem value="Head">Head</SelectItem>
                            <SelectItem value="HR">HR</SelectItem>
                        </>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="pixel-font text-xs">GUILD (DEPT)</Label>
                <Select 
                    onValueChange={v => setFormData({...formData, department: v})} 
                    // Default Logic handled in useEffect
                    defaultValue={formData.department}
                    // HR HEAD/VICE HEAD LOCKED TO HR
                    // HR COORDINATOR LOCKED TO THEIR DEPT (Set in useEffect)
                    disabled={
                        ((currentUser?.role === 'Head' || currentUser?.role === 'Vice Head') && currentUser?.department === 'HR') ||
                        (currentUser?.role === 'Member' && currentUser?.department === 'HR' && currentUser?.title?.startsWith('HR Coordinator'))
                    }
                >
                  <SelectTrigger className="pixel-corners border-primary bg-background/50"><SelectValue /></SelectTrigger>
                  <SelectContent className="pixel-corners border-primary bg-card">
                    {['IT','HR','PM','PR','FR','Logistics','Organization','Marketing','Multi-Media','Presentation'].map(d => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {((currentUser?.role === 'Head' || currentUser?.role === 'Vice Head') && currentUser?.department === 'HR') && (
                    <p className="text-[10px] text-gray-500 font-mono mt-1">HR HEADS/VICE HEADS RECRUIT FOR HR ONLY</p>
                )}
              </div>

               {/* Team Selection - Only for IT, Multi-Media, and Presentation */}
               {(formData.department === 'IT' || formData.department === 'Multi-Media' || formData.department === 'Presentation') && (
                 <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                   <Label className="pixel-font text-xs text-purple-400">TEAM (OPTIONAL)</Label>
                   <Select onValueChange={v => setFormData({...formData, team: v})} value={formData.team}>
                     <SelectTrigger className="pixel-corners border-purple-500 bg-background/50"><SelectValue placeholder="No Team" /></SelectTrigger>
                     <SelectContent className="pixel-corners border-purple-500 bg-card">
                       {formData.department === 'IT' && (
                         <>
                           <SelectItem value="Frontend">Frontend</SelectItem>
                           <SelectItem value="UI/UX">UI/UX</SelectItem>
                         </>
                       )}
                       {formData.department === 'Multi-Media' && (
                         <>
                           <SelectItem value="Graphics">Graphics</SelectItem>
                           <SelectItem value="Photography">Photography</SelectItem>
                         </>
                       )}
                       {formData.department === 'Presentation' && (
                         <>
                           <SelectItem value="Presentation">Presentation</SelectItem>
                           <SelectItem value="Script Writing">Script Writing</SelectItem>
                         </>
                       )}
                     </SelectContent>
                   </Select>
                   <p className="text-[10px] text-gray-400 font-mono">* Assign member to a specific team within the department.</p>
                 </div>
               )}

               {/* SPECIAL HR HEAD DROPDOWN: Coordinator Responsibility */}
               {/* 
                 Show if:
                 1. Department selected is HR (formData.department === 'HR')
                 2. Role selected is Member (formData.role === 'Member')
                 3. Current User is HR Head or Board (allowed to recruit HR)
               */}
               {formData.department === 'HR' && formData.role === 'Member' && 
                currentUser && ['Head', 'Vice Head', 'General President', 'Vice President'].includes(currentUser.role) && 
                currentUser.department === 'HR' && (
                  <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                    <Label className="pixel-font text-xs text-yellow-400">ASSIGN RESPONSIBILITY (HR COORD)</Label>
                    <Select onValueChange={v => setFormData({...formData, hrResponsibility: v})}>
                      <SelectTrigger className="pixel-corners border-yellow-500 bg-background/50"><SelectValue placeholder="Select Dept to Manage" /></SelectTrigger>
                      <SelectContent className="pixel-corners border-yellow-500 bg-card">
                        {['IT','PM','PR','FR','Logistics','Organization','Marketing','Multi-Media','Presentation'].map(d => (
                          <SelectItem key={d} value={d}>{d}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-[10px] text-gray-400 font-mono">* This will set their recruiting permissions.</p>
                  </div>
               )}
              <Button onClick={handleCreate} className="w-full pixel-corners pixel-font">CONFIRM RECRUIT</Button>
            </div>
          </DialogContent>
        </Dialog>
          );
        })()}

        {/* Delete Confirmation Modal */}
        <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
          <DialogContent className="pixel-corners border-2 border-destructive bg-card max-w-sm text-center">
            <DialogHeader>
              <DialogTitle className="pixel-font text-destructive text-xl animate-pulse">WARNING!</DialogTitle>
            </DialogHeader>
            <div className="py-4 text-white/80 font-mono text-sm">
              <p>DELETE THIS PLAYER?</p>
              <p className="text-xs text-white/50 mt-1">THIS ACTION CANNOT BE UNDONE.</p>
            </div>
            <div className="flex gap-4 justify-center mt-2">
               <Button variant="ghost" onClick={() => setDeleteId(null)} className="pixel-corners text-white/60">CANCEL</Button>
               <Button variant="destructive" onClick={confirmDelete} className="pixel-corners pixel-font">DESTROY</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

       
      {/* FILTERS & TOOLS */}
      <div className="flex flex-col md:flex-row gap-4">
          <Input 
              placeholder="SEARCH BY NAME..." 
              value={nameFilter}
              onChange={e => setNameFilter(e.target.value)}
              className="md:w-64 pixel-corners bg-background/50 border-primary/50"
          />
          {(() => {
            const isDirector = currentUser?.role === 'Operation Director' || currentUser?.role === 'Creative Director';
            const canFilter = currentUser && (['HR', 'General President', 'Vice President'].includes(currentUser.role) || isDirector);
            
            if (!canFilter) return null;
            
            // Filter departments based on role
            let departments = ['IT','HR','PM','PR','FR','Logistics','Organization','Marketing','Multi-Media','Presentation'];
            
            if (currentUser?.role === 'Operation Director') {
              departments = ['PR', 'FR', 'Logistics', 'PM'];
            } else if (currentUser?.role === 'Creative Director') {
              departments = ['Marketing', 'Multi-Media', 'Presentation', 'Organization'];
            }
            
            return (
              <Select onValueChange={setDeptFilter} defaultValue="ALL">
                 <SelectTrigger className="md:w-48 pixel-corners bg-background/50 border-primary/50">
                     <SelectValue placeholder="FILTER DEPT" />
                 </SelectTrigger>
                 <SelectContent className="pixel-corners bg-card border-primary">
                     {/* Only show "ALL DEPTS" for users who can see all departments */}
                     {(currentUser?.role === 'HR' || currentUser?.role === 'General President' || currentUser?.role === 'Vice President') && (
                       <SelectItem value="ALL">ALL DEPTS</SelectItem>
                     )}
                     {departments.map(d => (
                         <SelectItem key={d} value={d}>{d}</SelectItem>
                     ))}
                 </SelectContent>
              </Select>
            );
          })()}
      </div>

      {/* Users List Table */}
      <Card className="bg-card border-2 border-primary pixel-corners">
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-b border-primary/20">
                <TableHead className="text-primary pixel-font text-xs">PLAYER NAME</TableHead>
                <TableHead className="text-primary pixel-font text-xs">CLASS</TableHead>
                {/* Show 'Responsible For' column only for HR Head/Vice Head */}
                {((currentUser?.role === 'Head' || currentUser?.role === 'Vice Head') && currentUser?.department === 'HR') && (
                  <TableHead className="text-primary pixel-font text-xs">RESPONSIBLE FOR</TableHead>
                )}
                <TableHead className="text-primary pixel-font text-xs">GUILD</TableHead>
                <TableHead className="text-primary pixel-font text-xs">HOURS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* Map through users array */}
              {filteredUsers.map((u) => (
                <TableRow key={u._id} className="hover:bg-primary/10 border-b border-primary/10">
                  <TableCell className="text-white font-medium pixel-font text-sm">{u.name}</TableCell>
                  <TableCell className="text-gray-300 font-mono text-xs uppercase">{u.role}</TableCell>
                  {/* Show responsible department for HR Coordinators (HR Head/Vice Head view only) */}
                  {((currentUser?.role === 'Head' || currentUser?.role === 'Vice Head') && currentUser?.department === 'HR') && (
                    <TableCell>
                      {u.title?.startsWith('HR Coordinator') ? (
                        <Badge variant="secondary" className="pixel-corners border-yellow-500 text-yellow-400 bg-yellow-500/10">
                          {u.title.split(' - ')[1] || 'N/A'}
                        </Badge>
                      ) : (
                        <span className="text-gray-500 text-xs">-</span>
                      )}
                    </TableCell>
                  )}
                  <TableCell><Badge variant="outline" className="pixel-corners border-accent text-accent">{u.department}</Badge></TableCell>
                  <TableCell className="text-white pixel-font">{u.hoursApproved || 0} HRS</TableCell>
                  <TableCell className="text-right flex items-center justify-end gap-2">
                    {/* Warning Button - HR department only */}
                    {/* HR Head/Vice Head: Can only warn HR members */}
                    {/* HR Coordinator: Can only warn their assigned dept members */}
                    {(() => {
                      const isHRHead = (currentUser?.role === 'Head' || currentUser?.role === 'Vice Head') && currentUser?.department === 'HR';
                      const isHRCoordinator = currentUser?.role === 'Member' && currentUser?.department === 'HR' && currentUser?.title?.startsWith('HR Coordinator');
                      
                      // HR Head/Vice Head: Show button only for HR members
                      if (isHRHead) {
                        return u.role === 'Member' && u.department === 'HR' && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => setWarningTarget(u)}
                            className="text-yellow-500 hover:text-yellow-400 hover:bg-yellow-500/10 pixel-corners"
                            title="Issue Warning"
                          >
                            <AlertTriangle className="h-4 w-4" />
                          </Button>
                        );
                      }
                      
                      // HR Coordinator: Show button for their assigned dept members
                      if (isHRCoordinator) {
                        const coordDept = currentUser?.title?.split(' - ')[1];
                        return u.role === 'Member' && u.department === coordDept && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => setWarningTarget(u)}
                            className="text-yellow-500 hover:text-yellow-400 hover:bg-yellow-500/10 pixel-corners"
                            title="Issue Warning"
                          >
                            <AlertTriangle className="h-4 w-4" />
                          </Button>
                        );
                      }
                      
                      // General HR role (if any other HR logic needed)
                      if (currentUser?.role === 'HR' && u.role === 'Member') {
                        return (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => setWarningTarget(u)}
                            className="text-yellow-500 hover:text-yellow-400 hover:bg-yellow-500/10 pixel-corners"
                            title="Issue Warning"
                          >
                            <AlertTriangle className="h-4 w-4" />
                          </Button>
                        );
                      }
                      
                      return null;
                    })()}

                    {/* Delete Button */}
                    <Button variant="ghost" size="sm" onClick={() => setDeleteId(u._id)} className="text-destructive hover:text-white hover:bg-destructive pixel-corners">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {/* Warning Dialog */}
      <Dialog open={!!warningTarget} onOpenChange={(open) => !open && setWarningTarget(null)}>
          <DialogContent className="pixel-corners border-2 border-yellow-500 bg-card">
              <DialogHeader>
                  <DialogTitle className="pixel-font text-yellow-500 flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 animate-pulse" />
                      ISSUE WARNING
                  </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                  <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 pixel-corners text-sm text-yellow-200 font-mono">
                      TARGET: <span className="font-bold">{warningTarget?.name}</span> ({warningTarget?.department})
                  </div>
                  <div className="space-y-2">
                      <Label className="pixel-font text-xs">REASON FOR WARNING</Label>
                      <Input 
                        value={warningReason}
                        onChange={e => setWarningReason(e.target.value)}
                        placeholder="e.g. Inactivity, violation of rules..."
                        className="pixel-corners bg-background/50 border-white/20"
                      />
                  </div>
                  <Button onClick={issueWarning} className="w-full bg-yellow-600 hover:bg-yellow-500 text-black pixel-corners pixel-font font-bold">
                      CONFIRM WARNING
                  </Button>
              </div>
          </DialogContent>
      </Dialog>
    </div>
  );
}
