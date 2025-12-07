"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, Clock, CheckSquare, Trophy, Users, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function Sidebar({ user }: { user: any }) {
  const pathname = usePathname();
  const router = useRouter();

  const links = [
    { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
    { href: '/dashboard/hours', label: 'Hours', icon: Clock },
    { href: '/dashboard/tasks', label: 'Tasks', icon: CheckSquare },
    { href: '/dashboard/leaderboard', label: 'Leaderboard', icon: Trophy },
  ];

  if (user?.role === 'HR' || user?.role === 'General President') {
    links.push({ href: '/dashboard/users', label: 'Users', icon: Users });
  }

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };

  return (
    <div className="flex flex-col h-screen w-64 bg-card border-r border-primary/50">
      <div className="p-6">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-secondary to-accent bg-clip-text text-transparent">
          ENACTUS
        </h1>
      </div>
      <nav className="flex-1 p-4 space-y-2">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <Link key={link.href} href={link.href}>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start text-lg mb-2",
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
      <div className="p-4">
        <Button variant="destructive" className="w-full" onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  );
}
