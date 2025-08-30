export enum ExportType {
  PDF = 'PDF',
  EXCEL = 'EXCEL',
  JSON = 'JSON'
}

export enum ExportStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED'
}

export interface Export {
  id: string;
  projectId: string;
  projectName: string;
  type: ExportType;
  scope: string;
  status: ExportStatus;
  createdAt: string;
  completedAt?: string;
  filename?: string;
  fileSize?: number;
}

export interface ExportListResponse {
  data: Export[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ExportListQuery {
  page?: number;
  pageSize?: number;
}

export interface CreateExportRequest {
  projectId: string;
  type: ExportType;
  scope: string;
}
