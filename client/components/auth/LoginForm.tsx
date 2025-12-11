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
    // Centered Container
    <div className="flex items-center justify-center min-h-screen bg-background">
      {/* Login Card */}
      <Card className="w-[350px] border-primary shadow-lg shadow-purple-900/50">
        <CardHeader>
          <CardTitle className="text-2xl text-center text-primary-foreground">Enactus Login</CardTitle>
          <CardDescription className="text-center text-gray-400">Enter your credentials to access the portal</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email Input */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="name@enactus.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            {/* Password Input */}
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password" 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            
            {/* Error Message Display */}
            {error && <p className="text-red-500 text-sm">{error}</p>}
            
            {/* Submit Button */}
            <Button type="submit" className="w-full bg-secondary text-secondary-foreground hover:bg-yellow-500">
              Start Game
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
