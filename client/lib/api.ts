/// <reference types="node" />
// Import axios for making HTTP requests
import axios from 'axios';

// Define the API Base URL. Uses environment variable or defaults to localhost.
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Log the API URL to the console for debugging purposes
console.log('🔌 Connected to Backend at:', API_URL);

// Create an axios instance with the defined Base URL
const api = axios.create({
  baseURL: API_URL,
});

// Add a request interceptor to inject the Authorization header
api.interceptors.request.use((config) => {
  // Retrieve the JWT token from localStorage
  const token = localStorage.getItem('token');
  
  // If a token exists, add it to the Authorization header as a Bearer token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  // CACHE BUSTING: Add aggressive cache control headers
  config.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
  config.headers['Pragma'] = 'no-cache';
  config.headers['Expires'] = '0';
  
  // Add timestamp to prevent browser caching (for GET requests)
  // TEMPORARILY DISABLED - Testing if this causes CORS issues
  // if (config.method === 'get') {
  //   config.params = {
  //     ...config.params,
  //     _t: Date.now(), // Cache buster
  //   };
  // }
  
  // Return the modified config
  return config;
});

// Export the configured axios instance for use throughout the app
export default api;
