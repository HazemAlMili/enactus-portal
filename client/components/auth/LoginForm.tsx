"use client";

// Import hooks and API
import { useState } from 'react';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import { playClick, playSuccess, playError } from '@/lib/sounds';
// Import UI components
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff } from 'lucide-react';

// Define LoginForm Component
export default function LoginForm() {
  // State for form inputs and error messages
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isLoading, setIsLoading] = useState(false); // ← NEW: Loading state
  const [showPassword, setShowPassword] = useState(false); // 👁️ Password visibility
  const router = useRouter();

  // Validate email domain
  const validateEmail = (email: string) => {
    if (!email) {
      setEmailError('Email is required');
      return false;
    }
    if (!email.endsWith('@enactus.com')) {
      setEmailError('Invalid email address');
      return false;
    }
    setEmailError('');
    return true;
  };

  // Validate password strength
  const validatePassword = (password: string) => {
    if (!password) {
      setPasswordError('Password is required');
      return false;
    }
    if (password.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      return false;
    }
    if (!/[a-z]/.test(password)) {
      setPasswordError('Password must contain at least one uppercase letter');
      return false;
    }
    setPasswordError('');
    return true;
  };

  // Handle Login Form Submission
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validate email and password
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);
    
    if (!isEmailValid || !isPasswordValid) {
      return; // Stop if validation fails
    }
    
    playClick(); // 🔊 Play click sound
    setIsLoading(true); // ← Start loading
    
    try {
      // POST request to login endpoint
      const { data } = await api.post('/auth/login', { email, password });
      
      // Store token and user data in session storage (cleared on browser close)
      sessionStorage.setItem('token', data.token);
      sessionStorage.setItem('user', JSON.stringify(data));
      
      playSuccess(); // 🔊 Play success sound
      
      // Redirect to dashboard
      router.push('/dashboard');
    } catch (err: any) {
      // Set error message from response or generic default
      playError(); // ❌ Invalid credentials buzz
      setError(err.response?.data?.message || 'Login failed');
      setIsLoading(false); // ← Stop loading on error
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
                onChange={(e) => {
                  setEmail(e.target.value);
                  setEmailError(''); // Clear error on change
                }}
                onBlur={() => validateEmail(email)} // Validate on blur
                required
                className={`bg-background/50 border-primary/50 focus:border-primary ${
                  emailError ? 'border-red-500' : ''
                }`}
              />
              {emailError && (
                <p className="text-red-500 text-xs pixel-font">{emailError}</p>
              )}
            </div>
            {/* Password Input */}
            <div className="space-y-2">
              <Label htmlFor="password" className="pixel-font text-xs text-primary">PASSWORD</Label>
              <div className="relative">
                <Input 
                  id="password" 
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setPasswordError(''); // Clear error on change
                  }}
                  onBlur={() => validatePassword(password)} // Validate on blur
                  required
                  className={`bg-background/50 border-primary/50 focus:border-primary pr-10 ${
                    passwordError ? 'border-red-500' : ''
                  }`}
                />
                {/* Eye Toggle Button */}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {passwordError && (
                <p className="text-red-500 text-xs pixel-font">{passwordError}</p>
              )}
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
              disabled={isLoading}
              className="w-full bg-secondary text-secondary-foreground hover:bg-yellow-500 pixel-corners pixel-font mt-4 text-sm font-bold tracking-widest disabled:opacity-70 disabled:cursor-not-allowed transition-all relative overflow-hidden"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="text-xs">Deploying mission</span>
                  <span className="flex gap-0.5">
                    <span className="inline-block text-xs animate-bounce" style={{ animationDelay: '0ms' }}>█</span>
                    <span className="inline-block text-xs animate-bounce" style={{ animationDelay: '150ms' }}>█</span>
                    <span className="inline-block text-xs animate-bounce" style={{ animationDelay: '300ms' }}>█</span>
                  </span>
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <span>▶</span>
                  <span>START GAME</span>
                </span>
              )}
              
              {/* Pixel Loading Bar Effect */}
              {isLoading && (
                <span className="absolute bottom-0 left-0 h-1 bg-yellow-400 animate-pixel-load" />
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
