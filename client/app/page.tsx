"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
// Import the LoginForm component to display on the landing page
import LoginForm from '@/components/auth/LoginForm';

// Define the Home page component (the root route '/')
export default function Home() {
  const router = useRouter();
  
  useEffect(() => {
    // 🧹 DEEP CLEAN: Clear any existing session or demo data when on login page
    // This prevents state leakage between Guest and Real sessions
    sessionStorage.clear();
    localStorage.removeItem('demo_users');
    localStorage.removeItem('demo_tasks');
    localStorage.removeItem('demo_hours');
    
    console.log('🧹 Session cleared for fresh login');
  }, []);
  
  return (
    // Render the main content area
    <main>
      {/* Display the Login Form */}
      <LoginForm />
    </main>
  );
}
