/**
 * Authentication Context
 * Manages authentication state across the application
 */
import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { authService } from '@/api';
import type { User } from '@/api';
import toast from 'react-hot-toast';
import {
  clearDemoSessionStorage,
  createAndStoreDemoSession,
  getDemoSession,
} from '@/lib/demoSession';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isDemo: boolean;
  isLoading: boolean;
  authStatus: 'checking' | 'authenticated' | 'unauthenticated';
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string, fullName?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  triggerDemoLogin: () => Promise<void>;
  clearDemoSession: () => void;
  updateUser: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isDemo, setIsDemo] = useState(false);
  const [authStatus, setAuthStatus] = useState<'checking' | 'authenticated' | 'unauthenticated'>('checking');
  const isLoading = authStatus === 'checking';

  const clearDemoCaches = () => {
    sessionStorage.removeItem('inboxData');
    sessionStorage.removeItem('inboxCacheTime');
    sessionStorage.removeItem('outboxData');
    sessionStorage.removeItem('outboxCacheTime');
    sessionStorage.removeItem('dashboardData');
    sessionStorage.removeItem('dashboardCacheTimestamp');
  }

  // Initialize auth state on mount
  useEffect(() => {
    initializeAuth();
  }, []);

  useEffect(() => {
    if (window.electronAPI?.onAuthClear) {
      const handler = () => {
        authService.clearStoredAuth();
        clearDemoSessionStorage();
        setUser(null);
        setIsDemo(false);
        setAuthStatus('unauthenticated');
        window.dispatchEvent(new CustomEvent('demo-session-updated'));
      };
      window.electronAPI.onAuthClear(handler);
      return () => {
        window.electronAPI?.removeAllListeners?.('auth-clear');
      };
    }
  }, []);

  useEffect(() => {
    const handler = () => {
      authService.clearStoredAuth();
      clearDemoSessionStorage();
      setUser(null);
      setIsDemo(false);
      setAuthStatus('unauthenticated');
      window.dispatchEvent(new CustomEvent('demo-session-updated'));
    };
    window.addEventListener('auth-expired', handler);
    return () => {
      window.removeEventListener('auth-expired', handler);
    };
  }, []);

  const initializeAuth = async () => {
    try {
      try {
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
        setIsDemo(false);
        setAuthStatus('authenticated');
        return;
      } catch (apiError) {
        console.error('No active authenticated session:', apiError);
      }

      const demoSession = getDemoSession();
      if (demoSession?.isDemo) {
        setUser(demoSession.user as User);
        setIsDemo(true);
        setAuthStatus('authenticated');
        return;
      }

      setUser(null);
      setIsDemo(false);
      setAuthStatus('unauthenticated');
    } catch (error) {
      console.error('Failed to initialize auth:', error);
      setUser(null);
      setIsDemo(false);
      setAuthStatus('unauthenticated');
    }
  };

  const login = async (username: string, password: string) => {
    try {
      clearDemoSessionStorage();
      const response = await authService.login({ username, password });
      setUser(response.user);
      setIsDemo(false);
      setAuthStatus('authenticated');
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
      clearDemoSessionStorage();
      const response = await authService.register({
        username,
        email,
        password,
        full_name: fullName,
      });
      setUser(response.user);
      setIsDemo(false);
      setAuthStatus('authenticated');
      toast.success(`Account created! Welcome, ${response.user.username}!`);
    } catch (error: any) {
      const message = error.response?.data?.error || 'Registration failed';
      toast.error(message);
      throw error;
    }
  };

  const logout = async () => {
    if (isDemo) {
      clearDemoSessionStorage();
      setUser(null);
      setIsDemo(false);
      setAuthStatus('unauthenticated');
      window.dispatchEvent(new CustomEvent('demo-session-updated'));
      toast.success('Exited demo session');
      return;
    }

    try {
      await authService.logout();
      setUser(null);
      setIsDemo(false);
      setAuthStatus('unauthenticated');
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Logout failed:', error);
      // Still clear user state even if API call fails
      setUser(null);
      setIsDemo(false);
      setAuthStatus('unauthenticated');
    }
  };

  const refreshUser = async () => {
    if (isDemo) {
      const demoSession = getDemoSession();
      if (demoSession?.isDemo) {
        setUser(demoSession.user as User);
        setAuthStatus('authenticated');
        return;
      }
    }

    try {
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
      setIsDemo(false);
      setAuthStatus('authenticated');
    } catch (error) {
      console.error('Failed to refresh user:', error);
      setIsDemo(false);
      setAuthStatus('unauthenticated');
      throw error;
    }
  };

  const triggerDemoLogin = async () => {
    await new Promise((resolve) => setTimeout(resolve, 900));
    authService.clearStoredAuth();
    clearDemoCaches();
    const session = createAndStoreDemoSession();
    setUser(session.user as User);
    setIsDemo(true);
    setAuthStatus('authenticated');
    window.dispatchEvent(new CustomEvent('demo-session-updated'));
    toast.success('Demo session started');
  };

  const clearDemoSession = () => {
    clearDemoSessionStorage();
    authService.clearStoredAuth();
    clearDemoCaches();
    setUser(null);
    setIsDemo(false);
    setAuthStatus('unauthenticated');
    window.dispatchEvent(new CustomEvent('demo-session-updated'));
  };

  const updateUser = (updates: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...updates };
      sessionStorage.setItem('user', JSON.stringify(next));
      return next;
    });
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isDemo,
    isLoading,
    authStatus,
    login,
    register,
    logout,
    refreshUser,
    triggerDemoLogin,
    clearDemoSession,
    updateUser,
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
