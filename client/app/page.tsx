"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
// Import the LoginForm component to display on the landing page
import LoginForm from '@/components/auth/LoginForm';

// Define the Home page component (the root route '/')
export default function Home() {
  const router = useRouter();
  
  useEffect(() => {
    // 🧹 DEEP CLEAN: Clear ALL existing session or demo data when on login page
    // This prevents state leakage and ensures a fresh start for every login
    sessionStorage.clear();
    localStorage.clear();
    
    console.log('🧹 Browser storage deep-cleaned for fresh login');
  }, []);
  
  return (
    // Render the main content area
    <main>
      {/* Display the Login Form */}
      <LoginForm />
    </main>
  );
}
