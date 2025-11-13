/**
 * Files Service
 * Handles file listing and management operations
 */
import apiClient from './client';

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
    const response = await apiClient.get<FileListResponse>('/files/inbox');
    return response.data;
  }

  /**
   * Get outbox files (sent files)
   */
  async getOutbox(): Promise<FileListResponse> {
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
    await apiClient.delete(`/files/${fileId}`);
  }

  /**
   * Extend file expiry
   */
  async extendExpiry(fileId: string, days: number): Promise<{ new_expiry: string }> {
    const response = await apiClient.post(`/files/${fileId}/extend`, { days });
    return response.data;
  }

  /**
   * Share a file with additional recipients
   */
  async shareFile(fileId: string, recipients: string[]): Promise<void> {
    await apiClient.post(`/files/${fileId}/share`, { recipients });
  }
}

// Export singleton instance
export const filesService = new FilesService();
