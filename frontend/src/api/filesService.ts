/**
 * Files Service
 * Handles file listing and management operations
 */
import apiClient from './client';
import { getDemoSession, updateDemoSession } from '@/lib/demoSession';

export interface EncryptedFile {
  id: string;
  original_filename: string;
  encrypted_filename: string;
  sender: string;
  recipients: string[];
  encryption_type: string;
  file_size: number;
  created_at: string;
  expires_at: string;
  download_count: number;
  self_destruct: boolean;
  message?: string;
  status: 'active' | 'deleted' | 'expired';
}

export interface FileListResponse {
  files: EncryptedFile[];
  total: number;
}

export interface FileDetailsResponse extends EncryptedFile {
  metadata: Record<string, any>;
}

class FilesService {
  /**
   * Get inbox files (received files)
   */
  async getInbox(): Promise<FileListResponse> {
    const demoSession = getDemoSession();
    if (demoSession?.isDemo) {
      const files = demoSession.inboxFiles || [];
      return { files, total: files.length };
    }

    const response = await apiClient.get<FileListResponse>('/files/inbox');
    return response.data;
  }

  /**
   * Get outbox files (sent files)
   */
  async getOutbox(): Promise<FileListResponse> {
    const demoSession = getDemoSession();
    if (demoSession?.isDemo) {
      const files = demoSession.outboxFiles || [];
      return { files, total: files.length };
    }

    const response = await apiClient.get<FileListResponse>('/files/outbox');
    return response.data;
  }

  /**
   * Get file details
   */
  async getFileDetails(fileId: string): Promise<FileDetailsResponse> {
    const response = await apiClient.get<FileDetailsResponse>(`/files/${fileId}`);
    return response.data;
  }

  /**
   * Delete a file
   */
  async deleteFile(fileId: string): Promise<void> {
    const demoSession = getDemoSession();
    if (demoSession?.isDemo) {
      updateDemoSession((current) => ({
        ...current,
        outboxFiles: (current.outboxFiles || []).filter((f: EncryptedFile) => f.id !== fileId),
        inboxFiles: (current.inboxFiles || []).filter((f: EncryptedFile) => f.id !== fileId),
      }));
      return;
    }

    await apiClient.delete(`/files/${fileId}`);
  }

  /**
   * Extend file expiry
   */
  async extendExpiry(fileId: string, days: number): Promise<{ new_expiry: string }> {
    const demoSession = getDemoSession();
    if (demoSession?.isDemo) {
      let nextExpiry = new Date().toISOString();
      updateDemoSession((current) => {
        const updated = (current.outboxFiles || []).map((file: EncryptedFile) => {
          if (file.id !== fileId) return file;
          const base = new Date(file.expires_at);
          const newDate = new Date(base.getTime() + days * 24 * 60 * 60 * 1000);
          nextExpiry = newDate.toISOString();
          return {
            ...file,
            expires_at: nextExpiry,
            status: newDate.getTime() < Date.now() ? 'expired' : 'active',
          };
        });
        return { ...current, outboxFiles: updated };
      });
      return { new_expiry: nextExpiry };
    }

    const response = await apiClient.post(`/files/${fileId}/extend`, { days });
    return response.data;
  }

  /**
   * Share a file with additional recipients
   */
  async shareFile(fileId: string, recipients: string[]): Promise<void> {
    const demoSession = getDemoSession();
    if (demoSession?.isDemo) {
      updateDemoSession((current) => ({
        ...current,
        outboxFiles: (current.outboxFiles || []).map((file: EncryptedFile) =>
          file.id === fileId
            ? { ...file, recipients: Array.from(new Set([...(file.recipients || []), ...recipients])) }
            : file
        ),
      }));
      return;
    }

    await apiClient.post(`/files/${fileId}/share`, { recipients });
  }
}

// Export singleton instance
export const filesService = new FilesService();
