// API Client utility for making HTTP requests
import axios from 'axios';
import { API_CONFIG, API_URLS } from '../config/api';

// Create axios instance with default configuration
const apiClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: API_CONFIG.DEFAULT_HEADERS,
});

// Request interceptor for logging
apiClient.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    console.log(`API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('API Response Error:', error);
    
    // Enhanced error handling
    if (error.code === 'ERR_NETWORK') {
      console.error('Network Error: Unable to connect to server');
    } else if (error.response?.status === 0) {
      console.error('CORS Error: Server is not allowing requests from this origin');
    }
    
    return Promise.reject(error);
  }
);

// API methods
export const api = {
  // User transaction methods
  addTransaction: (transaction) => 
    apiClient.post(API_CONFIG.ENDPOINTS.USER_TRANSACTION, transaction),
  
  getUserTransactions: () => 
    apiClient.get(API_CONFIG.ENDPOINTS.USER_TRANSACTIONS),
  
  getUserPockets: () => 
    apiClient.get(API_CONFIG.ENDPOINTS.USER_POCKETS),
  
  // Health check
  healthCheck: () => 
    apiClient.get(API_CONFIG.ENDPOINTS.HEALTH_CHECK),
};

// Export the configured axios instance
export default apiClient;
