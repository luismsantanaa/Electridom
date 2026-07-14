import apiClient from './client';
import type {
  ProjectSummary,
  ProjectListResponse,
  ProjectListParams,
  CreateProjectRequest,
  ProjectStats,
} from '../types/project.types';

export const projectsApi = {
  stats: async (): Promise<ProjectStats> => {
    const response = await apiClient.get<ProjectStats>('/v1/projects/stats');
    return response.data;
  },

  list: async (params?: ProjectListParams): Promise<ProjectListResponse> => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.pageSize) searchParams.set('pageSize', String(params.pageSize));
    if (params?.q) searchParams.set('q', params.q);
    if (params?.sort) searchParams.set('sort', params.sort);
    if (params?.order) searchParams.set('order', params.order);
    if (params?.includeArchived) searchParams.set('includeArchived', 'true');

    const qs = searchParams.toString();
    const response = await apiClient.get<ProjectListResponse>(
      `/v1/projects${qs ? `?${qs}` : ''}`,
    );
    return response.data;
  },

  get: async (projectId: string): Promise<ProjectSummary> => {
    const response = await apiClient.get<ProjectSummary>(`/v1/projects/${projectId}`);
    return response.data;
  },

  create: async (data: CreateProjectRequest): Promise<ProjectSummary> => {
    const response = await apiClient.post<ProjectSummary>('/v1/projects', data);
    return response.data;
  },

  update: async (
    projectId: string,
    data: Partial<CreateProjectRequest>,
  ): Promise<ProjectSummary> => {
    const response = await apiClient.patch<ProjectSummary>(`/v1/projects/${projectId}`, data);
    return response.data;
  },

  delete: async (projectId: string): Promise<void> => {
    await apiClient.delete(`/v1/projects/${projectId}`);
  },
};
