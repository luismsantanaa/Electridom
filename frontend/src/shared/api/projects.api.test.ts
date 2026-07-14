import { describe, it, expect, vi, beforeEach } from 'vitest';
import { projectsApi } from './projects.api';
import apiClient from './client';

vi.mock('./client', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

const mockGet = vi.mocked(apiClient.get);
const mockPost = vi.mocked(apiClient.post);
const mockPatch = vi.mocked(apiClient.patch);
const mockDelete = vi.mocked(apiClient.delete);

describe('projectsApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch project dashboard stats', async () => {
    const mockResponse = {
      data: { activeProjects: 120, calculationsDone: 45 },
    };
    mockGet.mockResolvedValueOnce(mockResponse);

    const result = await projectsApi.stats();

    expect(mockGet).toHaveBeenCalledWith('/v1/projects/stats');
    expect(result).toEqual(mockResponse.data);
  });

  it('should list projects with params', async () => {
    const mockResponse = { data: { data: [], total: 0, page: 1, pageSize: 10, totalPages: 0 } };
    mockGet.mockResolvedValueOnce(mockResponse);

    const result = await projectsApi.list({ page: 1, pageSize: 10, q: 'test' });

    expect(mockGet).toHaveBeenCalledWith('/v1/projects?page=1&pageSize=10&q=test');
    expect(result).toEqual(mockResponse.data);
  });

  it('should get a project by id', async () => {
    const mockResponse = { data: { projectId: '123', projectName: 'Test' } };
    mockGet.mockResolvedValueOnce(mockResponse);

    const result = await projectsApi.get('123');

    expect(mockGet).toHaveBeenCalledWith('/v1/projects/123');
    expect(result).toEqual(mockResponse.data);
  });

  it('should create a project', async () => {
    const mockResponse = { data: { projectId: '123', projectName: 'New Project' } };
    mockPost.mockResolvedValueOnce(mockResponse);

    const requestData = {
      projectName: 'New Project',
      surfaces: [],
      consumptions: [],
    };

    const result = await projectsApi.create(requestData);

    expect(mockPost).toHaveBeenCalledWith('/v1/projects', requestData);
    expect(result).toEqual(mockResponse.data);
  });

  it('should update a project', async () => {
    const mockResponse = { data: { projectId: '123', projectName: 'Updated' } };
    mockPatch.mockResolvedValueOnce(mockResponse);

    const result = await projectsApi.update('123', { projectName: 'Updated' });

    expect(mockPatch).toHaveBeenCalledWith('/v1/projects/123', { projectName: 'Updated' });
    expect(result).toEqual(mockResponse.data);
  });

  it('should delete a project', async () => {
    mockDelete.mockResolvedValueOnce({ data: undefined });

    await projectsApi.delete('123');

    expect(mockDelete).toHaveBeenCalledWith('/v1/projects/123');
  });
});
