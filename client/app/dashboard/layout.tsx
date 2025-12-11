"use client";

// Import hooks for state management and side effects
import { useEffect, useState } from 'react';
// Import useRouter for navigation (redirect handling)
import { useRouter } from 'next/navigation';
// Import the Sidebar layout component
import { Sidebar } from '@/components/layout/Sidebar';

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
    // specific logic: retrive user from local storage
    const storedUser = localStorage.getItem('user');
    
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
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar navigation component */}
      <Sidebar user={user} />
      
      {/* Main content area: Flex-1 to take remaining width, scrollable y-axis */}
      <main className="flex-1 overflow-y-auto p-8">
        {children}
      </main>
    </div>
  );
}
