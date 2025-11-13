/**
 * Dashboard Service
 * Handles dashboard statistics and analytics API calls
 */

import apiClient from './client';

export interface DashboardStats {
  files_sent: number;
  files_received: number;
  sensitive_files: number;
  storage_used_mb: number;
  storage_limit_mb: number;
  total_files: number;
  active_files: number;
  expired_files: number;
}

export interface RecentActivity {
  id: string;
  action: 'encrypted' | 'decrypted' | 'shared' | 'downloaded' | 'deleted';
  file_name: string;
  timestamp: string;
  user?: string;
  status: 'success' | 'warning' | 'error';
}

export interface EncryptionBreakdown {
  type: string;
  count: number;
  percentage: number;
}

export interface FileTypeBreakdown {
  type: string;
  count: number;
  percentage: number;
}

export interface DashboardData {
  stats: DashboardStats;
  recent_activity: RecentActivity[];
  encryption_breakdown: EncryptionBreakdown[];
  file_type_distribution: FileTypeBreakdown[];
}

/**
 * Get dashboard statistics and recent activity
 */
const getDashboardData = async (): Promise<DashboardData> => {
  const response = await apiClient.get<DashboardData>('/users/dashboard');
  return response.data;
};

/**
 * Get quick statistics only
 */
const getStats = async (): Promise<DashboardStats> => {
  const response = await apiClient.get<DashboardStats>('/users/stats');
  return response.data;
};

export const dashboardService = {
  getDashboardData,
  getStats,
};
