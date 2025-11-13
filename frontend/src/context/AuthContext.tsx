/**
 * Authentication Context
 * Manages authentication state across the application
 */
import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { authService } from '@/api';
import type { User } from '@/api';
import toast from 'react-hot-toast';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string, fullName?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state on mount
  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (token) {
        try {
          // Try to get current user from API (validates token)
          const currentUser = await authService.getCurrentUser();
          setUser(currentUser);
        } catch (apiError) {
          // Token invalid/expired, clear auth data
          console.error('Invalid or expired token, clearing auth:', apiError);
          authService.logout();
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Failed to initialize auth:', error);
      authService.logout();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (username: string, password: string) => {
    try {
      const response = await authService.login({ username, password });
      setUser(response.user);
      toast.success(`Welcome back, ${response.user.username}!`);
    } catch (error: any) {
      const message = error.response?.data?.error || 'Login failed';
      toast.error(message);
      throw error;
    }
  };

  const register = async (
    username: string,
    email: string,
    password: string,
    fullName?: string
  ) => {
    try {
      const response = await authService.register({
        username,
        email,
        password,
        full_name: fullName,
      });
      setUser(response.user);
      toast.success(`Account created! Welcome, ${response.user.username}!`);
    } catch (error: any) {
      const message = error.response?.data?.error || 'Registration failed';
      toast.error(message);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
      setUser(null);
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Logout failed:', error);
      // Still clear user state even if API call fails
      setUser(null);
    }
  };

  const refreshUser = async () => {
    try {
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error('Failed to refresh user:', error);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}
