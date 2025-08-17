
export interface KPI {
  id: string;
  name: string;
  definition: string;
  sqlQuery: string;
  topics: string[]; // Changed from 'topic: string'
  dataSpecialist: string;
  businessSpecialist: string;
  lastUpdated: string;
  versions: KPIVersion[];
  status: 'active' | 'inactive';
  additionalBlocks?: KPIBlock[];
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

// New interface for additional blocks
export interface KPIBlock {
  id: string;
  title?: string;
  subtitle?: string;
  text?: string;
  endContent: 'code' | 'image' | 'none';
  codeContent?: string;
  imageUrl?: string;
}
