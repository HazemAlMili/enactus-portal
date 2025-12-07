"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      router.push('/');
    } else {
      setUser(JSON.parse(storedUser));
    }
  }, [router]);

  if (!user) return <div className="text-white">Loading...</div>;

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-white">Welcome, {user.name}</h1>
        <Button 
          variant="destructive" 
          onClick={() => {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            router.push('/');
          }}
        >
          Logout
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-card border-primary">
          <CardHeader>
            <CardTitle className="text-accent">Role</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-white">{user.role}</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-primary">
          <CardHeader>
            <CardTitle className="text-secondary">Department</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-white">{user.department || 'N/A'}</p>
          </CardContent>
        </Card>

        {/* Add more stats based on role later */}
      </div>
    </div>
  );
}
