"use client";

// Import hooks and API
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import { playClick, playSuccess, playError } from '@/lib/sounds';
import { motion } from 'framer-motion';
// Import UI components
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff } from 'lucide-react';
// Import mascot and background
import AnimatedMascot from './AnimatedMascot';
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
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isTypingEmail, setIsTypingEmail] = useState(false);
  const [focusedField, setFocusedField] = useState<'email' | 'password' | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const router = useRouter();

  // Global mouse tracking for mascot (365 degree tracking)
  useEffect(() => {
    let animationFrameId: number;
    let lastTime = 0;
    const throttleMs = 16; // ~60fps

    const handleMouseMove = (e: MouseEvent) => {
      const currentTime = Date.now();
      
      // Throttle to match ~60fps
      if (currentTime - lastTime < throttleMs) {
        return;
      }
      
      lastTime = currentTime;
      
      // Always track mouse relative to mascot position
      const mascotContainer = document.querySelector('.mascot-container');
      if (mascotContainer) {
        const rect = mascotContainer.getBoundingClientRect();
        const mascotCenterX = rect.left + rect.width / 2;
        const mascotCenterY = rect.top + rect.height / 2;
        
        const x = e.clientX - mascotCenterX;
        const y = e.clientY - mascotCenterY;
        
        // Use requestAnimationFrame for smoother updates
        if (animationFrameId) {
          cancelAnimationFrame(animationFrameId);
        }
        
        animationFrameId = requestAnimationFrame(() => {
          setMousePosition({ x, y });
        });
      }
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
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
    
    // Trim credentials to avoid issues with hidden spaces
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    // Validate email and password
    const isEmailValid = validateEmail(cleanEmail);
    const isPasswordValid = validatePassword(cleanPassword);
    
    if (!isEmailValid || !isPasswordValid) {
      return; // Stop if validation fails
    }
    
    playClick();
    setIsLoading(true);
    
    try {
      // POST request to login endpoint
      const { data } = await api.post('/auth/login', { email: cleanEmail, password: cleanPassword });
      
      // Store token and user data in session storage
      sessionStorage.setItem('token', data.token);
      sessionStorage.setItem('user', JSON.stringify(data));
      sessionStorage.removeItem('isDemo');
      
      // Clear any leftover demo local data
      localStorage.removeItem('demo_users');
      localStorage.removeItem('demo_tasks');
      localStorage.removeItem('demo_hours');
      
      playSuccess();
      
      // 🎉 CELEBRATION! Show success animation
      setIsSuccess(true);
      
      // Wait for celebration animation, then redirect
      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);
    } catch (err: any) {
      playError();
      setError(err.response?.data?.message || 'Login failed');
      setIsLoading(false);
    }
  };

  // Portfolio Demo Login
  const handleGuestLogin = async () => {
    playClick();
    setIsLoading(true);
    setError('');
    
    try {
      const { data } = await api.post('/auth/login', { 
        email: 'visitor@enactus.com', 
        password: 'visitor2025' 
      });
      
      sessionStorage.setItem('token', data.token);
      sessionStorage.setItem('user', JSON.stringify(data));
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
            {/* Two Column Grid - Vertical on mobile */}
            <div className="grid md:grid-cols-2 gap-0">
              {/* LEFT SIDE - Mascot Section */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2, duration: 0.4 }}
                className="flex flex-col items-center justify-center p-8 md:p-12 bg-card/50 border-b md:border-b-0 md:border-r border-primary/20"
              >
                {/* Mascot Container */}
                <div className="w-full max-w-xs h-80 mb-6 mascot-container">
                  <AnimatedMascot
                    isPasswordVisible={showPassword}
                    hasError={!!(error || emailError || passwordError)}
                    mousePosition={mousePosition}
                    isTyping={isTypingEmail}
                    focusedField={focusedField}
                    isSuccess={isSuccess}
                  />
                </div>
                
                {/* Welcome Message - Pixel Font */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.4 }}
                  className="text-center"
                >
                  <h2 className="text-2xl md:text-3xl pixel-font bg-gradient-to-r from-secondary to-accent bg-clip-text text-transparent mb-2">
                    WELCOME BACK!
                  </h2>
                  <p className="text-sm text-muted-foreground font-mono">
                    Your digital companion is here to help
                  </p>
                </motion.div>
              </motion.div>

              {/* RIGHT SIDE - Login Form */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3, duration: 0.4 }}
                className="p-8 md:p-12"
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
                            setFocusedField('email');
                          }}
                          onBlur={() => {
                            setIsTypingEmail(false);
                            setFocusedField(null);
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
                          onFocus={() => setFocusedField('password')}
                          onBlur={() => {
                            setFocusedField(null);
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
