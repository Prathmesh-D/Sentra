/**
 * Authentication Service
 * Handles user authentication operations
 */
import apiClient from './client';
import { clearInMemoryAuthTokens, setInMemoryAuthTokens } from './client';

export interface User {
  id: string;
  username: string;
  email: string;
  full_name?: string;
  bio?: string;
  avatar_url?: string;
  is_public?: boolean;
  password_changed_at?: string;
  created_at: string;
  preferences?: {
    density?: 'compact' | 'comfortable' | 'spacious' | string;
    language?: string;
    fontScale?: 'small' | 'default' | 'large' | string;
    reduceMotion?: boolean;
    statusBadgeStyle?: 'filled' | 'outline' | 'minimal' | string;
    rowStriping?: boolean;
  };
  security?: {
    loginNotifications?: boolean;
    autoLockTimeout?: '5m' | '15m' | '30m' | 'never' | string;
    sessionTimeout?: '1h' | '8h' | '24h' | 'never';
  };
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  full_name?: string;
}

export interface AuthResponse {
  access_token?: string;
  refresh_token?: string;
  user: User;
}

class AuthService {
  private getStorage(): Storage | null {
    if (typeof window === 'undefined') {
      return null;
    }
    return window.sessionStorage;
  }

  private getItem(key: string): string | null {
    return this.getStorage()?.getItem(key) ?? null;
  }

  private setItem(key: string, value: string): void {
    this.getStorage()?.setItem(key, value);
  }

  private removeItem(key: string): void {
    this.getStorage()?.removeItem(key);
  }

  /**
   * Register a new user
   */
  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/register', data);
    
    // Store tokens and user info
    this.storeAuthData(response.data);
    
    return response.data;
  }

  /**
   * Login user
   */
  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/login', data);
    
    // Store tokens and user info
    this.storeAuthData(response.data);
    
    return response.data;
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } catch (error) {
      // Even if API call fails, clear local storage
      console.error('Logout API call failed:', error);
    } finally {
      this.clearAuthData();
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(): Promise<string> {
    const response = await apiClient.post<{ access_token?: string }>('/auth/refresh', {});
    setInMemoryAuthTokens({ accessToken: response.data.access_token });
    return response.data.access_token ?? '';
  }

  /**
   * Get current user
   */
  async getCurrentUser(): Promise<User> {
    const response = await apiClient.get<User>('/auth/me');
    
    // Update stored user info
    this.setItem('user', JSON.stringify(response.data));
    
    return response.data;
  }

  /**
   * Change password
   */
  async changePassword(oldPassword: string, newPassword: string): Promise<void> {
    await apiClient.post('/auth/change-password', {
      old_password: oldPassword,
      new_password: newPassword,
    });
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.getStoredUser();
  }

  /**
   * Get stored user
   */
  getStoredUser(): User | null {
    const userStr = this.getItem('user');
    
    if (!userStr) {
      return null;
    }

    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }

  /**
   * Store authentication data
   */
  private storeAuthData(data: AuthResponse): void {
    setInMemoryAuthTokens({
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
    });
    this.setItem('user', JSON.stringify(data.user));
  }

  /**
   * Clear authentication data
   */
  private clearAuthData(): void {
    clearInMemoryAuthTokens();
    this.removeItem('user');
  }

  clearStoredAuth(): void {
    this.clearAuthData();
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('user');
    }
  }
}

// Export singleton instance
export const authService = new AuthService();
