import apiClient from './client';

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
  const response = await apiClient.get('/recipients/');
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
}): Promise<any> => {
  const response = await apiClient.post('/recipients/', contactData);
  return response.data;
};

/**
 * Delete a recipient from contacts
 */
export const deleteContact = async (contactId: string): Promise<any> => {
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
