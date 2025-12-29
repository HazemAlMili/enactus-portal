"use client";

import { useState, useEffect, memo } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trophy } from 'lucide-react';

export const dynamic = 'force-dynamic';

// ⚡ Optimized row - React.memo prevents re-renders
const LeaderboardRow = memo(({ user, index }: { user: any; index: number }) => (
  <TableRow className="border-b border-primary/10">
    {/* Rank - 10% width */}
    <TableCell className="font-bold text-white pixel-font text-xs w-[10%]">
      {index < 3 ? (
        <div className={`flex items-center justify-center w-7 h-7 pixel-corners text-xs ${
          index === 0 ? 'bg-yellow-500 text-black' : 
          index === 1 ? 'bg-gray-400 text-black' : 
          'bg-amber-700 text-white'
        }`}>
          {index + 1}
        </div>
      ) : (
        <span className="text-gray-500">#{index + 1}</span>
      )}
    </TableCell>
    {/* Player - 60% width */}
    <TableCell className="text-white pixel-font text-xs w-[60%]">{user.name}</TableCell>
    {/* Guild - 15% width */}
    <TableCell className="w-[15%]">
      <span className="inline-block px-2 py-1 text-accent border border-accent/50 pixel-corners pixel-font text-[10px]">
        {user.department || 'N/A'}
      </span>
    </TableCell>
    {/* Hours - 15% width */}
    <TableCell className="text-right pixel-font text-secondary text-xs font-bold w-[15%]">
      {user.hoursApproved || 0}
    </TableCell>
  </TableRow>
));
LeaderboardRow.displayName = 'LeaderboardRow';

export default function LeaderboardPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const router = useRouter();

  // Detect mobile screen
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const userStr = sessionStorage.getItem('user');
    if (userStr) {
       const user = JSON.parse(userStr);
       const isHRCoordinator = user.role === 'Member' && user.department === 'HR' && user.title?.startsWith('HR Coordinator');
       const isDirector = user.role === 'Operation Director' || user.role === 'Creative Director';
       
       if (!['Head', 'Vice Head', 'HR', 'General President', 'Vice President'].includes(user.role) && !isHRCoordinator && !isDirector) {
          router.push('/dashboard');
          return;
       }
    } else {
       router.push('/');
       return;
    }

    let mounted = true;
    
    const fetchLeaderboard = async () => {
      try {
        const { data } = await api.get(`/users/leaderboard`);
        
        if (mounted) {
          setUsers(data);
          setError(null);
        }
      } catch (error: any) {
        console.error('Failed to fetch leaderboard:', error);
        if (mounted) {
          setError('Failed to load leaderboard.');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };
    
    fetchLeaderboard();
    
    return () => {
      mounted = false;
    };
  }, [router]);

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-6 bg-card p-6 border-b-4 border-b-destructive pixel-corners">
          <div className="w-8 h-8 flex items-center justify-center">
            <Trophy className="h-8 w-8 text-destructive" />
          </div>
          <h2 className="text-3xl pixel-font text-white">ERROR</h2>
        </div>
        <Card className="bg-card border-2 border-destructive pixel-corners">
          <CardContent className="p-8 text-center">
            <p className="text-destructive pixel-font text-sm mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="pixel-corners bg-primary hover:bg-primary/80 text-white px-6 py-3 pixel-font text-xs"
            >
              RETRY
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Empty state
  if (!loading && users.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-6 bg-card p-6 border-b-4 border-b-secondary pixel-corners">
          <div className="w-8 h-8 flex items-center justify-center">
            <Trophy className="h-8 w-8 text-secondary" />
          </div>
          <h2 className="text-3xl pixel-font text-white">LEADERBOARD</h2>
        </div>
        <Card className="bg-card border-2 border-primary pixel-corners">
          <CardContent className="p-8 text-center">
            <p className="text-white/60 pixel-font text-sm">NO DATA</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main content
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6 bg-card p-6 border-b-4 border-b-secondary pixel-corners">
        <div className="w-8 h-8 flex items-center justify-center">
          <Trophy className="h-8 w-8 text-secondary" />
        </div>
        <h2 className="text-3xl pixel-font text-white">LEADERBOARD</h2>
        <div className="ml-auto text-sm text-white/60 pixel-font">TOP {users.length}</div>
      </div>

      {/* Table with fixed layout - prevents expensive calculations! */}
      <Card className="bg-card border-2 border-primary pixel-corners">
        <CardContent className="p-0">
          <div className="w-full overflow-x-auto">
            {/* ⚡ table-fixed + explicit widths = FAST! */}
            <Table className="w-full table-fixed">
              <TableHeader>
                <TableRow className="border-b border-primary/30">
                  {/* Widths: 10% + 60% + 15% + 15% = 100% */}
                  <TableHead className="text-primary pixel-font text-xs w-[10%]">RANK</TableHead>
                  <TableHead className="text-primary pixel-font text-xs w-[60%]">PLAYER</TableHead>
                  <TableHead className="text-primary pixel-font text-xs w-[15%]">GUILD</TableHead>
                  <TableHead className="text-right text-primary pixel-font text-xs w-[15%]">HOURS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Mobile: Show 10, Desktop: Show all */}
                {(isMobile && !showAll ? users.slice(0, 10) : users).map((user, index) => (
                  <LeaderboardRow key={user._id} user={user} index={index} />
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Show More Button - Mobile Only */}
      {isMobile && !showAll && users.length > 10 && (
        <div className="text-center">
          <button
            onClick={() => setShowAll(true)}
            className="pixel-corners bg-secondary hover:bg-secondary/80 text-white px-6 py-3 pixel-font text-xs transition-all"
          >
            SHOW MORE ({users.length - 10} HIDDEN)
          </button>
        </div>
      )}
    </div>
  );
}
