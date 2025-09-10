// Environment Configuration
// This file helps manage different environments for your API

const ENVIRONMENTS = {
  DEVELOPMENT: {
    name: 'Development',
    apiUrl: 'http://localhost:5000',
    description: 'Local development server'
  },
  STAGING: {
    name: 'Staging',
    apiUrl: 'https://upi-pwa-staging.onrender.com',
    description: 'Staging environment for testing'
  },
  PRODUCTION: {
    name: 'Production',
    apiUrl: 'https://upi-pwa.onrender.com',
    description: 'Live production environment'
  },
  CUSTOM: {
    name: 'Custom',
    apiUrl: 'http://192.168.1.15:5000',
    description: 'Custom IP address for local network testing'
  }
};

// Current environment - change this to switch environments
const CURRENT_ENV = 'PRODUCTION'; // Change to: 'DEVELOPMENT', 'STAGING', 'PRODUCTION', or 'CUSTOM'

export const getCurrentEnvironment = () => {
  return ENVIRONMENTS[CURRENT_ENV];
};

export const getApiUrl = () => {
  return getCurrentEnvironment().apiUrl;
};

export const getAllEnvironments = () => {
  return ENVIRONMENTS;
};

export default getCurrentEnvironment;
