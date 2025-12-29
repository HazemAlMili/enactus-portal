"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNotification } from '@/components/ui/notification';
import { useTaskNotifications } from '@/hooks/useTaskNotifications';

// Force dynamic rendering - disable Next.js caching
export const dynamic = 'force-dynamic';

// Define User Interface
interface Warning {
  reason: string;
  date: string;
  issuer: string;
}

interface User {
  name: string;
  email: string;
  department?: string;
  role: string;
  points?: number;
  hoursApproved?: number;
  tasksCompleted?: number;
  warnings?: Warning[];
}

// Define Dashboard Component
export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const { showNotification } = useNotification();
  const { newTasksCount, pendingTasksCount } = useTaskNotifications();

  // Effect to protect the route and load user data
  useEffect(() => {
    const storedUser = sessionStorage.getItem('user');
    if (!storedUser) {
      router.push('/');
      return;
    }
    
    // Set initial user from session storage to avoid flashing
    setUser(JSON.parse(storedUser));

    // Fetch fresh user data with cache-busting
    const fetchUserData = async () => {
      try {
        const { data } = await api.get(`/auth/me?_t=${Date.now()}`);
        console.log('📊 Fetched user data:', data);
        console.log('⚠️ Warnings:', data.warnings);
        setUser(data);
        // Optionally update session storage
        sessionStorage.setItem('user', JSON.stringify(data));
      } catch (error) {
        console.error("❌ Failed to fetch fresh user data:", error);
        // If auth fails, maybe redirect? For now, keep local version or let interceptors handle it
      }
    };

    fetchUserData();
  }, [router]);

  // Show new task notification for members
  useEffect(() => {
    if (user && user.role === 'Member') {
      // Check if we should show notification (only once per session)
      const hasShownNotification = sessionStorage.getItem('taskNotificationShown');
      
      if (!hasShownNotification && newTasksCount > 0) {
        showNotification(
          `🎯 You have ${newTasksCount} new mission${newTasksCount > 1 ? 's' : ''} waiting! Check the Tasks page.`,
          'info',
          8000
        );
        sessionStorage.setItem('taskNotificationShown', 'true');
      } else if (!hasShownNotification && pendingTasksCount > 0) {
        showNotification(
          `📋 You have ${pendingTasksCount} pending mission${pendingTasksCount > 1 ? 's' : ''} to complete.`,
          'warning',
          6000
        );
        sessionStorage.setItem('taskNotificationShown', 'true');
      }
    }
  }, [user, newTasksCount, pendingTasksCount, showNotification]);

  // Show loading state while checking user
  if (!user) return <div className="text-white">Loading...</div>;

  return (
    <div className="p-8 space-y-8 min-h-[85vh] flex flex-col">
      {/* Header Section: Gamified Welcome */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl text-primary pixel-font mb-2 drop-shadow-md">
            WELCOME,<br />
            <span className="mt-1 text-3xl">{user.name.toUpperCase()}</span>
          </h1>
        </div>
        
        {/* Badges moved to top right */}
        <div className="flex flex-col items-end gap-2 text-white/80 font-mono">
          <span className="bg-secondary/20 px-4 py-2 rounded-none border border-secondary pixel-corners text-secondary text-base">
            {user.role}
          </span>
          <span className="bg-primary/20 px-4 py-2 rounded-none border border-primary pixel-corners text-base">
            {user.role === 'General President' 
              ? 'President'
              : user.role === 'Vice President'
              ? 'Vice'
              : user.role === 'Operation Director' || user.role === 'Creative Director' 
              ? 'Director' 
              : (user.department || 'NO_DEPT')}
          </span>
          
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center space-y-8">
      {/* Level Progress Section */}
      <Card className="bg-card border-2 border-primary pixel-corners">
        <CardContent className="p-5">
          {(() => {
             const isBoss = ['Head', 'Vice Head', 'General President', 'Vice President', 'Operation Director', 'Creative Director', 'HR'].includes(user.role);
             const xpForNextLevel = 100;
             const rawLevel = Math.floor((user.points || 0) / xpForNextLevel) + 1;
             const displayLevel = isBoss ? "99+" : rawLevel;
             const progress = isBoss ? 100 : ((user.points || 0) % xpForNextLevel) / xpForNextLevel * 100;

             return (
               <>
                  <div className="flex justify-between items-end mb-2">
                     <div>
                        <h3 className="text-secondary pixel-font text-xl">{isBoss ? "BOSS LEVEL" : `LEVEL ${displayLevel}`}</h3>
                        <p className="text-xs text-white/60 font-mono mt-1">
                           {isBoss ? "MAXIMUM CLEARANCE" : `NEXT REWARD AT ${(Math.floor((user.points || 0) / xpForNextLevel) + 1) * xpForNextLevel} XP`}
                        </p>
                     </div>
                     <span className="text-white pixel-font text-sm">{isBoss ? 100 : (user.points || 0)} XP</span>
                  </div>
                  {/* XP Bar - Updated to match Identity page */}
                  <div className="h-3 w-full bg-gray-900 border border-primary/20 rounded-full overflow-hidden relative">
                    <div 
                      className="h-full bg-gradient-to-r from-secondary to-blue-500 relative transition-all duration-1000"
                      style={{ width: `${progress}%` }}
                    >
                      <div className="absolute inset-0 bg-white/20 w-full h-full animate-pulse" />
                    </div>
                  </div>
               </>
             );
          })()}
        </CardContent>
      </Card>



      {/* Stats Grid - ONLY FOR MEMBERS */}
      {user.role === 'Member' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Tasks Card */}
          <Card className="bg-card border-2 border-accent pixel-corners hover:scale-105 transition-transform">
            <CardHeader className="pb-2">
              <CardTitle className="text-accent pixel-font text-sm">MISSIONS DONE</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-white pixel-font">{user.tasksCompleted || 0}</p>
              <p className="text-xs text-white/50 mt-1">COMPLETED TASKS</p>
            </CardContent>
          </Card>

          {/* Points Card */}
          <Card className="bg-card border-2 border-primary pixel-corners hover:scale-105 transition-transform">
            <CardHeader className="pb-2">
              <CardTitle className="text-primary pixel-font text-sm">TOTAL SCORE</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-white pixel-font">{user.points || 0}</p>
              <p className="text-xs text-white/50 mt-1">LIFETIME XP</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Warnings Section - ONLY FOR MEMBERS */}
      {/* DEBUG: Show even if no warnings to test component */}
      {user.role === 'Member' && (
        <Card className="bg-card border-2 border-destructive pixel-corners">
          <CardHeader className="border-b border-destructive/20">
            <CardTitle className="text-destructive pixel-font text-sm flex items-center gap-2">
              <span className="animate-pulse">⚠️</span>
              WARNINGS RECEIVED
              <span className="bg-destructive text-white text-xs px-2 py-0.5 pixel-corners">
                {user.warnings?.length || 0}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            {!user.warnings || user.warnings.length === 0 ? (
              <p className="text-white/50 text-sm text-center py-4">
                No warnings received. Keep up the good work! ✅
              </p>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {user.warnings.map((warning, index) => (
                  <div 
                    key={index} 
                    className="bg-destructive/10 border border-destructive/30 pixel-corners p-3 hover:bg-destructive/20 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs text-destructive font-mono">
                        WARNING #{user.warnings!.length - index}
                      </span>
                      <span className="text-xs text-white/50 font-mono">
                        {new Date(warning.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                    <p className="text-white text-sm mb-2">{warning.reason}</p>
                    <p className="text-xs text-white/40 font-mono">
                      Issued by: {warning.issuer}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Quote Footer (Replacing Press Start) */}
      <div className="mt-8 text-center max-w-2xl mx-auto">
        <p className="text-white/40 text-xl pixel-font animate-pulse italic">
          "{(() => {
             const quotes: Record<string, string[]> = {
                 'IT': [
                     "Building the future, pixel by pixel.",
                     "Talk is cheap. Show me the code.",
                     "It's not a bug, it's a feature.",
                     "Code is poetry written in logic."
                 ],
                 'HR': [
                     "Human potential, unlocked.",
                     "Hire character. Train skill.",
                     "Building the team that builds the dream.",
                     "People are not resources, they are possibilities."
                 ],
                 'PM': [
                     "Vision needs execution.",
                     "Plans are nothing; planning is everything.",
                     "Leading the way, one milestone at a time.",
                     "Turning chaos into roadmap."
                 ],
                 'PR': [
                     "Stories that shape the world.",
                     "Everything you do is public relations.",
                     "Perception is reality.",
                     "Words have power. Use them wisely."
                 ],
                 'FR': [
                     "Fueling the impossible.",
                     "Resources drive the mission.",
                     "Investing in impact.",
                     "Every coin counts towards the cause."
                 ],
                 'Logistics': [
                     "The backbone of operations.",
                     "Amateurs talk strategy. Professionals talk logistics.",
                     "Efficiency is doing better what is already being done.",
                     "Moving mountains, on schedule."
                 ],
                 'Organization': [
                     "Order creates opportunity.",
                     "Structure allows creativity to flow.",
                     "A place for everything, and everything in its place.",
                     "The foundation of success is organization."
                 ],
                 'Marketing': [
                     "Ideas that spread, win.",
                     "Marketing is no longer about the stuff that you make, but about the stories you tell.",
                     "Creativity is intelligence having fun.",
                     "Inspiring action through connection."
                 ],
                 'Multi-Media': [
                     "Reality, reimagined.",
                     "A picture is worth a thousand lines of code.",
                     "Capturing the spirit of the moment.",
                     "Visuals speak louder than words."
                 ],
                 'Presentation': [
                     "Impact through expression.",
                     "The art of communication is the language of leadership.",
                     "Speak to influence.",
                     "Your stage, your story."
                 ]
             };
             
             const deptQuotes = quotes[user.department || ''] || ["Making the world better, one action at a time."];
             const randomIndex = Math.floor(Math.random() * deptQuotes.length);
             return deptQuotes[randomIndex];
          })()}"
        </p>
      </div>
      </div>
    </div>
  );
}
