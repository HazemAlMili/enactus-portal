/**
 * Cache Management Utilities
 * Ensures fresh data and prevents stale cache issues
 */

/**
 * Clear all browser cache storage
 */
export const clearAllCache = () => {
  // Clear localStorage except authentication
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  
  localStorage.clear();
  
  // Restore authentication
  if (token) localStorage.setItem('token', token);
  if (user) localStorage.setItem('user', user);
  
  // Clear sessionStorage
  sessionStorage.clear();
  
  console.log('✅ Cache cleared successfully');
};

/**
 * Force refresh user data from server
 */
export const refreshUserData = async () => {
  try {
    const api = (await import('./api')).default;
    const { data } = await api.get('/auth/me');
    localStorage.setItem('user', JSON.stringify(data));
    return data;
  } catch (error) {
    console.error('Failed to refresh user data:', error);
    return null;
  }
};

/**
 * Add version number to prevent cache conflicts on updates
 */
export const CACHE_VERSION = 'v1.0.0';

/**
 * Check if cache needs to be cleared (version mismatch)
 */
export const checkCacheVersion = () => {
  const storedVersion = localStorage.getItem('cacheVersion');
  
  if (storedVersion !== CACHE_VERSION) {
    console.log('🔄 Cache version mismatch - clearing cache');
    clearAllCache();
    localStorage.setItem('cacheVersion', CACHE_VERSION);
  }
};

/**
 * Initialize cache management on app start
 */
export const initCacheManagement = () => {
  checkCacheVersion();
  
  // Set up periodic cache refresh (every 5 minutes)
  setInterval(() => {
    console.log('🔄 Periodic cache check...');
    // You can add logic here to refresh specific data
  }, 5 * 60 * 1000);
};
