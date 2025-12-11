// Import the LoginForm component to display on the landing page
import LoginForm from '@/components/auth/LoginForm';

// Define the Home page component (the root route '/')
export default function Home() {
  return (
    // Render the main content area
    <main>
      {/* Display the Login Form */}
      <LoginForm />
    </main>
  );
}
