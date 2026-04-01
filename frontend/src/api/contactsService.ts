import apiClient from './client';
import { getDemoSession, updateDemoSession } from '@/lib/demoSession';

export interface Contact {
  _id: string;
  owner_username: string;
  contact_username: string;
  contact_email: string;
  contact_full_name: string;
  nickname?: string;
  notes?: string;
  tags?: string[];
  is_favorite: boolean;
  shared_files_count: number;
  last_shared_at?: string;
  added_at: string;
  updated_at: string;
}

export interface ContactsResponse {
  contacts: Contact[];
  total: number;
}

/**
 * Get all saved contacts for the current user
 */
export const getContacts = async (): Promise<ContactsResponse> => {
  const demoSession = getDemoSession();
  if (demoSession?.isDemo) {
    const contacts = demoSession.contacts || [];
    return { contacts, total: contacts.length };
  }

  const response = await apiClient.get('/recipients');
  return response.data;
};

/**
 * Search for users by username or email
 */
export const searchUsers = async (query: string): Promise<any> => {
  const response = await apiClient.get(`/recipients/search?q=${encodeURIComponent(query)}`);
  return response.data;
};

/**
 * Add a new recipient to contacts
 */
export const addContact = async (contactData: {
  name: string;
  email: string;
  nickname?: string;
  public_key?: string;
}): Promise<any> => {
  const demoSession = getDemoSession();
  if (demoSession?.isDemo) {
    const contact = {
      _id: `contact-demo-${Date.now()}`,
      owner_username: demoSession.user?.username || 'demo-user',
      contact_username: contactData.nickname || contactData.email.split('@')[0],
      contact_email: contactData.email,
      contact_full_name: contactData.name,
      nickname: contactData.nickname,
      notes: '',
      tags: [],
      is_favorite: false,
      shared_files_count: 0,
      last_shared_at: undefined,
      added_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    updateDemoSession((current) => ({
      ...current,
      contacts: [contact, ...(current.contacts || [])],
    }));
    return { success: true, contact };
  }

  const response = await apiClient.post('/recipients', contactData);
  return response.data;
};

/**
 * Delete a recipient from contacts
 */
export const deleteContact = async (contactId: string): Promise<any> => {
  const demoSession = getDemoSession();
  if (demoSession?.isDemo) {
    updateDemoSession((current) => ({
      ...current,
      contacts: (current.contacts || []).filter((c: Contact) => c._id !== contactId),
    }));
    return { success: true };
  }

  const response = await apiClient.delete(`/recipients/${contactId}`);
  return response.data;
};

const contactsService = {
  getContacts,
  searchUsers,
  addContact,
  deleteContact,
};

export default contactsService;
