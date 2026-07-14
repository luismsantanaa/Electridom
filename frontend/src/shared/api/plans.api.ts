import apiClient from './client';
import type {
  PlanUploadResponse,
  ProcessingStatusResponse,
  PlanResultResponse,
  PlanListResponse,
  SpaceUpdateRequest,
  DetectedSpace,
} from '../types/plan.types';

export const plansApi = {
  upload: async (
    file: File,
    projectId?: string,
    onProgress?: (percent: number) => void,
  ): Promise<PlanUploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    if (projectId) formData.append('project_id', projectId);

    const response = await apiClient.post<PlanUploadResponse>('/plans/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (event) => {
        if (!onProgress || !event.total) return;
        onProgress(Math.min(100, Math.round((event.loaded * 100) / event.total)));
      },
    });
    return response.data;
  },

  getStatus: async (planId: string): Promise<ProcessingStatusResponse> => {
    const response = await apiClient.get<ProcessingStatusResponse>(`/plans/${planId}/status`);
    return response.data;
  },

  getResult: async (planId: string): Promise<PlanResultResponse> => {
    const response = await apiClient.get<PlanResultResponse>(`/plans/${planId}/result`);
    return response.data;
  },

  list: async (params?: {
    page?: number;
    pageSize?: number;
    projectId?: string;
    status?: string;
  }): Promise<PlanListResponse> => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.pageSize) searchParams.set('page_size', String(params.pageSize));
    if (params?.projectId) searchParams.set('project_id', params.projectId);
    if (params?.status) searchParams.set('status', params.status);

    const qs = searchParams.toString();
    const response = await apiClient.get<PlanListResponse>(`/plans${qs ? `?${qs}` : ''}`);
    return response.data;
  },

  updateSpace: async (
    planId: string,
    spaceId: string,
    data: SpaceUpdateRequest,
  ): Promise<DetectedSpace> => {
    const response = await apiClient.patch<DetectedSpace>(
      `/plans/${planId}/spaces/${spaceId}`,
      data,
    );
    return response.data;
  },

  delete: async (planId: string): Promise<void> => {
    await apiClient.delete(`/plans/${planId}`);
  },
};
