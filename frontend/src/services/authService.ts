import api from './api';
import { AuthResponse, LoginCredentials, RegisterCredentials, User } from '../types/auth';

const authService = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    try {
      console.log('Attempting login with:', { email: credentials.email });
      const response = await api.post<AuthResponse>('/api/auth/login', credentials);
      
      if (response.data.token) {
        // Store the token in localStorage
        localStorage.setItem('token', response.data.token);
        console.log('Login successful, token stored');
        
        // Log token length to check if it's valid (without revealing the actual token)
        console.log(`Token received (length: ${response.data.token.length})`);
      }
      
      return response.data;
    } catch (error: any) {
      console.error('Login error:', error);
      
      // Handle different types of errors
      if (error.response) {
        // The server responded with an error status code
        const errorMsg = error.response.data?.message || 
                         (error.response.status === 500 ? 
                          'Server error. Please try again later.' : 
                          'Login failed');
        
        return {
          success: false,
          message: errorMsg
        };
      } else if (error.request) {
        // The request was made but no response was received
        return {
          success: false,
          message: 'No response from server. Please check your internet connection.'
        };
      } else {
        // Something else went wrong
        return {
          success: false,
          message: error.message || 'Login failed'
        };
      }
    }
  },

  register: async (credentials: RegisterCredentials): Promise<AuthResponse> => {
    try {
      const response = await api.post<AuthResponse>('/api/auth/register', credentials);
      
      // Store the token if provided during registration
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        console.log('Registration successful, token stored');
      }
      
      return response.data;
    } catch (error: any) {
      console.error('Registration error:', error);
      
      // Handle different types of errors
      if (error.response) {
        // The server responded with an error status code
        const errorMsg = error.response.data?.message || 
                         (error.response.status === 500 ? 
                          'Server error. Please try again later.' : 
                          'Registration failed');
        
        return {
          success: false,
          message: errorMsg
        };
      } else if (error.request) {
        // The request was made but no response was received
        return {
          success: false,
          message: 'No response from server. Please check your internet connection.'
        };
      } else {
        // Something else went wrong
        return {
          success: false,
          message: error.message || 'Registration failed'
        };
      }
    }
  },

  getProfile: async (): Promise<User | null> => {
    try {
      // Check if token exists before making the request
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('No token found in localStorage, skipping profile request');
        return null;
      }
      
      // Log that we're making a profile request (good for debugging)
      console.log('Fetching user profile with stored token');
      
      const response = await api.get<{ success: boolean, user: User }>('/api/auth/profile');
      return response.data.user;
    } catch (error: any) {
      console.error('Get profile error:', error);
      
      // Only log the error, don't display to user as this is often called silently
      if (error.response && error.response.status !== 401) {
        // For errors other than unauthorized, log them
        console.error(`Profile fetch failed with status ${error.response.status}`);
      }
      
      if (error.response && error.response.status === 401) {
        console.log('Token invalid or expired - clearing local storage');
      }
      
      return null;
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    console.log('User logged out, token removed');
  },
  
  // Debug utility to check token status
  checkToken: (): { exists: boolean, tokenLength: number | null } => {
    const token = localStorage.getItem('token');
    return {
      exists: !!token,
      tokenLength: token ? token.length : null
    };
  }
};

export default authService;