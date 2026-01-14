"use client";

// Import hooks for state management and side effects
import { useEffect, useState } from 'react';
// Import useRouter for navigation (redirect handling)
import { useRouter } from 'next/navigation';
// Import the Sidebar layout component
import { Sidebar } from '@/components/layout/Sidebar';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { VisuallyHidden } from '@/components/ui/visually-hidden';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Define the Dashboard Layout that wraps all dashboard sub-pages
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Initialize router for redirection
  const router = useRouter();
  // State to hold the current logged-in user
  const [user, setUser] = useState<any>(null);
  // State definition for loading status to prevent flickering
  const [loading, setLoading] = useState(true);

  // Effect to check authentication status on component mount
  useEffect(() => {
    // specific logic: retrive user from session storage
    const storedUser = sessionStorage.getItem('user');
    
    // If no user is found, redirect to login page (Root '/')
    if (!storedUser) {
      router.push('/');
    } else {
      // If user exists, parse and set user state
      setUser(JSON.parse(storedUser));
    }
    // Set loading to false once check is complete
    setLoading(false);
  }, [router]);

  // If still loading, render nothing (or a loading spinner could be added here)
  if (loading) return null;

  return (
    // Main layout container: Full screen height, background color, hidden overflow
    <div className="flex h-screen overflow-hidden flex-col md:flex-row">
      
      {/* Mobile/Tablet Header / Sidebar Trigger */}
      <div className="md:hidden p-4 border-b border-primary/20 flex items-center justify-between bg-card">
         <div className="font-bold text-lg text-primary pixel-font">ENACTUS PORTAL</div>
         <Sheet>
           <SheetTrigger asChild>
             <Button variant="ghost" size="icon" className="pixel-corners">
               <Menu className="h-6 w-6" />
             </Button>
           </SheetTrigger>
           <SheetContent side="left" className="p-0 border-r border-primary/50 w-64 bg-card">
             <VisuallyHidden>
               <SheetTitle>Navigation Menu</SheetTitle>
             </VisuallyHidden>
             <Sidebar user={user} className="flex w-full h-full border-none" />
           </SheetContent>
         </Sheet>
      </div>

      {/* Desktop Sidebar navigation component - Hidden on Mobile/Tablet */}
      <div className="hidden md:flex">
        <Sidebar user={user} />
      </div>
      
      {/* Main content area: Flex-1 to take remaining width, scrollable y-axis */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        {children}
      </main>
    </div>
  );
}
