/**
 * API Client Configuration
 * Base HTTP client with axios for making requests to Flask backend
 */
import axios, { AxiosError } from 'axios';
import type { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import toast from 'react-hot-toast';

const API_OVERRIDE_STORAGE_KEY = 'sentra_api_url_override';
const localDesktopApiBase = 'http://127.0.0.1:5000/api';

const normalizeApiBase = (value?: string | null): string | null => {
  const trimmed = value?.trim();
  if (!trimmed) {
    return null;
  }

  try {
    const parsed = new URL(trimmed);
    if (!/^https?:$/i.test(parsed.protocol)) {
      return null;
    }
    return trimmed.replace(/\/+$/, '');
  } catch {
    return null;
  }
};

const readApiOverride = (): string | null => {
  if (typeof window === 'undefined') {
    return null;
  }
  return normalizeApiBase(window.localStorage.getItem(API_OVERRIDE_STORAGE_KEY));
};

const configuredApiBase = normalizeApiBase(import.meta.env.VITE_API_URL);
const overrideApiBase = readApiOverride();
const useFallbackApiBase = !configuredApiBase || /placeholder\.invalid/i.test(configuredApiBase);
const API_BASE_URL = (overrideApiBase ?? (useFallbackApiBase ? localDesktopApiBase : configuredApiBase)).replace(/\/+$/, '');

export const getApiBaseUrl = (): string => API_BASE_URL;

export const setApiBaseUrlOverride = (nextBaseUrl: string): string => {
  const normalized = normalizeApiBase(nextBaseUrl);
  if (!normalized) {
    throw new Error('Please enter a valid http(s) backend URL.');
  }
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(API_OVERRIDE_STORAGE_KEY, normalized);
  }
  return normalized;
};

export const clearApiBaseUrlOverride = (): void => {
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(API_OVERRIDE_STORAGE_KEY);
  }
};

let inMemoryAccessToken: string | null = null;
let inMemoryRefreshToken: string | null = null;
let authExpiredNotificationActive = false;
const debugLog = (...args: unknown[]) => {
  if (import.meta.env.DEV) {
    console.log(...args);
  }
};

export const setInMemoryAuthTokens = (tokens: { accessToken?: string; refreshToken?: string }): void => {
  if (typeof tokens.accessToken === 'string') {
    inMemoryAccessToken = tokens.accessToken || null;
  }
  if (typeof tokens.refreshToken === 'string') {
    inMemoryRefreshToken = tokens.refreshToken || null;
  }
};

export const clearInMemoryAuthTokens = (): void => {
  inMemoryAccessToken = null;
  inMemoryRefreshToken = null;
};

const signalAuthExpiredOnce = (): void => {
  if (authExpiredNotificationActive) {
    return;
  }
  authExpiredNotificationActive = true;
  sessionStorage.removeItem('user');
  toast.error('Session expired. Please login again.');
  window.dispatchEvent(new Event('auth-expired'));
  setTimeout(() => {
    authExpiredNotificationActive = false;
  }, 2000);
};

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds for file uploads
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - attach volatile access token fallback for non-cookie runtimes.
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (inMemoryAccessToken && config.headers && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${inMemoryAccessToken}`;
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

// Health check function
export const checkBackendHealth = async (): Promise<boolean> => {
  try {
    debugLog('Checking backend health at', `${API_BASE_URL}/health`);
    const response = await axios.get(`${API_BASE_URL}/health`, {
      timeout: 5000, // 5 second timeout for health check
    });
    debugLog('Backend health response:', response.status, response.data);
    return response.status === 200;
  } catch (error: any) {
    debugLog('Backend health check failed:', error.message);
    if (error.code) {
      debugLog('Error code:', error.code);
    }
    return false;
  }
};

// Response interceptor - Handle errors globally
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError<any>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    const requestUrl = originalRequest?.url || '';
    const isAuthRequest = requestUrl.includes('/auth/login') || requestUrl.includes('/auth/register');

    if (error.response?.status === 401 && isAuthRequest) {
      return Promise.reject(error);
    }

    // Handle 401 Unauthorized
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshHeaders = inMemoryRefreshToken
          ? { Authorization: `Bearer ${inMemoryRefreshToken}` }
          : undefined;

        const refreshResponse = await axios.post<{ access_token?: string; refresh_token?: string }>(
          `${API_BASE_URL}/auth/refresh`,
          {},
          { withCredentials: true, headers: refreshHeaders }
        );

        setInMemoryAuthTokens({
          accessToken: refreshResponse.data?.access_token,
          refreshToken: refreshResponse.data?.refresh_token,
        });

        if (inMemoryAccessToken && originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${inMemoryAccessToken}`;
        }
        return apiClient(originalRequest);
      } catch (refreshError) {
        clearInMemoryAuthTokens();
        signalAuthExpiredOnce();
        return Promise.reject(refreshError);
      }
    }

    // Handle other errors
    if (error.response) {
      // Server responded with error
      const message = error.response.data?.error || error.response.data?.message || 'An error occurred';

      if (error.response.status === 404 && isAuthRequest) {
        toast.error(`Auth endpoint not found at ${API_BASE_URL}. Update Backend URL in Connection Settings.`);
        return Promise.reject(error);
      }
      
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
