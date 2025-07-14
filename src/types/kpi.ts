
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
  versions: KPIVersion[];
  status: 'active' | 'draft' | 'archived';
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
