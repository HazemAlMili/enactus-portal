"use client";

// Import hooks and API
import { useState, useEffect } from 'react';
import api from '@/lib/api';
// Import UI components
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

// Define HoursPage Component
export default function HoursPage() {
  // State for hours list
  const [hours, setHours] = useState<any[]>([]);
  // State for form inputs
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  // State for user info (to determine roles)
  const [user, setUser] = useState<any>(null);

  // Effect on mount: load user and fetch hours
  useEffect(() => {
    const u = JSON.parse(localStorage.getItem('user') || '{}');
    setUser(u);
    fetchHours();
  }, []);

  // Fetch hours logs from backend
  const fetchHours = async () => {
    try {
      const token = localStorage.getItem('token');
      // GET /hours
      const { data } = await api.get('/hours');
      setHours(data);
    } catch (error) {
      console.error(error);
    }
  };

  // Handler to submit new hours
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      // POST to /hours
      await api.post('/hours', 
        { amount: Number(amount), description }
      );
      // Reset form fields
      setAmount('');
      setDescription('');
      // Refresh list
      fetchHours();
    } catch (error) {
      console.error(error);
    }
  };

  // Handler for Heads/HR to approve hours
  const handleApprove = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      // PUT request to update status to 'Approved'
      await api.put(`/hours/${id}`, 
        { status: 'Approved' }
      );
      fetchHours();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-white mb-6">Hours Tracking</h2>
      
      {/* Submission Form Card */}
      <Card className="bg-card border-primary">
        <CardHeader>
          <CardTitle className="text-secondary">Submit Hours</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="text-sm text-gray-400">Description</label>
              <Input 
                value={description} 
                onChange={(e) => setDescription(e.target.value)} 
                placeholder="What did you do?" 
              />
            </div>
            <div className="w-32">
              <label className="text-sm text-gray-400">Hours</label>
              <Input 
                type="number" 
                value={amount} 
                onChange={(e) => setAmount(e.target.value)} 
                placeholder="2" 
              />
            </div>
            <Button type="submit" className="bg-accent hover:bg-purple-500">Submit</Button>
          </form>
        </CardContent>
      </Card>

      {/* List of Hours Logs */}
      <Card className="bg-card border-primary/50">
        <CardHeader>
          <CardTitle className="text-white">History</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-gray-400">Date</TableHead>
                <TableHead className="text-gray-400">User</TableHead>
                <TableHead className="text-gray-400">Description</TableHead>
                <TableHead className="text-gray-400">Hours</TableHead>
                <TableHead className="text-gray-400">Status</TableHead>
                {/* Show Action column only for Leaders */}
                {(user?.role === 'Head' || user?.role === 'General President' || user?.role === 'HR') && (
                  <TableHead className="text-gray-400">Action</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {hours.map((log) => (
                <TableRow key={log._id}>
                  <TableCell className="text-white">{new Date(log.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell className="text-white">{log.user?.name}</TableCell>
                  <TableCell className="text-white">{log.description}</TableCell>
                  <TableCell className="text-white">{log.amount}</TableCell>
                  <TableCell>
                    <Badge variant={log.status === 'Approved' ? 'default' : 'secondary'}>
                      {log.status}
                    </Badge>
                  </TableCell>
                  {/* Approve Button for Leaders */}
                  {(user?.role === 'Head' || user?.role === 'General President' || user?.role === 'HR') && log.status === 'Pending' && (
                    <TableCell>
                      <Button size="sm" onClick={() => handleApprove(log._id)} className="bg-green-600 hover:bg-green-700 h-8">
                        Approve
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
