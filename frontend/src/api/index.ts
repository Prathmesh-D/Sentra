/**
 * API Services Index
 * Central export for all API services
 */

export { authService } from './authService';
export { encryptionService } from './encryptionService';
export { filesService } from './filesService';
export { userService } from './userService';
export { dashboardService } from './dashboardService';
export { default as contactsService } from './contactsService';

export type { User, LoginRequest, RegisterRequest, AuthResponse } from './authService';
export type { EncryptFileRequest, EncryptFileResponse } from './encryptionService';
export type { EncryptedFile, FileListResponse } from './filesService';
export type { UpdateProfileRequest, UserKeys, ActivityLog } from './userService';
export type { DashboardStats, DashboardData, RecentActivity, EncryptionBreakdown, FileTypeBreakdown } from './dashboardService';
export type { Contact, ContactsResponse } from './contactsService';
