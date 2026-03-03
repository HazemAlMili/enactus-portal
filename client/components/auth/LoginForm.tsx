"use client";

// Import hooks and API
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { playClick, playSuccess, playError } from '@/lib/sounds';
import { motion } from 'framer-motion';
// Import UI components
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff } from 'lucide-react';
// Import background
import CloudBackground from '@/components/layout/CloudBackground';

// Define LoginForm Component
export default function LoginForm() {
  // State for form inputs and error messages
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isTypingEmail, setIsTypingEmail] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [hasExistingSession, setHasExistingSession] = useState(false);
  const router = useRouter();

  // Global session check
  useEffect(() => {
    if (sessionStorage.getItem('user')) {
      setHasExistingSession(true);
    }
  }, []); // No dependencies - always track

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
    if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return false;
    }
    setPasswordError('');
    return true;
  };

  // Handle Login Form Submission
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    const isEmailValid = validateEmail(cleanEmail);
    const isPasswordValid = validatePassword(cleanPassword);
    if (!isEmailValid || !isPasswordValid) return;
    
    playClick();
    setIsLoading(true);
    
    try {
      const supabase = createClient();

      // Sign in with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: cleanPassword,
      });

      if (authError) throw authError;

      // Fetch the full profile from public.profiles via the API
      // (which validates the Supabase JWT using the protect middleware)
      const { data: profile } = await (await import('@/lib/api')).default.get('/auth/me');

      // Store profile in sessionStorage for dashboard layout backward-compat
      sessionStorage.setItem('user', JSON.stringify(profile));
      sessionStorage.removeItem('isDemo');
      localStorage.removeItem('demo_users');
      localStorage.removeItem('demo_tasks');
      localStorage.removeItem('demo_hours');
      
      playSuccess();
      setIsSuccess(true);
      setTimeout(() => router.push('/dashboard'), 1500);
    } catch (err: any) {
      playError();
      setError(err.message || err.response?.data?.message || 'Login failed');
      setIsLoading(false);
    }
  };

  // Portfolio Demo Login
  const handleGuestLogin = async () => {
    playClick();
    setIsLoading(true);
    setError('');
    
    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: 'visitor@enactus.com',
        password: 'visitor2025',
      });

      if (authError) throw authError;

      const { data: profile } = await (await import('@/lib/api')).default.get('/auth/me');
      sessionStorage.setItem('user', JSON.stringify(profile));
      sessionStorage.removeItem('isDemo');
      localStorage.removeItem('demo_users');
      localStorage.removeItem('demo_tasks');
      localStorage.removeItem('demo_hours');
      
      playSuccess();
      router.push('/dashboard');
    } catch (err: any) {
      playError();
      setError('Guest login failed. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Cloud Background - matching dashboard */}
      <CloudBackground />
      
      <div className="relative flex items-center justify-center min-h-screen p-4">
        {/* Main Login Card - matching portal theme */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-5xl"
        >
          <div className="bg-card/95 backdrop-blur-sm border-2 border-primary rounded-lg shadow-2xl shadow-purple-900/50 overflow-hidden pixel-corners">
            {/* Single Column Layout (Removed Mascot) */}
            <div className="flex justify-center items-center w-full">
              {/* Login Form Container */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.4 }}
                className="p-8 md:p-12 w-full max-w-lg"
              >
                <div className="max-w-md mx-auto">
                  {/* Header */}
                  <div className="mb-8">
                    <h1 className="text-3xl md:text-4xl pixel-font bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-2">
                      ENACTUS PORTAL
                    </h1>
                    <p className="text-muted-foreground text-sm font-mono">
                      Enter your credentials to access the portal
                    </p>
                  </div>

                  {/* Form */}
                  <form onSubmit={handleLogin} className="space-y-5">
                    {/* Email Input */}
                    <div className="space-y-2">
                      <Label htmlFor="email" className="pixel-font text-xs text-primary">
                        EMAIL ADDRESS
                      </Label>
                      <div className="relative h-12 flex items-center">
                        <Input 
                          id="email" 
                          type="email" 
                          placeholder="name@enactus.com" 
                          value={email}
                          onChange={(e) => {
                            setEmail(e.target.value);
                            setEmailError('');
                            setError('');
                          }}
                          onFocus={() => {
                            setIsTypingEmail(true);
                          }}
                          onBlur={() => {
                            setIsTypingEmail(false);
                            validateEmail(email);
                          }}
                          required
                          className={`absolute inset-0 bg-background/50 border-2 border-primary/50 focus:border-primary text-foreground h-12 transition-colors duration-200 focus-visible:ring-0 focus-visible:outline-none shadow-none ${
                            emailError ? 'border-red-500 focus:border-red-500' : ''
                          }`}
                        />
                      </div>
                      {emailError && (
                        <motion.p
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-red-400 text-xs pixel-font"
                        >
                          {emailError}
                        </motion.p>
                      )}
                    </div>

                    {/* Password Input */}
                    <div className="space-y-2">
                      <Label htmlFor="password" className="pixel-font text-xs text-primary">
                        PASSWORD
                      </Label>
                      <div className="relative h-12 flex items-center">
                        <Input 
                          id="password" 
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => {
                            setPassword(e.target.value);
                            setPasswordError('');
                            setError('');
                          }}
                          onBlur={() => {
                            validatePassword(password);
                          }}
                          required
                          className={`absolute inset-0 bg-background/50 border-2 border-primary/50 focus:border-primary text-foreground h-12 pr-12 transition-colors duration-200 focus-visible:ring-0 focus-visible:outline-none shadow-none ${
                            passwordError ? 'border-red-500 focus:border-red-500' : ''
                          }`}
                        />
                        {/* Eye Toggle Button */}
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center w-10 h-10 text-muted-foreground hover:text-primary transition-colors z-10"
                          aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                          {showPassword ? (
                            <EyeOff className="h-5 w-5" />
                          ) : (
                            <Eye className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                      {passwordError && (
                        <motion.p
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-red-400 text-xs pixel-font"
                        >
                          {passwordError}
                        </motion.p>
                      )}
                    </div>
                    
                    {/* Error Message Display */}
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-red-900/20 border border-red-500/50 pixel-corners p-3"
                      >
                        <p className="text-red-400 text-sm pixel-font text-center">{error}</p>
                      </motion.div>
                    )}
                    
                    {/* Submit Button */}
                    <Button 
                      type="submit" 
                      disabled={isLoading}
                      className="w-full h-12 bg-gradient-to-r from-secondary to-accent hover:from-yellow-500 hover:to-purple-600 text-secondary-foreground font-bold pixel-font text-sm tracking-widest pixel-corners disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 relative overflow-hidden"
                    >
                      {isLoading ? (
                        <span className="flex items-center justify-center gap-2">
                          <span className="text-xs">ACCESSING</span>
                        </span>
                      ) : (
                        <span className="flex items-center justify-center gap-2">
                          <span className="flex items-center justify-center">LOGIN</span>
                        </span>
                      )}
                      
                      {/* Pixel Loading Bar Effect */}
                      {isLoading && (
                        <span className="absolute bottom-0 left-0 h-1 bg-yellow-400 animate-pixel-load" />
                      )}
                    </Button>
                    
                    {/* Returning User Quick-Access Button */}
                    {hasExistingSession && (
                      <div className="pt-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            playClick();
                            router.push('/dashboard');
                          }}
                          className="w-full h-12 pixel-corners border-2 border-accent text-accent hover:bg-accent/10 transition-colors"
                        >
                          <span className="pixel-font mt-1">CONTINUE TO DASHBOARD ➔</span>
                        </Button>
                      </div>
                    )}
                  </form>

                  {/* Guest Login */}
                  <div className="mt-6 pt-5 border-t border-primary/20">
                    <button 
                      type="button"
                      onClick={handleGuestLogin}
                      disabled={isLoading}
                      className="w-full text-xs pixel-font text-muted-foreground hover:text-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? 'CONNECTING...' : 'TRY DEMO MODE'}
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
}
