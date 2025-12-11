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
import { Trash2, UserPlus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

// Define UsersPage Component (Squad Management)
export default function UsersPage() {
  // State for the list of users
  const [users, setUsers] = useState<any[]>([]);
  // State for controlling the 'Add Member' modal visibility
  const [isOpen, setIsOpen] = useState(false);
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

  // Fetch users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  // Handler for creating a new user
  const handleCreate = async () => {
    try {
      const token = localStorage.getItem('token');
      // POST to /users with form data
      await api.post('/users', formData);
      // Close modal and refresh list
      setIsOpen(false);
      fetchUsers();
    } catch (error) {
      console.error(error);
    }
  };

  // Handler for deleting a user by ID
  const handleDelete = async (id: string) => {
    // Confirm deletion with the user
    if(!confirm('Are you sure?')) return;
    try {
      const token = localStorage.getItem('token');
      // DELETE request
      await api.delete(`/users/${id}`);
      fetchUsers();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-card p-6 rounded-lg border-l-4 border-l-accent">
        <h2 className="text-3xl font-bold text-white">Squad Management</h2>
        
        {/* Add Member Dialog (Modal) */}
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="bg-secondary text-secondary-foreground hover:bg-yellow-500">
              <UserPlus className="mr-2 h-4 w-4" />
              Recruit Member
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Member</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {/* Form Fields: Name, Email, Password, Role, Department */}
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Password</Label>
                <Input type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select onValueChange={v => setFormData({...formData, role: v})} defaultValue={formData.role}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Member">Member</SelectItem>
                    <SelectItem value="Vice Head">Vice Head</SelectItem>
                    <SelectItem value="Head">Head</SelectItem>
                    <SelectItem value="HR">HR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Department</Label>
                <Select onValueChange={v => setFormData({...formData, department: v})} defaultValue={formData.department}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['IT','HR','PM','PR','FR','Logistics','Organization','Marketing','Multi-Media','Presentation'].map(d => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleCreate} className="w-full">Confirm Recruit</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Users List Table */}
      <Card className="bg-card/50 border-primary/20">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-gray-400">Name</TableHead>
                <TableHead className="text-gray-400">Role</TableHead>
                <TableHead className="text-gray-400">Department</TableHead>
                <TableHead className="text-gray-400">XP</TableHead>
                <TableHead className="text-gray-400"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* Map through users array */}
              {users.map((u) => (
                <TableRow key={u._id}>
                  <TableCell className="text-white font-medium">{u.name}</TableCell>
                  <TableCell className="text-gray-300">{u.role}</TableCell>
                  <TableCell><Badge variant="outline">{u.department}</Badge></TableCell>
                  <TableCell className="text-secondary">{u.points}</TableCell>
                  <TableCell className="text-right">
                    {/* Delete Button */}
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(u._id)} className="text-red-500 hover:text-red-600 hover:bg-red-900/20">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
