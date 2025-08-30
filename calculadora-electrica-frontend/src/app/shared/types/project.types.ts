export interface Project {
  id: string;
  name: string;
  owner?: string;
  location?: string;
  voltage?: number;
  frequency?: number;
  notes?: string;
  apparentPowerKVA?: number;
  circuits?: number;
  description?: string;
  createdAt: string;
  updatedAt: string;
  status: string;
}

export interface ProjectInput {
  name: string;
  owner?: string;
  location?: string;
  voltage?: number;
  frequency?: number;
  notes?: string;
  apparentPowerKVA?: number;
  circuits?: number;
  description?: string;
}

export interface UpdateProjectDto {
  name?: string;
  owner?: string;
  location?: string;
  voltage?: number;
  frequency?: number;
  notes?: string;
  apparentPowerKVA?: number;
  circuits?: number;
  description?: string;
  status?: string;
}

export interface ProjectListResponse {
  data: Project[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ProjectListQuery {
  page?: number;
  pageSize?: number;
  sort?: string;
  order?: 'asc' | 'desc';
  q?: string;
  includeArchived?: boolean;
}
