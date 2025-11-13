/**
 * Authentication Service
 * Handles user authentication operations
 */
import apiClient from './client';

export interface User {
  id: string;
  username: string;
  email: string;
  full_name?: string;
  bio?: string;
  avatar_url?: string;
  created_at: string;
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
  access_token: string;
  refresh_token: string;
  user: User;
}

class AuthService {
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
    const refreshToken = localStorage.getItem('refresh_token');
    
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await apiClient.post<{ access_token: string }>(
      '/auth/refresh',
      {},
      {
        headers: {
          Authorization: `Bearer ${refreshToken}`,
        },
      }
    );

    const { access_token } = response.data;
    localStorage.setItem('access_token', access_token);

    return access_token;
  }

  /**
   * Get current user
   */
  async getCurrentUser(): Promise<User> {
    const response = await apiClient.get<User>('/auth/me');
    
    // Update stored user info
    localStorage.setItem('user', JSON.stringify(response.data));
    
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
    const token = localStorage.getItem('access_token');
    return !!token;
  }

  /**
   * Get stored user
   */
  getStoredUser(): User | null {
    const userStr = localStorage.getItem('user');
    
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
    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('refresh_token', data.refresh_token);
    localStorage.setItem('user', JSON.stringify(data.user));
  }

  /**
   * Clear authentication data
   */
  private clearAuthData(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
  }
}

// Export singleton instance
export const authService = new AuthService();
