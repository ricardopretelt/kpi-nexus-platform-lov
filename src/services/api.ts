import { User } from '../contexts/AuthContext';
import { KPI, KPIBlock } from '../types/kpi';

const API_BASE_URL = (() => {
  console.log('🔍 Environment check:');
  console.log('- window.location.hostname:', window?.location?.hostname);
  
  // Auto-detect based on how the frontend is accessed
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    
    // If accessing via localhost, use localhost backend
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      console.log('Using localhost backend');
      return 'http://localhost:3001';
    }
    
    // If accessing via server IP, use server backend  
    if (hostname === '18.217.206.5') {
      console.log('Using server backend');
      return 'http://18.217.206.5:3001';
    }
  }
  
  // Default fallback
  console.log('Using default localhost');
  return 'http://localhost:3001';
})();

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken');
  console.log(' Debugging API call:');
  console.log('  - API_BASE_URL:', API_BASE_URL);
  console.log('  - Token exists:', !!token);
  console.log('  - Token length:', token ? token.length : 0);
  console.log('  - Token preview:', token ? token.substring(0, 20) + '...' : 'None');
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
  
  console.log('  - Final headers:', headers);
  return headers;
};

export interface Topic {
  id: number;
  name: string;
  description: string;
  icon: string;
  color: string;
}

export const api = {
  // GET operations
  async getKPIs(): Promise<KPI[]> {
    console.log('🚀 Fetching KPIs...');
    const url = `${API_BASE_URL}/api/kpis`;
    console.log('  - URL:', url);
    
    const headers = getAuthHeaders();
    
    try {
      const response = await fetch(url, { headers });
      
      console.log('  - Response status:', response.status);
      console.log('  - Response ok:', response.ok);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('  - Error response:', errorText);
        throw new Error(`Failed to fetch KPIs: ${response.status} ${errorText}`);
      }
      
      const data = await response.json();
      console.log('  - Success! KPIs count:', data.length);
      return data;
    } catch (error) {
      console.error('  - Fetch error:', error);
      throw error;
    }
  },

  // Add new method to get a single KPI by ID
  async getKPI(id: string): Promise<KPI> {
    console.log('🚀 Fetching KPI...');
    const url = `${API_BASE_URL}/api/kpis/${id}`;
    console.log('  - URL:', url);
    
    const headers = getAuthHeaders();
    
    try {
      const response = await fetch(url, { headers });
      
      console.log('  - Response status:', response.status);
      console.log('  - Response ok:', response.ok);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('  - Error response:', errorText);
        throw new Error(`Failed to fetch KPI: ${response.status} ${errorText}`);
      }
      
      const data = await response.json();
      console.log('  - Success! KPI fetched');
      return data;
    } catch (error) {
      console.error('  - Fetch error:', error);
      throw error;
    }
  },

  async getTopics(): Promise<Topic[]> {
    console.log(' Fetching Topics...');
    const url = `${API_BASE_URL}/api/topics`;
    console.log('  - URL:', url);
    
    const headers = getAuthHeaders();
    
    try {
      const response = await fetch(url, { headers });
      
      console.log('  - Response status:', response.status);
      console.log('  - Response ok:', response.ok);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('  - Error response:', errorText);
        throw new Error(`Failed to fetch topics: ${response.status} ${errorText}`);
      }
      
      const data = await response.json();
      console.log('  - Success! Topics count:', data.length);
      return data;
    } catch (error) {
      console.error('  - Fetch error:', error);
      throw error;
    }
  },

  async getUsers() {
    const response = await fetch(`${API_BASE_URL}/api/users`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) {
      throw new Error('Failed to fetch users');
    }
    return response.json();
  },

  // POST operations (create)
  async createKPI(kpiData: Omit<KPI, 'id' | 'lastUpdated' | 'versions'> & { changeDescription?: string }): Promise<{ id: string; message: string }> {
    const response = await fetch(`${API_BASE_URL}/api/kpis`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(kpiData),
    });
    if (!response.ok) {
      throw new Error('Failed to create KPI');
    }
    return response.json();
  },

  async createTopic(topicData: Omit<Topic, 'id'>): Promise<Topic> {
    const response = await fetch(`${API_BASE_URL}/api/topics`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(topicData),
    });
    if (!response.ok) {
      throw new Error('Failed to create topic');
    }
    return response.json();
  },

  // PUT operations (update)
  async updateKPI(id: string, kpiData: Partial<KPI> & { changeDescription?: string }): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/api/kpis/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(kpiData),
    });
    if (!response.ok) {
      throw new Error('Failed to update KPI');
    }
    return response.json();
  },

  // DELETE operations
  async deleteKPI(id: string): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/api/kpis/${id}`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) {
      throw new Error('Failed to delete KPI');
    }
    return response.json();
  },

  async updateUser(id: string, userData: Partial<User>): Promise<{ message: string }> {
    console.log('🚀 Updating user...');
    const url = `${API_BASE_URL}/api/users/${id}`;
    console.log('  - URL:', url);
    
    const headers = getAuthHeaders();
    
    try {
      const response = await fetch(url, {
        method: 'PUT',
        headers,
        body: JSON.stringify(userData),
      });
      
      console.log('  - Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('  - Error response:', errorText);
        throw new Error(`Failed to update user: ${response.status} ${errorText}`);
      }
      
      const data = await response.json();
      console.log('  - Success! User updated');
      return data;
    } catch (error) {
      console.error('  - Error:', error);
      throw error;
    }
  },
};