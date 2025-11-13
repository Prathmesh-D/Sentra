/**
 * User Service
 * Handles user profile and settings operations
 */
import apiClient from './client';
import type { User } from './authService';

export interface UpdateProfileRequest {
  full_name?: string;
  email?: string;
  bio?: string;
}

export interface UserKeys {
  public_key: string;
  private_key: string;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  action: string;
  details: string;
  timestamp: string;
  ip_address?: string;
}

export interface ActivityResponse {
  activities: ActivityLog[];
  total: number;
}

class UserService {
  /**
   * Get user profile
   */
  async getProfile(): Promise<User> {
    const response = await apiClient.get<User>('/users/profile');
    return response.data;
  }

  /**
   * Update user profile
   */
  async updateProfile(data: UpdateProfileRequest): Promise<User> {
    const response = await apiClient.put<User>('/users/profile', data);
    
    // Update stored user info
    localStorage.setItem('user', JSON.stringify(response.data));
    
    return response.data;
  }

  /**
   * Get user's RSA keys
   */
  async getKeys(): Promise<UserKeys> {
    const response = await apiClient.get<UserKeys>('/users/keys');
    return response.data;
  }

  /**
   * Regenerate user's RSA keys
   */
  async regenerateKeys(): Promise<UserKeys> {
    const response = await apiClient.post<UserKeys>('/users/keys/regenerate');
    return response.data;
  }

  /**
   * Get user activity log
   */
  async getActivity(limit: number = 50): Promise<ActivityResponse> {
    const response = await apiClient.get<ActivityResponse>('/users/activity', {
      params: { limit },
    });
    return response.data;
  }
}

// Export singleton instance
export const userService = new UserService();
