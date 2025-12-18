"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
// Import the LoginForm component to display on the landing page
import LoginForm from '@/components/auth/LoginForm';

// Define the Home page component (the root route '/')
export default function Home() {
  const router = useRouter();
  
  useEffect(() => {
    // Clear any existing session data when on login page
    // This prevents "forward" navigation from working after logout
    const token = sessionStorage.getItem('token');
    if (token) {
      // If there's a token, user might have used back button
      // Clear everything and ensure they stay on login
      sessionStorage.clear();
    }
  }, []);
  
  return (
    // Render the main content area
    <main>
      {/* Display the Login Form */}
      <LoginForm />
    </main>
  );
}
