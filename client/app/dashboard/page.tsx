"use client";

// Import React hooks
import { useEffect, useState } from 'react';
// Import navigation router
import { useRouter } from 'next/navigation';
// Import UI components from shadcn/ui library
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Define Dashboard Component
export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  // Effect to protect the route and load user data
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      // Redirect to login if not authenticated
      router.push('/');
    } else {
      setUser(JSON.parse(storedUser));
    }
  }, [router]);

  // Show loading state while checking user
  if (!user) return <div className="text-white">Loading...</div>;

  return (
    <div className="p-8 space-y-8">
      {/* Header Section: Gamified Welcome */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl text-primary pixel-font mb-2 drop-shadow-md">
            WELCOME, {user.name}
          </h1>
          <div className="flex items-center gap-2 text-white/80 font-mono text-sm">
            <span className="bg-primary/20 px-2 py-1 rounded-none border border-primary pixel-corners">
              {user.department || 'NO_DEPT'}
            </span>
            <span className="bg-secondary/20 px-2 py-1 rounded-none border border-secondary pixel-corners text-secondary">
              {user.role}
            </span>
          </div>
        </div>
        <Button 
          variant="destructive" 
          className="pixel-corners"
          onClick={() => {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            router.push('/');
          }}
        >
          LOGOUT (QUIT)
        </Button>
      </div>

      {/* Level Progress Section */}
      <Card className="bg-card border-2 border-primary pixel-corners">
        <CardContent className="p-6">
          <div className="flex justify-between items-end mb-2">
             <div>
                <h3 className="text-secondary pixel-font text-xl">LEVEL {Math.floor((user.points || 0) / 100) + 1}</h3>
                <p className="text-xs text-white/60 font-mono mt-1">NEXT REWARD AT {(Math.floor((user.points || 0) / 100) + 1) * 100} XP</p>
             </div>
             <span className="text-white pixel-font text-sm">{user.points || 0} XP</span>
          </div>
          {/* XP Bar */}
          <div className="h-6 w-full bg-black border-2 border-white/20 relative">
            <div 
              className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-1000"
              style={{ width: `${(user.points || 0) % 100}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Hours Card */}
        <Card className="bg-card border-2 border-secondary pixel-corners hover:scale-105 transition-transform">
          <CardHeader className="pb-2">
            <CardTitle className="text-secondary pixel-font text-sm">HOURS PLAYED</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-white pixel-font">{user.hoursApproved || 0}</p>
            <p className="text-xs text-white/50 mt-1">APPROVED TIME</p>
          </CardContent>
        </Card>

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

      {/* Quick Actions Note */}
      <div className="mt-8 text-center">
        <p className="text-white/40 text-sm pixel-font animate-pulse">
          PRESS START ON "TASKS" TO BEGIN MISSION...
        </p>
      </div>
    </div>
  );
}
