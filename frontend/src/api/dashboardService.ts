/**
 * Dashboard Service
 * Handles dashboard statistics and analytics API calls
 */

import apiClient from './client';
import { getDemoSession } from '@/lib/demoSession';

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
  const demoSession = getDemoSession();
  if (demoSession?.isDemo) {
    const inbox = demoSession.inboxFiles || [];
    const outbox = demoSession.outboxFiles || [];
    const files = [...inbox, ...outbox];
    const total = files.length;
    const storageUsedMb = Number((files.reduce((sum: number, f: any) => sum + (f.file_size || 0), 0) / (1024 * 1024)).toFixed(2));
    const activeFiles = files.filter((f: any) => f.status === 'active').length;
    const expiredFiles = files.filter((f: any) => f.status === 'expired').length;
    const sensitiveFiles = files.filter((f: any) => f.encryption_type === 'AES-256' || f.self_destruct).length;

    const aes128 = files.filter((f: any) => f.encryption_type === 'AES-128').length;
    const aes256 = files.filter((f: any) => f.encryption_type === 'AES-256').length;
    const pct = (count: number) => (total ? Math.round((count / total) * 100) : 0);

    const fileTypeCounts: Record<string, number> = {};
    for (const file of files) {
      const ext = ((file.original_filename || '').split('.').pop() || 'other').toUpperCase();
      fileTypeCounts[ext] = (fileTypeCounts[ext] || 0) + 1;
    }

    return {
      stats: {
        files_sent: outbox.length,
        files_received: inbox.length,
        sensitive_files: sensitiveFiles,
        storage_used_mb: storageUsedMb,
        storage_limit_mb: 10240,
        total_files: total,
        active_files: activeFiles,
        expired_files: expiredFiles,
      },
      recent_activity: demoSession.dashboard?.recent_activity || [],
      encryption_breakdown: [
        { type: 'AES-128', count: aes128, percentage: pct(aes128) },
        { type: 'AES-256', count: aes256, percentage: pct(aes256) },
      ],
      file_type_distribution: Object.entries(fileTypeCounts).map(([type, count]) => ({
        type,
        count,
        percentage: pct(count),
      })),
    };
  }

  const response = await apiClient.get<DashboardData>('/users/dashboard');
  return response.data;
};

/**
 * Get quick statistics only
 */
const getStats = async (): Promise<DashboardStats> => {
  const demoSession = getDemoSession();
  if (demoSession?.isDemo) {
    const data = await getDashboardData();
    return data.stats;
  }

  const response = await apiClient.get<DashboardStats>('/users/stats');
  return response.data;
};

export const dashboardService = {
  getDashboardData,
  getStats,
};
