export interface ProjectSurface {
  environment: string;
  areaM2: number;
}

export interface ProjectConsumption {
  name: string;
  environment: string;
  watts: number;
  factorUso?: number;
}

export interface ProjectOptions {
  tensionV?: number;
  monofasico?: boolean;
  ruleSetId?: string;
}

export interface CreateProjectRequest {
  projectName: string;
  description?: string;
  surfaces: ProjectSurface[];
  consumptions: ProjectConsumption[];
  opciones?: ProjectOptions;
  computeNow?: boolean;
}

export interface ProjectLatestVersion {
  versionId: string;
  versionNumber: number;
  createdAt: string;
}

export interface ProjectSummary {
  projectId: string;
  projectName: string;
  status: 'ACTIVE' | 'ARCHIVED';
  createdAt: string;
  updatedAt: string;
  latestVersion?: ProjectLatestVersion;
  description?: string;
}

export interface ProjectListResponse {
  data: ProjectSummary[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ProjectStats {
  activeProjects: number;
  calculationsDone: number;
}

export interface ProjectListParams {
  page?: number;
  pageSize?: number;
  q?: string;
  sort?: string;
  order?: 'asc' | 'desc';
  includeArchived?: boolean;
}
