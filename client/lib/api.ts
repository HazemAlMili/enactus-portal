// Import axios for making HTTP requests
import axios from 'axios';

// Define the API Base URL. Uses environment variable or defaults to localhost.
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Log the API URL to the console for debugging purposes
console.log('🔌 Connected to Backend at:', API_URL);

// Create an axios instance with the defined Base URL
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // ⚡ CRITICAL: Send cookies/credentials with requests!
  timeout: 30000, // 30 second timeout for Bahrain DB
});

// 🚀 REQUEST INTERCEPTOR
api.interceptors.request.use(async (config: any) => {
  // Retrieve the Supabase session access token
  let token: string | null = null;
  if (typeof window !== 'undefined') {
    try {
      const { createClient } = await import('@/lib/supabase');
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      token = session?.access_token || null;
    } catch {
      // If Supabase isn't ready, continue without token
    }
  }

  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  // CACHE BUSTING: Add aggressive cache control headers
  // Only override for specific routes where cache is disabled on the server
  config.headers = config.headers || {};
  config.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
  config.headers['Pragma'] = 'no-cache';
  config.headers['Expires'] = '0';
  
  // Return the modified config
  return config;
});

// Export the configured axios instance for use throughout the app
export default api;
