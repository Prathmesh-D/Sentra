import apiClient from './client';

export type SessionTimeout = '1h' | '8h' | '24h' | 'never';
export type AutoLockTimeout = '5m' | '15m' | '30m' | 'never';
export type DensityOption = 'comfortable' | 'compact' | 'spacious';
export type FontScaleOption = 'small' | 'default' | 'large';
export type StatusBadgeStyle = 'filled' | 'outline' | 'minimal';

export interface ProfilePayload {
  name: string;
  username: string;
  bio: string;
  avatarUrl?: string;
  isPublic: boolean;
}

export interface PasswordPayload {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

export interface EmailRequestPayload {
  newEmail: string;
  currentPassword: string;
}

export interface PreferencesPayload {
  density?: DensityOption;
  language?: string;
  fontScale?: FontScaleOption;
  reduceMotion?: boolean;
  statusBadgeStyle?: StatusBadgeStyle;
  rowStriping?: boolean;
}

export interface SecurityPayload {
  autoLockTimeout?: AutoLockTimeout;
  sessionTimeout?: SessionTimeout;
}

export interface SessionInfo {
  id: string;
  device: string;
  browser: string;
  os: string;
  deviceType: 'desktop' | 'mobile' | 'tablet' | string;
  ip: string;
  location: string;
  lastActive: string;
  isCurrent: boolean;
}

export interface UsernameAvailabilityResponse {
  available: boolean;
  unchanged?: boolean;
}

export interface UploadAvatarPayload {
  avatarBase64: string;
  mimeType: string;
}

export interface LastLoginResponse {
  timestamp?: string | null;
  device?: string;
  browser?: string;
  location?: string | null;
}

class SettingsService {
  async getProfile() {
    const response = await apiClient.get('/user/profile');
    return response.data;
  }

  async updateProfile(payload: ProfilePayload) {
    const response = await apiClient.put('/user/profile', payload);
    return response.data;
  }

  async checkUsernameAvailability(username: string): Promise<UsernameAvailabilityResponse> {
    const response = await apiClient.get('/user/username/check', {
      params: { username },
    });
    return response.data;
  }

  async uploadAvatar(payload: UploadAvatarPayload): Promise<{ success: boolean; avatarUrl: string }> {
    const response = await apiClient.post('/user/avatar', payload);
    return response.data;
  }

  async deleteAvatar(): Promise<{ success: boolean }> {
    const response = await apiClient.delete('/user/avatar');
    return response.data;
  }

  async updatePassword(payload: PasswordPayload) {
    const response = await apiClient.put('/user/password', payload);
    return response.data;
  }

  async requestEmailChange(payload: EmailRequestPayload) {
    const response = await apiClient.post('/user/email/request', payload);
    return response.data;
  }

  async cancelEmailChange() {
    const response = await apiClient.post('/user/email/cancel');
    return response.data;
  }

  async confirmEmailChange(token: string) {
    const response = await apiClient.post('/user/email/confirm', { token });
    return response.data;
  }

  async updatePreferences(payload: PreferencesPayload) {
    const response = await apiClient.put('/user/preferences', payload);
    return response.data;
  }

  async updateSecurity(payload: SecurityPayload) {
    const response = await apiClient.put('/user/security', payload);
    return response.data;
  }

  async getLastLogin(): Promise<LastLoginResponse> {
    const response = await apiClient.get('/user/last-login');
    return response.data;
  }

  async getSessions(): Promise<{ sessions: SessionInfo[] }> {
    const response = await apiClient.get('/user/sessions');
    return response.data;
  }

  async revokeSession(sessionId: string) {
    const response = await apiClient.delete(`/user/sessions/${sessionId}`);
    return response.data;
  }

  async revokeAllOtherSessions() {
    const response = await apiClient.delete('/user/sessions');
    return response.data;
  }

  async logoutAllDevices() {
    const response = await apiClient.post('/user/logout-all');
    return response.data;
  }

  async deleteAccount(password: string, confirmPhrase: string) {
    const response = await apiClient.delete('/user/account', {
      data: { password, confirmPhrase },
    });
    return response.data;
  }
}

export const settingsService = new SettingsService();
