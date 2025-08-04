const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://18.217.206.5:3001';

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

export interface KPI {
  id: string;
  name: string;
  definition: string;
  sqlQuery: string;
  topic: string;
  dataSpecialist: string;
  businessSpecialist: string;
  dashboardPreview?: string;
  lastUpdated: string;
  status: 'active' | 'draft' | 'archived';
  versions: KPIVersion[];
}

export interface KPIVersion {
  id: string;
  version: number;
  definition: string;
  sqlQuery: string;
  updatedBy: string;
  updatedAt: string;
  changes: string;
}

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
  async createKPI(kpiData: Omit<KPI, 'id' | 'lastUpdated' | 'versions'>): Promise<{ id: string; message: string }> {
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
  async updateKPI(id: string, kpiData: Partial<KPI>): Promise<{ message: string }> {
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
};