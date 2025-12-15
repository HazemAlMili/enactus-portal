"use client";

// Import hooks and API
import { useState } from 'react';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
// Import UI components
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"

// Define LoginForm Component
export default function LoginForm() {
  // State for form inputs and error messages
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  // Handle Login Form Submission
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // POST request to login endpoint
      // Ensure we're hitting the correct endpoint. If /api/auth/login is the standard, 
      // api.post('/auth/login') assumes baseURL includes /api or / is relative correctly.
      // Based on previous files, api instance likely handles baseURL.
      const { data } = await api.post('/auth/login', { email, password });
      
      // Store token and user data in local storage
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data));
      
      // Redirect to dashboard
      router.push('/dashboard');
    } catch (err: any) {
      // Set error message from response or generic default
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    // Centered Container - Removed bg-background to let body pattern show
    <div className="flex items-center justify-center min-h-screen p-4">
      {/* Login Card */}
      <Card className="w-[350px] border-primary shadow-lg shadow-purple-900/50 bg-card/95 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-2xl text-center pixel-font bg-gradient-to-r from-secondary to-accent bg-clip-text text-transparent pb-2">
            WELCOME TO ENACTUS PORTAL
          </CardTitle>
          <CardDescription className="text-center text-gray-400 font-sans">
            Enter your credentials to access the portal
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email Input */}
            <div className="space-y-2">
              <Label htmlFor="email" className="pixel-font text-xs text-primary">EMAIL</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="name@enactus.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-background/50 border-primary/50 focus:border-primary"
              />
            </div>
            {/* Password Input */}
            <div className="space-y-2">
              <Label htmlFor="password" className="pixel-font text-xs text-primary">PASSWORD</Label>
              <Input 
                id="password" 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-background/50 border-primary/50 focus:border-primary"
              />
            </div>
            
            {/* Error Message Display */}
            {error && (
              <div className="text-red-500 text-xs pixel-font text-center bg-red-900/20 p-2 border border-red-500/50">
                {error}
              </div>
            )}
            
            {/* Submit Button */}
            <Button 
              type="submit" 
              className="w-full bg-secondary text-secondary-foreground hover:bg-yellow-500 pixel-corners pixel-font mt-4 text-sm font-bold tracking-widest"
            >
              START GAME
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
