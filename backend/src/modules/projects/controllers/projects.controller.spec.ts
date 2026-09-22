import { Test, TestingModule } from '@nestjs/testing';
import { ProjectsController } from './projects.controller';
import { ProjectsAppService } from '../services/projects-app.service';
import { ProjectStatus } from '../entities/project.entity';

describe('ProjectsController', () => {
  let controller: ProjectsController;
  let service: ProjectsAppService;

  const mockProjectsAppService = {
    createProject: jest.fn(),
    createVersion: jest.fn(),
    getDashboardStats: jest.fn(),
    getProject: jest.fn(),
    getVersion: jest.fn(),
    listProjects: jest.fn(),
    updateProjectStatus: jest.fn(),
    exportProject: jest.fn(),
    createSimpleProject: jest.fn(),
    updateProject: jest.fn(),
    deleteProject: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProjectsController],
      providers: [
        { provide: ProjectsAppService, useValue: mockProjectsAppService },
      ],
    }).compile();

    controller = module.get<ProjectsController>(ProjectsController);
    service = module.get<ProjectsAppService>(ProjectsAppService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // ─── createProject ─────────────────────────────────────────────────────

  describe('createProject', () => {
    const dto = {
      projectName: 'Residencia García',
      description: 'Unifamiliar 2 plantas',
      surfaces: [{ environment: 'Sala', areaM2: 18.5 }],
      consumptions: [{ name: 'Televisor', environment: 'Sala', watts: 120 }],
      computeNow: true,
    };

    it('should create a project with calculation', async () => {
      const expected = {
        projectId: 'uuid-1',
        projectName: 'Residencia García',
        status: ProjectStatus.ACTIVE,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
        latestVersion: {
          versionId: 'v-1',
          versionNumber: 1,
          createdAt: '2026-01-01T00:00:00Z',
          rulesSignature: 'sig-1',
          totales: {},
        },
      };
      mockProjectsAppService.createProject.mockResolvedValue(expected);

      const result = await controller.createProject(dto as any);

      expect(result).toEqual(expected);
      expect(service.createProject).toHaveBeenCalledWith(dto);
    });
  });

  // ─── createVersion ─────────────────────────────────────────────────────

  describe('createVersion', () => {
    it('should create a new version', async () => {
      const expected = {
        projectId: 'p1',
        versionId: 'v2',
        versionNumber: 2,
        createdAt: '2026-01-02T00:00:00Z',
        input: {},
        output: {},
        rulesSignature: 'sig',
        rulesChangedFromPrevious: false,
      };
      mockProjectsAppService.createVersion.mockResolvedValue(expected);

      const result = await controller.createVersion('p1', {
        surfaces: [],
        consumptions: [],
      } as any);

      expect(result).toEqual(expected);
      expect(service.createVersion).toHaveBeenCalledWith('p1', {
        surfaces: [],
        consumptions: [],
      });
    });
  });

  // ─── getDashboardStats ─────────────────────────────────────────────────

  describe('getDashboardStats', () => {
    it('should return dashboard stats', async () => {
      const expected = { activeProjects: 5, calculationsDone: 3 };
      mockProjectsAppService.getDashboardStats.mockResolvedValue(expected);

      const result = await controller.getDashboardStats();

      expect(result).toEqual(expected);
    });
  });

  // ─── getProject ────────────────────────────────────────────────────────

  describe('getProject', () => {
    it('should return a project by id', async () => {
      const expected = {
        projectId: 'p1',
        projectName: 'Test',
        status: ProjectStatus.ACTIVE,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      };
      mockProjectsAppService.getProject.mockResolvedValue(expected);

      const result = await controller.getProject('p1');

      expect(result).toEqual(expected);
      expect(service.getProject).toHaveBeenCalledWith('p1', undefined);
    });

    it('should pass includeArchived flag', async () => {
      mockProjectsAppService.getProject.mockResolvedValue({});

      await controller.getProject('p1', true);

      expect(service.getProject).toHaveBeenCalledWith('p1', true);
    });
  });

  // ─── getVersion ────────────────────────────────────────────────────────

  describe('getVersion', () => {
    it('should return a specific version', async () => {
      const expected = {
        projectId: 'p1',
        versionId: 'v1',
        versionNumber: 1,
      };
      mockProjectsAppService.getVersion.mockResolvedValue(expected);

      const result = await controller.getVersion('p1', 'v1');

      expect(result).toEqual(expected);
      expect(service.getVersion).toHaveBeenCalledWith('p1', 'v1');
    });
  });

  // ─── listProjects ──────────────────────────────────────────────────────

  describe('listProjects', () => {
    it('should list projects with default pagination', async () => {
      const expected = {
        data: [],
        page: 1,
        pageSize: 20,
        total: 0,
        totalPages: 0,
      };
      mockProjectsAppService.listProjects.mockResolvedValue(expected);

      const result = await controller.listProjects();

      expect(result).toEqual(expected);
      expect(service.listProjects).toHaveBeenCalledWith(
        1, 20, undefined, false, undefined, 'asc',
      );
    });

    it('should pass query params correctly', async () => {
      mockProjectsAppService.listProjects.mockResolvedValue({ data: [] });

      await controller.listProjects(2, 10, 'name', 'desc', 'test', true);

      expect(service.listProjects).toHaveBeenCalledWith(
        2, 10, 'test', true, 'name', 'desc',
      );
    });
  });

  // ─── updateProjectStatus ───────────────────────────────────────────────

  describe('updateProjectStatus', () => {
    it('should update project status', async () => {
      const expected = {
        projectId: 'p1',
        status: ProjectStatus.ARCHIVED,
      };
      mockProjectsAppService.updateProjectStatus.mockResolvedValue(expected);

      const result = await controller.updateProjectStatus('p1', {
        status: ProjectStatus.ARCHIVED,
      });

      expect(result).toEqual(expected);
      expect(service.updateProjectStatus).toHaveBeenCalledWith('p1', {
        status: ProjectStatus.ARCHIVED,
      });
    });
  });

  // ─── exportProject ─────────────────────────────────────────────────────

  describe('exportProject', () => {
    it('should export a project', async () => {
      const expected = {
        project: { projectId: 'p1' },
        versions: [],
      };
      mockProjectsAppService.exportProject.mockResolvedValue(expected);

      const result = await controller.exportProject('p1');

      expect(result).toEqual(expected);
      expect(service.exportProject).toHaveBeenCalledWith('p1');
    });
  });

  // ─── createSimpleProject ───────────────────────────────────────────────

  describe('createSimpleProject', () => {
    it('should create a simple project', async () => {
      const dto = { name: 'Test', owner: 'Luis' };
      const expected = {
        id: 'p1',
        name: 'Test',
        owner: 'Luis',
        status: ProjectStatus.ACTIVE,
      };
      mockProjectsAppService.createSimpleProject.mockResolvedValue(expected);

      const result = await controller.createSimpleProject(dto as any);

      expect(result).toEqual(expected);
      expect(service.createSimpleProject).toHaveBeenCalledWith(dto);
    });
  });

  // ─── updateProject ─────────────────────────────────────────────────────

  describe('updateProject', () => {
    it('should update a project', async () => {
      const dto = { name: 'Updated', owner: 'Luis' };
      const expected = { id: 'p1', name: 'Updated' };
      mockProjectsAppService.updateProject.mockResolvedValue(expected);

      const result = await controller.updateProject('p1', dto as any);

      expect(result).toEqual(expected);
      expect(service.updateProject).toHaveBeenCalledWith('p1', dto);
    });
  });

  // ─── deleteProject ─────────────────────────────────────────────────────

  describe('deleteProject', () => {
    it('should delete a project', async () => {
      mockProjectsAppService.deleteProject.mockResolvedValue(undefined);

      await controller.deleteProject('p1');

      expect(service.deleteProject).toHaveBeenCalledWith('p1');
    });
  });
});
