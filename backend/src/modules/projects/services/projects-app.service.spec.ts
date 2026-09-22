import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { ProjectsAppService } from './projects-app.service';
import { Project, ProjectStatus } from '../entities/project.entity';
import { ProjectVersion } from '../entities/project-version.entity';
import { CalculationAppService } from '../../calculations/services/calculation-app.service';
import { RuleSignatureService } from '../../rules/services/rule-signature.service';

describe('ProjectsAppService', () => {
  let service: ProjectsAppService;
  let projectRepository: Repository<Project>;
  let projectVersionRepository: Repository<ProjectVersion>;
  let calculationAppService: CalculationAppService;
  let ruleSignatureService: RuleSignatureService;

  const mockProjectRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
    count: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockProjectVersionRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockCalculationAppService = {
    preview: jest.fn(),
  };

  const mockRuleSignatureService = {
    getCurrentSignature: jest.fn(),
    getRuleSetSignature: jest.fn(),
    getActiveRulesSignature: jest.fn(),
    compareSignatures: jest.fn(),
  };

  const mockDataSource = {
    createQueryRunner: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn().mockReturnValue(100),
  };

  const mockQueryRunner = {
    connect: jest.fn(),
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    rollbackTransaction: jest.fn(),
    release: jest.fn(),
    manager: {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    },
  };

  beforeEach(async () => {
    mockDataSource.createQueryRunner.mockReturnValue(mockQueryRunner);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectsAppService,
        { provide: getRepositoryToken(Project), useValue: mockProjectRepository },
        { provide: getRepositoryToken(ProjectVersion), useValue: mockProjectVersionRepository },
        { provide: CalculationAppService, useValue: mockCalculationAppService },
        { provide: RuleSignatureService, useValue: mockRuleSignatureService },
        { provide: DataSource, useValue: mockDataSource },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<ProjectsAppService>(ProjectsAppService);
    projectRepository = module.get(getRepositoryToken(Project));
    projectVersionRepository = module.get(getRepositoryToken(ProjectVersion));
    calculationAppService = module.get(CalculationAppService);
    ruleSignatureService = module.get(RuleSignatureService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── createProject ─────────────────────────────────────────────────────

  describe('createProject', () => {
    const dto = {
      projectName: 'Test Project',
      description: 'Test desc',
      surfaces: [{ environment: 'Sala', areaM2: 18 }],
      consumptions: [{ name: 'TV', environment: 'Sala', watts: 120 }],
      computeNow: true,
    };

    it('should create a project with first version', async () => {
      mockProjectRepository.findOne.mockResolvedValue(null);
      mockProjectRepository.create.mockReturnValue({ id: 'p1', name: 'Test Project' });
      mockProjectRepository.save.mockResolvedValue({
        id: 'p1',
        name: 'Test Project',
        status: ProjectStatus.ACTIVE,
        creationDate: new Date(),
        updateDate: new Date(),
      });

      mockCalculationAppService.preview.mockResolvedValue({
        cargasPorAmbiente: [],
        totales: {},
        propuestaCircuitos: [],
        warnings: [],
      });
      mockRuleSignatureService.getCurrentSignature.mockResolvedValue('sig-1');
      mockQueryRunner.manager.findOne.mockResolvedValue(null);
      mockQueryRunner.manager.create.mockReturnValue({});
      mockQueryRunner.manager.save.mockResolvedValue({
        id: 'v1',
        versionNumber: 1,
        creationDate: new Date(),
        rulesSignature: 'sig-1',
        outputTotales: {},
      });

      const result = await service.createProject(dto as any);

      expect(result.projectId).toBe('p1');
      expect(result.projectName).toBe('Test Project');
      expect(result.latestVersion).toBeDefined();
    });

    it('should throw ConflictException if project name exists', async () => {
      mockProjectRepository.findOne.mockResolvedValue({ id: 'existing' });

      await expect(service.createProject(dto as any)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should create project without version if computeNow is false', async () => {
      mockProjectRepository.findOne.mockResolvedValue(null);
      mockProjectRepository.create.mockReturnValue({ id: 'p1' });
      mockProjectRepository.save.mockResolvedValue({
        id: 'p1',
        name: 'Test',
        status: ProjectStatus.ACTIVE,
        creationDate: new Date(),
        updateDate: new Date(),
      });

      const result = await service.createProject({
        ...dto,
        computeNow: false,
      } as any);

      expect(result.latestVersion).toBeUndefined();
      expect(mockCalculationAppService.preview).not.toHaveBeenCalled();
    });
  });

  // ─── getProject ────────────────────────────────────────────────────────

  describe('getProject', () => {
    it('should return a project with latest version', async () => {
      const project = {
        id: 'p1',
        name: 'Test',
        status: ProjectStatus.ACTIVE,
        creationDate: new Date('2026-01-01'),
        updateDate: new Date('2026-01-01'),
      };
      const version = {
        id: 'v1',
        versionNumber: 1,
        creationDate: new Date(),
        rulesSignature: 'sig',
        outputTotales: {},
      };

      mockProjectRepository.findOne.mockResolvedValue(project);
      mockProjectVersionRepository.findOne.mockResolvedValue(version);

      const result = await service.getProject('p1');

      expect(result.projectId).toBe('p1');
      expect(result.latestVersion).toBeDefined();
    });

    it('should throw NotFoundException if project not found', async () => {
      mockProjectRepository.findOne.mockResolvedValue(null);

      await expect(service.getProject('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException for archived project without includeArchived', async () => {
      mockProjectRepository.findOne.mockResolvedValue({
        id: 'p1',
        status: ProjectStatus.ARCHIVED,
      });

      await expect(service.getProject('p1', false)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ─── getVersion ────────────────────────────────────────────────────────

  describe('getVersion', () => {
    it('should return a specific version', async () => {
      const project = { id: 'p1', name: 'Test' };
      const version = {
        id: 'v1',
        versionNumber: 1,
        creationDate: new Date(),
        inputSuperficies: [],
        inputConsumos: [],
        outputCargasPorAmbiente: [],
        outputTotales: {},
        outputPropuestaCircuitos: [],
        outputWarnings: [],
        rulesSignature: 'sig',
      };

      mockProjectRepository.findOne.mockResolvedValue(project);
      mockProjectVersionRepository.findOne.mockResolvedValue(version);

      const result = await service.getVersion('p1', 'v1');

      expect(result.versionId).toBe('v1');
      expect(result.projectId).toBe('p1');
    });

    it('should throw NotFoundException if project not found', async () => {
      mockProjectRepository.findOne.mockResolvedValue(null);

      await expect(service.getVersion('nonexistent', 'v1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException if version not found', async () => {
      mockProjectRepository.findOne.mockResolvedValue({ id: 'p1' });
      mockProjectVersionRepository.findOne.mockResolvedValue(null);

      await expect(service.getVersion('p1', 'nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ─── getDashboardStats ─────────────────────────────────────────────────

  describe('getDashboardStats', () => {
    it('should return dashboard stats', async () => {
      mockProjectRepository.count.mockResolvedValue(5);

      const mockQb = {
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ count: '3' }),
      };
      mockProjectRepository.createQueryBuilder.mockReturnValue(mockQb);

      const result = await service.getDashboardStats();

      expect(result.activeProjects).toBe(5);
      expect(result.calculationsDone).toBe(3);
    });
  });

  // ─── listProjects ──────────────────────────────────────────────────────

  describe('listProjects', () => {
    it('should list projects with pagination', async () => {
      const mockQb = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(0),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };
      mockProjectRepository.createQueryBuilder.mockReturnValue(mockQb);

      const result = await service.listProjects(1, 20);

      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
    });
  });

  // ─── updateProjectStatus ───────────────────────────────────────────────

  describe('updateProjectStatus', () => {
    it('should archive a project', async () => {
      const project = {
        id: 'p1',
        status: ProjectStatus.ACTIVE,
        creationDate: new Date(),
        updateDate: new Date(),
      };
      mockProjectRepository.findOne.mockResolvedValue(project);
      mockProjectRepository.save.mockResolvedValue({
        ...project,
        status: ProjectStatus.ARCHIVED,
      });
      // Second call for getProject
      mockProjectVersionRepository.findOne.mockResolvedValue(null);

      const result = await service.updateProjectStatus('p1', {
        status: ProjectStatus.ARCHIVED,
      });

      expect(result.status).toBe(ProjectStatus.ARCHIVED);
    });

    it('should throw NotFoundException if project not found', async () => {
      mockProjectRepository.findOne.mockResolvedValue(null);

      await expect(
        service.updateProjectStatus('nonexistent', { status: ProjectStatus.ARCHIVED }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ─── createSimpleProject ───────────────────────────────────────────────

  describe('createSimpleProject', () => {
    it('should create a simple project', async () => {
      mockProjectRepository.findOne.mockResolvedValue(null);
      mockProjectRepository.save.mockResolvedValue({
        id: 'p1',
        name: 'Test',
        description: '',
        status: ProjectStatus.ACTIVE,
        metadata: { owner: 'Luis' },
        creationDate: new Date(),
        lastModifiedDate: new Date(),
      });

      const result = await service.createSimpleProject({
        name: 'Test',
        owner: 'Luis',
      } as any);

      expect(result.id).toBe('p1');
      expect(result.name).toBe('Test');
    });

    it('should throw ConflictException if name exists', async () => {
      mockProjectRepository.findOne.mockResolvedValue({ id: 'existing' });

      await expect(
        service.createSimpleProject({ name: 'Duplicate' } as any),
      ).rejects.toThrow(ConflictException);
    });
  });

  // ─── updateProject ─────────────────────────────────────────────────────

  describe('updateProject', () => {
    it('should update a project', async () => {
      const project = {
        id: 'p1',
        name: 'Old Name',
        description: '',
        metadata: {},
        creationDate: new Date(),
        lastModifiedDate: new Date(),
      };
      // First call: find project by id
      mockProjectRepository.findOne
        .mockResolvedValueOnce(project)
        .mockResolvedValueOnce(null); // Second call: check name conflict (null = no conflict)
      mockProjectRepository.save.mockResolvedValue({
        ...project,
        name: 'New Name',
      });

      const result = await service.updateProject('p1', {
        name: 'New Name',
      } as any);

      expect(result.name).toBe('New Name');
    });

    it('should throw NotFoundException if project not found', async () => {
      mockProjectRepository.findOne.mockResolvedValue(null);

      await expect(
        service.updateProject('nonexistent', { name: 'Test' } as any),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if new name already exists', async () => {
      mockProjectRepository.findOne
        .mockResolvedValueOnce({ id: 'p1', name: 'Old' })
        .mockResolvedValueOnce({ id: 'p2', name: 'Taken' });

      await expect(
        service.updateProject('p1', { name: 'Taken' } as any),
      ).rejects.toThrow(ConflictException);
    });
  });

  // ─── deleteProject ─────────────────────────────────────────────────────

  describe('deleteProject', () => {
    it('should delete a project', async () => {
      const project = { id: 'p1', versions: [] };
      mockProjectRepository.findOne.mockResolvedValue(project);
      mockProjectRepository.remove.mockResolvedValue(undefined);

      await service.deleteProject('p1');

      expect(mockProjectRepository.remove).toHaveBeenCalledWith(project);
    });

    it('should throw NotFoundException if project not found', async () => {
      mockProjectRepository.findOne.mockResolvedValue(null);

      await expect(service.deleteProject('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ConflictException if project has recent versions', async () => {
      const project = {
        id: 'p1',
        versions: [{ creationDate: new Date() }],
      };
      mockProjectRepository.findOne.mockResolvedValue(project);

      await expect(service.deleteProject('p1')).rejects.toThrow(
        ConflictException,
      );
    });
  });
});
