// API Configuration
// Change the base URL here to switch between different environments

import { getApiUrl } from './environment';

const API_CONFIG = {
  // Base URL for all API calls
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || getApiUrl(),
  
  // Alternative URLs for different environments
  // Uncomment and modify as needed:
  
  // Development (local server)
  // BASE_URL: 'http://localhost:5000',
  
  // Staging
  // BASE_URL: 'https://upi-pwa-staging.onrender.com',
  
  // Production
  // BASE_URL: 'https://upi-pwa.onrender.com',
  
  // API Endpoints
  ENDPOINTS: {
    USER_TRANSACTION: '/api/user/transaction',
    USER_TRANSACTIONS: '/api/user/transactions',
    USER_POCKETS: '/api/user/pockets',
    HEALTH_CHECK: '/api'
  },
  
  // Request timeout (in milliseconds)
  TIMEOUT: 10000,
  
  // Default headers
  DEFAULT_HEADERS: {
    'Content-Type': 'application/json',
  }
};

// Helper function to get full API URL
export const buildApiUrl = (endpoint) => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

// Helper function to get API configuration
export const getApiConfig = () => {
  return API_CONFIG;
};

// Pre-configured API URLs for common endpoints
export const API_URLS = {
  USER_TRANSACTION: buildApiUrl(API_CONFIG.ENDPOINTS.USER_TRANSACTION),
  USER_TRANSACTIONS: buildApiUrl(API_CONFIG.ENDPOINTS.USER_TRANSACTIONS),
  USER_POCKETS: buildApiUrl(API_CONFIG.ENDPOINTS.USER_POCKETS),
  HEALTH_CHECK: buildApiUrl(API_CONFIG.ENDPOINTS.HEALTH_CHECK)
};

export default API_CONFIG;
