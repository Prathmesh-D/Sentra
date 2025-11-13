/**
 * API Client Configuration
 * Base HTTP client with axios for making requests to Flask backend
 */
import axios, { AxiosError } from 'axios';
import type { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import toast from 'react-hot-toast';

// Base API URL - Flask backend
const API_BASE_URL = 'http://127.0.0.1:5000/api';

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds for file uploads
  headers: {
    'Content-Type': 'application/json',
  },
});

// Health check function
export const checkBackendHealth = async (): Promise<boolean> => {
  try {
    console.log('🔍 Checking backend health at http://127.0.0.1:5000/api/health');
    const response = await axios.get('http://127.0.0.1:5000/api/health', {
      timeout: 5000, // 5 second timeout for health check
    });
    console.log('✅ Backend health response:', response.status, response.data);
    return response.status === 200;
  } catch (error: any) {
    console.log('❌ Backend health check failed:', error.message);
    if (error.code) {
      console.log('Error code:', error.code);
    }
    return false;
  }
};

// Request interceptor - Add JWT token to requests
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('access_token');
    
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors globally
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError<any>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Handle 401 Unauthorized
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // Try to refresh token
      const refreshToken = localStorage.getItem('refresh_token');
      
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {}, {
            headers: {
              Authorization: `Bearer ${refreshToken}`,
            },
          });

          const { access_token } = response.data;
          localStorage.setItem('access_token', access_token);

          // Retry original request with new token
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${access_token}`;
          }
          return apiClient(originalRequest);
        } catch (refreshError) {
          // Refresh failed, logout user
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user');
          
          toast.error('Session expired. Please login again.');
          window.location.href = '/login';
          
          return Promise.reject(refreshError);
        }
      } else {
        // No refresh token, logout
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        
        toast.error('Please login to continue');
        window.location.href = '/login';
      }
    }

    // Handle other errors
    if (error.response) {
      // Server responded with error
      const message = error.response.data?.error || error.response.data?.message || 'An error occurred';
      
      // Don't show toast for certain errors (let components handle them)
      if (error.response.status !== 401 && error.response.status !== 404) {
        toast.error(message);
      }
    } else if (error.request) {
      // Request made but no response
      toast.error('Network error. Please check your connection.');
    } else {
      // Something else happened
      toast.error('An unexpected error occurred');
    }

    return Promise.reject(error);
  }
);

// Helper function for multipart form data
export const createFormData = (data: Record<string, any>): FormData => {
  const formData = new FormData();
  
  Object.keys(data).forEach((key) => {
    const value = data[key];
    
    if (value instanceof File) {
      formData.append(key, value);
    } else if (Array.isArray(value) || typeof value === 'object') {
      formData.append(key, JSON.stringify(value));
    } else {
      formData.append(key, String(value));
    }
  });
  
  return formData;
};

export default apiClient;
