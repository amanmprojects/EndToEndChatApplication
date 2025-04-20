import axios from 'axios';

// Try different potential backend ports, as the server tries ports 5000, 5001, etc.
const potentialPorts = [5000, 5001, 5002, 5003, 5004];
let currentPortIndex = 0;

// Function to get the current base URL to try
const getBaseUrl = () => {
  if (process.env.NODE_ENV === 'production') {
    return process.env.REACT_APP_API_URL || '';
  } else {
    const port = potentialPorts[currentPortIndex];
    return `http://localhost:${port}`;
  }
};

// Initial API URL
export let API_URL = getBaseUrl();

// Create axios instance with shorter timeout for development
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // Shorter timeout so we can try other ports quickly if one fails
  timeout: process.env.NODE_ENV === 'production' ? 10000 : 3000,
});

// Add request interceptor to include auth token in requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      // Debug log to confirm token is being sent (only in development)
      if (process.env.NODE_ENV !== 'production') {
        console.log(`Request to ${config.url}: Token attached (${token.substring(0, 5)}...)`);
      }
    } else {
      // Log when making requests without token
      if (process.env.NODE_ENV !== 'production' && 
          !config.url?.includes('/login') && 
          !config.url?.includes('/register')) {
        console.log(`Request to ${config.url}: No auth token available`);
      }
    }
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor to handle common errors and try fallback ports
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Don't retry if we've already retried or if it's not a connection issue
    if (
      originalRequest._retry || 
      (error.response && error.response.status !== 0) || 
      (error.code !== 'ECONNABORTED' && error.code !== 'ERR_NETWORK')
    ) {
      logErrorDetails(error);
      return Promise.reject(error);
    }

    // Mark as retried
    originalRequest._retry = true;

    // In development, try other ports if connection fails
    if (process.env.NODE_ENV !== 'production') {
      // Try the next port
      currentPortIndex = (currentPortIndex + 1) % potentialPorts.length;
      
      // If we've tried all ports and circled back to the first one, give up
      if (currentPortIndex === 0) {
        logErrorDetails(error);
        return Promise.reject(error);
      }
      
      // Update the API URL with the new port
      const newBaseUrl = getBaseUrl();
      API_URL = newBaseUrl;
      
      // Update the instance's base URL
      api.defaults.baseURL = API_URL;
      
      console.log(`Trying next server at ${API_URL}`);

      // Retry the request with the new port
      return api(originalRequest);
    }
    
    logErrorDetails(error);
    return Promise.reject(error);
  }
);

// Helper function to log detailed error information
function logErrorDetails(error) {
  if (error.response) {
    // The server responded with a status code outside the 2xx range
    console.error('Server error:', {
      status: error.response.status,
      data: error.response.data,
      headers: error.response.headers,
      url: error.config?.url
    });

    // Handle specific error codes
    switch (error.response.status) {
      case 401:
        // Only clear token and redirect to login if not already on login/register pages
        // and not trying to access certain public endpoints or authentication endpoints
        const isAuthEndpoint = error.config?.url?.includes('/api/auth/login') || 
                              error.config?.url?.includes('/api/auth/register');
        const isPublicEndpoint = error.config?.url?.includes('/api/health');
        const isLoginPage = window.location.pathname === '/login';
        const isRegisterPage = window.location.pathname === '/register';
        
        console.log('401 Unauthorized - Auth details:', {
          isAuthEndpoint,
          isPublicEndpoint,
          isLoginPage,
          isRegisterPage,
          path: window.location.pathname,
          tokenExists: !!localStorage.getItem('token')
        });
        
        if (!isAuthEndpoint && !isPublicEndpoint && !isLoginPage && !isRegisterPage) {
          console.log('Authentication failed - removing token and redirecting to login');
          localStorage.removeItem('token');
          
          // Use history API to prevent full page reload
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
        }
        break;
      case 500:
        console.error('Internal server error. Please try again later or contact support.');
        break;
    }
  } else if (error.request) {
    // The request was made but no response was received
    console.error('Network error - no response received:', error.request);
    console.error('Server might be down or not available at', API_URL);
  } else {
    // Something happened in setting up the request
    console.error('Request setup error:', error.message);
  }
}

export default api;