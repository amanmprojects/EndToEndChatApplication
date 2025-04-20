import { create } from 'zustand';
import { User, LoginCredentials, RegisterCredentials } from '../types/auth';
import authService from '../services/authService';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: LoginCredentials) => Promise<boolean>;
  register: (credentials: RegisterCredentials) => Promise<boolean>;
  logout: () => void;
  checkAuthStatus: () => Promise<void>;
}

const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  
  login: async (credentials) => {
    set({ isLoading: true, error: null });
    const response = await authService.login(credentials);
    
    if (response.success && response.user) {
      set({ 
        isAuthenticated: true, 
        user: response.user, 
        isLoading: false,
        error: null
      });
      return true;
    } else {
      set({ 
        isAuthenticated: false, 
        user: null, 
        isLoading: false,
        error: response.message || 'Login failed'
      });
      return false;
    }
  },
  
  register: async (credentials) => {
    set({ isLoading: true, error: null });
    const response = await authService.register(credentials);
    
    if (response.success) {
      set({ isLoading: false, error: null });
      return true;
    } else {
      set({ 
        isLoading: false,
        error: response.message || 'Registration failed'
      });
      return false;
    }
  },
  
  logout: () => {
    authService.logout();
    set({ user: null, isAuthenticated: false });
  },
  
  checkAuthStatus: async () => {
    set({ isLoading: true });
    const token = localStorage.getItem('token');
    
    if (!token) {
      set({ isAuthenticated: false, user: null, isLoading: false });
      return;
    }
    
    const user = await authService.getProfile();
    
    if (user) {
      set({ isAuthenticated: true, user, isLoading: false });
    } else {
      set({ isAuthenticated: false, user: null, isLoading: false });
      localStorage.removeItem('token');
    }
  },
}));

export default useAuthStore;