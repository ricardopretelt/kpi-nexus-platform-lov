const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://3.16.147.136:3001';

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
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
    const response = await fetch(`${API_BASE_URL}/api/kpis`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) {
      throw new Error('Failed to fetch KPIs');
    }
    return response.json();
  },

  async getTopics(): Promise<Topic[]> {
    const response = await fetch(`${API_BASE_URL}/api/topics`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) {
      throw new Error('Failed to fetch topics');
    }
    return response.json();
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
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      throw new Error('Failed to delete KPI');
    }
    return response.json();
  },
};