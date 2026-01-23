"use client";

// Import Next.js navigation components
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
// Import utility for class merging
import { cn } from '@/lib/utils';
// Import UI components and icons
import { Button } from '@/components/ui/button';
import { LayoutDashboard, Clock, CheckSquare, Trophy, Users, LogOut, Building, User, Bell, Shield } from 'lucide-react';
// Import task notifications hook
import { useTaskNotifications } from '@/hooks/useTaskNotifications';
// Import sound effects
import { playClick, playLoss } from '@/lib/sounds';

// Define Sidebar Component
export function Sidebar({ user, className }: { user: any, className?: string }) {
  // Get current path... (hooks)
  const pathname = usePathname();
  const router = useRouter();
  
  // Get task notifications for members
  const { pendingTasksCount, hasNewTasks } = useTaskNotifications();

  // Define static navigation links
  const links = [
    { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
    { href: '/dashboard/tasks', label: 'Tasks', icon: CheckSquare, showBadge: true },
    { href: '/dashboard/profile', label: 'Identity', icon: User },
  ];

  // Management Links for Leaders (Head, Vice Head, HR, GP, VP, Directors)
  // Also HR Coordinators and Team Leaders
  const isHRCoordinator = user?.role === 'Member' && user?.department === 'HR' && user?.title?.startsWith('HR Coordinator');
  const isTeamLeader = user?.role === 'Member' && user?.department === 'HR' && user?.position === 'Team Leader';
  const isDirector = user?.role === 'Operation Director' || user?.role === 'Creative Director';
  const isGuest = user?.role === 'guest';
  
  if (user && (['Head', 'Vice Head', 'HR', 'General President', 'Vice President'].includes(user.role) || isHRCoordinator || isTeamLeader || isDirector || isGuest)) {
    links.push({ href: '/dashboard/hours', label: 'Hours', icon: Clock });
    links.push({ href: '/dashboard/leaderboard', label: 'Leaderboard', icon: Trophy });
    links.push({ href: '/dashboard/users', label: 'Squad', icon: Users });
    links.push({ href: '/dashboard/departments', label: 'Departments', icon: Building });
  }

  // Admin Dashboard (General President OR IT Head)
  if (user && (user.role === 'Head' && user.department === 'IT')) {
    links.push({ href: '/dashboard/admin', label: 'Admin', icon: Shield });
  }

  // Handle Logout Logic
  const handleLogout = () => {
    // Clear session storage
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('lastTaskCheck'); // Also clear task check timestamp
    sessionStorage.removeItem('taskNotificationShown'); // Clear notification flag
    // Replace history entry (prevents back/forward navigation to dashboard)
    router.replace('/');
  };

  // Check if user is a member (for showing task badge)
  const isMember = user?.role === 'Member';

  return (
    // Fixed width side navigation container - responsive based on screen size
    <div className={cn("flex flex-col h-screen w-64 bg-card border-r border-primary/50", !className?.includes('flex') && "hidden md:flex", className)}>
      {/* Brand Logo Section */}
      <div className="p-6">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-secondary to-accent bg-clip-text text-transparent">
          ENACTUS
        </h1>
      </div>
      
      {/* Navigation Links */}
      <nav className="flex-1 p-4 space-y-2">
        {links.map((link) => {
          const Icon = link.icon;
          const showNotification = link.showBadge && isMember && pendingTasksCount > 0;
          const isNew = link.showBadge && isMember && hasNewTasks;
          
          return (
            <Link key={link.href} href={link.href}>
              <Button
                variant="ghost"
                onClick={playClick} // 🔊 Click sound
                className={cn(
                  "w-full justify-start text-lg mb-2 relative",
                  // Conditional styling based on active state
                  pathname === link.href 
                    ? "bg-primary/20 text-accent hover:bg-primary/30" 
                    : "text-gray-400 hover:text-white hover:bg-primary/10"
                )}
              >
                <Icon className="mr-2 h-5 w-5" />
                {link.label}
                
                {/* Notification Badge */}
                {showNotification && (
                  <span 
                    className={cn(
                      "absolute right-2 top-1/2 -translate-y-1/2 pixel-corners text-[10px] font-bold px-1.5 py-0.5 min-w-[20px] text-center",
                      isNew 
                        ? "bg-red-500 text-white animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.6)]"
                        : "bg-yellow-500 text-black"
                    )}
                  >
                    {pendingTasksCount}
                  </span>
                )}
              </Button>
            </Link>
          );
        })}
      </nav>
      
      {/* Footer / Logout Section */}
      <div className="p-4">
        <Button variant="destructive" className="w-full" onClick={() => {
          playLoss(); // � Game over sound
          handleLogout();
        }}>
          <LogOut className="mr-2 h-4 w-4" />
          Quit
        </Button>
      </div>
    </div>
  );
}
