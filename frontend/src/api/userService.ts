/**
 * User Service
 * Handles user profile and settings operations
 */
import apiClient from './client';
import type { User } from './authService';
import { getDemoSession, updateDemoSession } from '@/lib/demoSession';

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
    const demoSession = getDemoSession();
    if (demoSession?.isDemo) {
      return demoSession.user as User;
    }

    const response = await apiClient.get<User>('/users/profile');
    return response.data;
  }

  /**
   * Update user profile
   */
  async updateProfile(data: UpdateProfileRequest): Promise<User> {
    const demoSession = getDemoSession();
    if (demoSession?.isDemo) {
      const next = updateDemoSession((current) => ({
        ...current,
        user: {
          ...current.user,
          full_name: data.full_name ?? current.user?.full_name,
          email: data.email ?? current.user?.email,
          bio: data.bio ?? current.user?.bio,
        },
      }));
      return (next?.user || demoSession.user) as User;
    }

    const response = await apiClient.put<User>('/users/profile', data);
    
    // Update stored user info
    sessionStorage.setItem('user', JSON.stringify(response.data));
    
    return response.data;
  }

  /**
   * Get user's RSA keys
   */
  async getKeys(): Promise<UserKeys> {
    const demoSession = getDemoSession();
    if (demoSession?.isDemo) {
      return {
        public_key: 'DEMO_PUBLIC_KEY_ABC123',
        private_key: 'DEMO_PRIVATE_KEY_DEF456',
        created_at: demoSession.createdAt,
      };
    }

    const response = await apiClient.get<UserKeys>('/users/keys');
    return response.data;
  }

  /**
   * Regenerate user's RSA keys
   */
  async regenerateKeys(): Promise<UserKeys> {
    const demoSession = getDemoSession();
    if (demoSession?.isDemo) {
      return {
        public_key: `DEMO_PUBLIC_KEY_${Date.now()}`,
        private_key: `DEMO_PRIVATE_KEY_${Date.now()}`,
        created_at: new Date().toISOString(),
      };
    }

    const response = await apiClient.post<UserKeys>('/users/keys/regenerate');
    return response.data;
  }

  /**
   * Get user activity log
   */
  async getActivity(limit: number = 50): Promise<ActivityResponse> {
    const demoSession = getDemoSession();
    if (demoSession?.isDemo) {
      const activities = (demoSession.dashboard?.recent_activity || []).slice(0, limit).map((a: any) => ({
        id: a.id,
        action: a.action,
        details: `${a.file_name} · ${a.status}`,
        timestamp: a.timestamp,
      }));
      return { activities, total: activities.length };
    }

    const response = await apiClient.get<ActivityResponse>('/users/activity', {
      params: { limit },
    });
    return response.data;
  }
}

// Export singleton instance
export const userService = new UserService();
