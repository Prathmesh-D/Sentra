/**
 * Encryption Service
 * Handles file encryption and decryption operations
 */
import apiClient, { createFormData } from './client';
import { getDemoSession, updateDemoSession } from '@/lib/demoSession';

export interface EncryptFileRequest {
  file: File;
  recipients: string[];
  encryption_type: 'AES-128' | 'AES-256';
  expiry_days: number;
  self_destruct?: boolean;
  message?: string;
  processing_mode?: 'auto' | 'manual';
  tag?: string;
}

export interface EncryptFileResponse {
  success: boolean;
  message: string;
  file_id: string;
  filename: string;
  encrypted_filename: string;
  recipients: string[];
  encryption_type: string;
  expires_at: string;
}

class EncryptionService {
  /**
   * Encrypt a file
   */
  async encryptFile(data: EncryptFileRequest): Promise<EncryptFileResponse> {
    const demoSession = getDemoSession();
    if (demoSession?.isDemo) {
      const fileId = `demo-file-${Date.now()}`;
      const expiresAt = new Date(Date.now() + data.expiry_days * 24 * 60 * 60 * 1000).toISOString();

      updateDemoSession((current) => ({
        ...current,
        outboxFiles: [
          {
            id: fileId,
            original_filename: data.file.name,
            encrypted_filename: `${data.file.name}.enc`,
            sender: current.user?.username || 'demo-user',
            recipients: data.recipients,
            encryption_type: data.encryption_type,
            file_size: data.file.size,
            created_at: new Date().toISOString(),
            expires_at: expiresAt,
            download_count: 0,
            self_destruct: !!data.self_destruct,
            message: data.message,
            status: 'active',
          },
          ...(current.outboxFiles || []),
        ],
      }));

      return {
        success: true,
        message: 'Demo encryption complete',
        file_id: fileId,
        filename: data.file.name,
        encrypted_filename: `${data.file.name}.enc`,
        recipients: data.recipients,
        encryption_type: data.encryption_type,
        expires_at: expiresAt,
      };
    }

    console.log('[encrypt] request', {
      recipients: data.recipients,
      recipientsCount: data.recipients?.length ?? 0,
      encryption_type: data.encryption_type,
      expiry_days: data.expiry_days,
      self_destruct: data.self_destruct,
      processing_mode: data.processing_mode,
      tag: data.tag,
    });

    const formData = createFormData({
      file: data.file,
      recipients: data.recipients,
      encryption_type: data.encryption_type,
      expiry_days: data.expiry_days.toString(),
      self_destruct: data.self_destruct ? 'true' : 'false',
      message: data.message || '',
      processing_mode: data.processing_mode || 'auto',
      tag: data.tag || '',
    });

    const response = await apiClient.post<EncryptFileResponse>(
      '/encrypt/encrypt',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        // Longer timeout for file uploads
        timeout: 60000, // 60 seconds
      }
    );

    return response.data;
  }

  /**
   * Decrypt a file
   */
  async decryptFile(fileId: string): Promise<Blob> {
    const demoSession = getDemoSession();
    if (demoSession?.isDemo) {
      const file = (demoSession.inboxFiles || []).find((f: any) => f.id === fileId);
      const fileName = file?.original_filename || 'demo-file.txt';
      const text = `Demo decrypted content for ${fileName}\n\nThis file is generated in Demo Mode and no backend call was made.`;
      return new Blob([text], { type: 'text/plain' });
    }

    try {
      const response = await apiClient.post(
        `/encrypt/decrypt/${fileId}`,
        {},
        {
          responseType: 'blob',
          timeout: 60000, // 60 seconds for large files
        }
      );

      return response.data;
    } catch (error: any) {
      // When responseType is 'blob', error responses are also Blobs — parse them back to JSON
      if (error.response?.data instanceof Blob) {
        try {
          const text = await error.response.data.text();
          const json = JSON.parse(text);
          error.response.data = json;
        } catch {
          // couldn't parse, leave as-is
        }
      }
      throw error;
    }
  }

  /**
   * Download decrypted file
   */
  async downloadDecryptedFile(fileId: string, filename: string): Promise<void> {
    const demoSession = getDemoSession();
    if (demoSession?.isDemo) {
      updateDemoSession((current) => ({
        ...current,
        inboxFiles: (current.inboxFiles || []).map((file: any) =>
          file.id === fileId
            ? { ...file, download_count: Math.max(1, (file.download_count || 0) + 1) }
            : file
        ),
      }));
    }

    try {
      const blob = await this.decryptFile(fileId);

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      throw error;
    }
  }

}

// Export singleton instance
export const encryptionService = new EncryptionService();
