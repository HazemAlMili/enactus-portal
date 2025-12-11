"use client";

// Import Next.js navigation components
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
// Import utility for class merging
import { cn } from '@/lib/utils';
// Import UI components and icons
import { Button } from '@/components/ui/button';
import { LayoutDashboard, Clock, CheckSquare, Trophy, Users, LogOut } from 'lucide-react';

// Define Sidebar Component which receives the current user as a prop
export function Sidebar({ user }: { user: any }) {
  // Get current path to highlight active link
  const pathname = usePathname();
  // Get router for navigation actions (logout)
  const router = useRouter();

  // Define static navigation links
  const links = [
    { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
    { href: '/dashboard/hours', label: 'Hours', icon: Clock },
    { href: '/dashboard/tasks', label: 'Tasks', icon: CheckSquare },
    { href: '/dashboard/leaderboard', label: 'Leaderboard', icon: Trophy },
  ];

  // Dynamically add 'Users' link for HR or President roles
  if (user?.role === 'HR' || user?.role === 'General President') {
    links.push({ href: '/dashboard/users', label: 'Users', icon: Users });
  }

  // Handle Logout Logic
  const handleLogout = () => {
    // Clear session storage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    // Redirect to landing page
    router.push('/');
  };

  return (
    // Fixed width side navigation container
    <div className="flex flex-col h-screen w-64 bg-card border-r border-primary/50">
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
          return (
            <Link key={link.href} href={link.href}>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start text-lg mb-2",
                  // Conditional styling based on active state
                  pathname === link.href 
                    ? "bg-primary/20 text-accent hover:bg-primary/30" 
                    : "text-gray-400 hover:text-white hover:bg-primary/10"
                )}
              >
                <Icon className="mr-2 h-5 w-5" />
                {link.label}
              </Button>
            </Link>
          );
        })}
      </nav>
      
      {/* Footer / Logout Section */}
      <div className="p-4">
        <Button variant="destructive" className="w-full" onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  );
}
