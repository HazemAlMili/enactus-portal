/**
 * Cache Management Utilities
 * Ensures fresh data and prevents stale cache issues
 */

/**
 * Clear all browser cache storage
 */
export const clearAllCache = () => {
  // Clear sessionStorage except authentication
  const token = sessionStorage.getItem('token');
  const user = sessionStorage.getItem('user');
  
  sessionStorage.clear();
  
  // Restore authentication
  if (token) sessionStorage.setItem('token', token);
  if (user) sessionStorage.setItem('user', user);
  
  console.log('✅ Cache cleared successfully');
};

/**
 * Force refresh user data from server
 */
export const refreshUserData = async () => {
  try {
    const api = (await import('./api')).default;
    const { data } = await api.get('/auth/me');
    sessionStorage.setItem('user', JSON.stringify(data));
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
  const storedVersion = sessionStorage.getItem('cacheVersion');
  
  if (storedVersion !== CACHE_VERSION) {
    console.log('🔄 Cache version mismatch - clearing cache');
    clearAllCache();
    sessionStorage.setItem('cacheVersion', CACHE_VERSION);
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
