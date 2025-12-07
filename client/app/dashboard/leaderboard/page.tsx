"use client";

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy } from 'lucide-react';

export default function LeaderboardPage() {
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const token = localStorage.getItem('token');
        const { data } = await axios.get('http://localhost:5000/api/users/leaderboard', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUsers(data);
      } catch (error) {
        console.error(error);
      }
    };
    fetchLeaderboard();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Trophy className="h-8 w-8 text-secondary" />
        <h2 className="text-3xl font-bold text-white">Leaderboard</h2>
      </div>

      <Card className="bg-card border-none">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-primary/30 hover:bg-transparent">
                <TableHead className="text-gray-400 w-[100px]">Rank</TableHead>
                <TableHead className="text-gray-400">User</TableHead>
                <TableHead className="text-gray-400">Department</TableHead>
                <TableHead className="text-right text-gray-400">Points</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user, index) => (
                <TableRow key={user._id} className="border-b border-primary/10 hover:bg-primary/5">
                  <TableCell className="font-bold text-white">
                    {index + 1 <= 3 ? (
                      <span className={`
                        inline-flex items-center justify-center w-8 h-8 rounded-full 
                        ${index === 0 ? 'bg-yellow-500 text-black' : 
                          index === 1 ? 'bg-gray-400 text-black' : 
                          'bg-amber-700 text-white'}
                      `}>
                        {index + 1}
                      </span>
                    ) : (
                      <span className="text-gray-500 pl-3">#{index + 1}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-white font-medium">{user.name}</span>
                      <span className="text-xs text-gray-500">{user.role}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-accent border-accent/50">{user.department || 'N/A'}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono text-secondary text-lg">
                    {user.points} XP
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
