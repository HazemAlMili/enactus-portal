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
    <div className="p-8">
      {/* Header Section: Welcome message and Logout button */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-white">Welcome, {user.name}</h1>
        <Button 
          variant="destructive" 
          onClick={() => {
            // clear local storage on logout
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            // Redirect to home/login page
            router.push('/');
          }}
        >
          Logout
        </Button>
      </div>

      {/* Statistics / Information Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* User Role Card */}
        <Card className="bg-card border-primary">
          <CardHeader>
            <CardTitle className="text-accent">Role</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-white">{user.role}</p>
          </CardContent>
        </Card>

        {/* User Department Card */}
        <Card className="bg-card border-primary">
          <CardHeader>
            <CardTitle className="text-secondary">Department</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-white">{user.department || 'N/A'}</p>
          </CardContent>
        </Card>

        {/* Placeholder for additional future stats */}
        {/* Add more stats based on role later */}
      </div>
    </div>
  );
}
