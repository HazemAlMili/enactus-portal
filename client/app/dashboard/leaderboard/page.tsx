"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy } from 'lucide-react';

export default function LeaderboardPage() {
  const [users, setUsers] = useState<any[]>([]);
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
       const user = JSON.parse(userStr);
       // Allow Heads, Vice Heads, HR, GP
       // Also ALLOW HR Coordinators (Member, HR, Title check)
       const isHRCoordinator = user.role === 'Member' && user.department === 'HR' && user.title?.startsWith('HR Coordinator');
       
       if (!['Head', 'Vice Head', 'HR', 'General President'].includes(user.role) && !isHRCoordinator) {
          router.push('/dashboard'); // Redirect unauthorized
          return;
       }
    } else {
       router.push('/');
       return;
    }

    const fetchLeaderboard = async () => {
      try {
        const { data } = await api.get('/users/leaderboard');
        // Filter to show ONLY Members (Redundant check but safe)
        setUsers(data.filter((u: any) => u.role === 'Member'));
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, [router]);

  if (loading) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6 bg-card p-6 border-b-4 border-b-secondary pixel-corners">
        <Trophy className="h-8 w-8 text-secondary animate-pulse" />
        <h2 className="text-3xl pixel-font text-white text-glow">LEADERBOARD</h2>
      </div>

      <Card className="bg-card border-2 border-primary pixel-corners">
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-primary/30 hover:bg-transparent">
                <TableHead className="text-primary pixel-font text-xs w-[100px]">RANK</TableHead>
                <TableHead className="text-primary pixel-font text-xs">PLAYER</TableHead>
                <TableHead className="text-primary pixel-font text-xs">GUILD</TableHead>
                <TableHead className="text-right text-primary pixel-font text-xs">HOURS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user, index) => (
                <TableRow key={user._id} className="border-b border-primary/10 hover:bg-primary/5">
                  <TableCell className="font-bold text-white pixel-font">
                    {/* Top 3 Stylized Ranking Badges */}
                    {index + 1 <= 3 ? (
                      <div className={`
                        flex items-center justify-center w-8 h-8 pixel-corners text-xs
                        ${index === 0 ? 'bg-yellow-500 text-black' : // Gold
                          index === 1 ? 'bg-gray-400 text-black' : // Silver
                          'bg-amber-700 text-white'} // Bronze
                      `}>
                        {index + 1}
                      </div>
                    ) : (
                      <span className="text-gray-500 pl-2">#{index + 1}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-white font-medium pixel-font text-xs">{user.name}</span>
                      <span className="text-[10px] text-gray-500 font-mono uppercase">{user.role}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-accent border-accent/50 pixel-corners pixel-font text-[10px]">{user.department || 'N/A'}</Badge>
                  </TableCell>
                  <TableCell className="text-right pixel-font text-secondary text-sm">
                    {user.hoursApproved !== undefined ? user.hoursApproved : 0} HRS
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
