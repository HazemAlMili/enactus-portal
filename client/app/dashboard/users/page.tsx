"use client";

// Import hooks and API
import { useState, useEffect } from 'react';
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

// Define UsersPage Component (Squad Management)
export default function UsersPage() {
  // State for the list of users
  const [users, setUsers] = useState<any[]>([]);
  // State for controlling the 'Add Member' modal visibility
  const [isOpen, setIsOpen] = useState(false);
  // State for Delete Confirmation Modal
  const [deleteId, setDeleteId] = useState<string | null>(null);
  

  // State for Filtration and Warnings (HR Feature)
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [nameFilter, setNameFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [warningTarget, setWarningTarget] = useState<any>(null); // User to warn
  const [warningReason, setWarningReason] = useState('');
  
  // State for the new user form data
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'Member',
    department: 'IT'
  });

  // Function to fetch all users from the backend
  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      // GET /users
      const { data } = await api.get('/users');
      setUsers(data);
    } catch (error) {
      console.error(error);
    }
  };

  // Fetch users AND current profile on component mount
  useEffect(() => {
    fetchUsers();
    api.get('/auth/me').then(res => setCurrentUser(res.data)).catch(console.error);
  }, []);

  // Filtered Users
  const filteredUsers = users.filter(u => {
      const matchName = u.name.toLowerCase().includes(nameFilter.toLowerCase());
      const matchDept = deptFilter === 'ALL' || u.department === deptFilter;
      return matchName && matchDept;
  });

  // Warning Handler
  const issueWarning = async () => {
      if (!warningTarget) return;
      try {
          await api.post(`/users/${warningTarget._id}/warning`, { reason: warningReason });
          alert(`USER WARNED: ${warningTarget.name}`);
          setWarningTarget(null);
          setWarningReason('');
      } catch (err: any) {
          console.error(err);
          alert(err.response?.data?.message || "Failed to issue warning.");
      }
  };

  // Handler for creating a new user
  const handleCreate = async () => {
    try {
      const token = localStorage.getItem('token');
      // POST to /users with form data
      await api.post('/users', formData);
      // Close modal and refresh list
      setIsOpen(false);
      fetchUsers();
    } catch (error: any) {
      console.error(error);
      const msg = error.response?.data?.message || 'Failed to recruit player.';
      alert(`RECRUITMENT ERROR: ${msg}`);
    }
  };

  // Handler for deleting a user by ID
  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      const token = localStorage.getItem('token');
      // DELETE request
      await api.delete(`/users/${deleteId}`);
      fetchUsers();
      setDeleteId(null); // Close modal
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card p-6 border-l-4 border-l-accent pixel-corners">
        <h2 className="text-3xl text-white pixel-font text-glow">SQUAD ROSTER</h2>
        
        {/* Add Member Dialog (Modal) */}
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
                <Select onValueChange={v => setFormData({...formData, role: v})} defaultValue={formData.role}>
                  <SelectTrigger className="pixel-corners border-primary bg-background/50"><SelectValue /></SelectTrigger>
                  <SelectContent className="pixel-corners border-primary bg-card">
                    <SelectItem value="Member">Member</SelectItem>
                    <SelectItem value="Vice Head">Vice Head</SelectItem>
                    <SelectItem value="Head">Head</SelectItem>
                    <SelectItem value="HR">HR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="pixel-font text-xs">GUILD (DEPT)</Label>
                <Select onValueChange={v => setFormData({...formData, department: v})} defaultValue={formData.department}>
                  <SelectTrigger className="pixel-corners border-primary bg-background/50"><SelectValue /></SelectTrigger>
                  <SelectContent className="pixel-corners border-primary bg-card">
                    {['IT','HR','PM','PR','FR','Logistics','Organization','Marketing','Multi-Media','Presentation'].map(d => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleCreate} className="w-full pixel-corners pixel-font">CONFIRM RECRUIT</Button>
            </div>
          </DialogContent>
        </Dialog>

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
          {currentUser && ['HR', 'General President', 'Vice President'].includes(currentUser.role) && (
              <Select onValueChange={setDeptFilter} defaultValue="ALL">
                 <SelectTrigger className="md:w-48 pixel-corners bg-background/50 border-primary/50">
                     <SelectValue placeholder="FILTER DEPT" />
                 </SelectTrigger>
                 <SelectContent className="pixel-corners bg-card border-primary">
                     <SelectItem value="ALL">ALL DEPTS</SelectItem>
                     {['IT','HR','PM','PR','FR','Logistics','Organization','Marketing','Multi-Media','Presentation'].map(d => (
                         <SelectItem key={d} value={d}>{d}</SelectItem>
                     ))}
                 </SelectContent>
              </Select>
          )}
      </div>

      {/* Users List Table */}
      <Card className="bg-card border-2 border-primary pixel-corners">
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-b border-primary/20">
                <TableHead className="text-primary pixel-font text-xs">PLAYER NAME</TableHead>
                <TableHead className="text-primary pixel-font text-xs">CLASS</TableHead>
                <TableHead className="text-primary pixel-font text-xs">GUILD</TableHead>
                <TableHead className="text-primary pixel-font text-xs">XP</TableHead>
                <TableHead className="text-gray-400"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* Map through users array */}
              {filteredUsers.map((u) => (
                <TableRow key={u._id} className="hover:bg-primary/10 border-b border-primary/10">
                  <TableCell className="text-white font-medium pixel-font text-sm">{u.name}</TableCell>
                  <TableCell className="text-gray-300 font-mono text-xs uppercase">{u.role}</TableCell>
                  <TableCell><Badge variant="outline" className="pixel-corners border-accent text-accent">{u.department}</Badge></TableCell>
                  <TableCell className="text-secondary pixel-font">{u.points} XP</TableCell>
                  <TableCell className="text-right flex items-center justify-end gap-2">
                    {/* Warning Button (HR Only, Members Only) */}
                    {currentUser?.role === 'HR' && u.role === 'Member' && (
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => setWarningTarget(u)}
                            className="text-yellow-500 hover:text-yellow-400 hover:bg-yellow-500/10 pixel-corners"
                            title="Issue Warning"
                        >
                            <AlertTriangle className="h-4 w-4" />
                        </Button>
                    )}

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
