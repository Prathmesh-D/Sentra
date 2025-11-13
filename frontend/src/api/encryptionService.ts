/**
 * Encryption Service
 * Handles file encryption and decryption operations
 */
import apiClient, { createFormData } from './client';

export interface EncryptFileRequest {
  file: File;
  recipients: string[];
  encryption_type: 'AES-128' | 'AES-256';
  expiry_days: number;
  compress?: boolean;
  self_destruct?: boolean;
  message?: string;
  processing_mode?: 'ai' | 'manual';
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

export interface AnalyzeFileResponse {
  sensitivity_score: number;
  tags: string[];
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  recommendations: Record<string, any>;
}

class EncryptionService {
  /**
   * Encrypt a file
   */
  async encryptFile(data: EncryptFileRequest): Promise<EncryptFileResponse> {
    const formData = createFormData({
      file: data.file,
      recipients: data.recipients,
      encryption_type: data.encryption_type,
      expiry_days: data.expiry_days.toString(),
      compress: data.compress ? 'true' : 'false',
      self_destruct: data.self_destruct ? 'true' : 'false',
      message: data.message || '',
      processing_mode: data.processing_mode || 'ai',
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
    const response = await apiClient.post(
      `/encrypt/decrypt/${fileId}`,
      {},
      {
        responseType: 'blob',
        timeout: 60000, // 60 seconds for large files
      }
    );

    return response.data;
  }

  /**
   * Download decrypted file
   */
  async downloadDecryptedFile(fileId: string, filename: string): Promise<void> {
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

  /**
   * Analyze file sensitivity (AI analysis)
   */
  async analyzeFile(file: File): Promise<AnalyzeFileResponse> {
    const formData = createFormData({ file });

    const response = await apiClient.post<AnalyzeFileResponse>(
      '/encrypt/analyze',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    return response.data;
  }
}

// Export singleton instance
export const encryptionService = new EncryptionService();
