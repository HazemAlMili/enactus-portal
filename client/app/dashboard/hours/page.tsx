"use client";

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

export default function HoursPage() {
  const [hours, setHours] = useState<any[]>([]);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const u = JSON.parse(localStorage.getItem('user') || '{}');
    setUser(u);
    fetchHours();
  }, []);

  const fetchHours = async () => {
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.get('http://localhost:5000/api/hours', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHours(data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/hours', 
        { amount: Number(amount), description },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAmount('');
      setDescription('');
      fetchHours();
    } catch (error) {
      console.error(error);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:5000/api/hours/${id}`, 
        { status: 'Approved' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchHours();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-white mb-6">Hours Tracking</h2>
      
      {/* Submission Form */}
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

      {/* List */}
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
