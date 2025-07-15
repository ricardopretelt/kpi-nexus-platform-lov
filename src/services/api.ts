// More robust API URL detection
const API_BASE_URL = (() => {
  // Check if we're in production (on Render)
  if (window.location.hostname.includes('onrender.com')) {
    return 'https://kpi-nexus-backend.onrender.com';
  }
  // Check environment variable
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  // Fallback to localhost for development
  return 'http://localhost:3001';
})();

console.log('API_BASE_URL:', API_BASE_URL);

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
    console.log('Fetching KPIs from:', `${API_BASE_URL}/api/kpis`);
    const response = await fetch(`${API_BASE_URL}/api/kpis`);
    console.log('KPI response status:', response.status);
    if (!response.ok) {
      const errorText = await response.text();
      console.error('KPI fetch error:', errorText);
      throw new Error(`Failed to fetch KPIs: ${response.status} ${errorText}`);
    }
    const data = await response.json();
    console.log('KPI data received:', data);
    return data;
  },

  async getTopics(): Promise<Topic[]> {
    console.log('Fetching topics from:', `${API_BASE_URL}/api/topics`);
    const response = await fetch(`${API_BASE_URL}/api/topics`);
    console.log('Topics response status:', response.status);
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Topics fetch error:', errorText);
      throw new Error(`Failed to fetch topics: ${response.status} ${errorText}`);
    }
    const data = await response.json();
    console.log('Topics data received:', data);
    return data;
  },

  async getUsers() {
    const response = await fetch(`${API_BASE_URL}/api/users`);
    if (!response.ok) {
      throw new Error('Failed to fetch users');
    }
    return response.json();
  },

  // POST operations (create)
  async createKPI(kpiData: Omit<KPI, 'id' | 'lastUpdated' | 'versions'>): Promise<{ id: string; message: string }> {
    const response = await fetch(`${API_BASE_URL}/api/kpis`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
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
      headers: {
        'Content-Type': 'application/json',
      },
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
      headers: {
        'Content-Type': 'application/json',
      },
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
    });
    if (!response.ok) {
      throw new Error('Failed to delete KPI');
    }
    return response.json();
  },
};