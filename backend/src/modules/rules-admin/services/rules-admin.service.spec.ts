import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { RulesAdminService } from './rules-admin.service';
import { RuleSet } from '../../rules/entities/rule-set.entity';
import { NormRule } from '../../rules/entities/norm-rule.entity';
import { RuleChangeLog } from '../../rules/entities/rule-change-log.entity';

describe('RulesAdminService', () => {
  let service: RulesAdminService;
  let ruleSetRepository: Repository<RuleSet>;

  const mockRuleSetRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockNormRuleRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockRuleChangeLogRepository = {
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockDataSource = {
    createQueryRunner: jest.fn(),
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
        RulesAdminService,
        { provide: getRepositoryToken(RuleSet), useValue: mockRuleSetRepository },
        { provide: getRepositoryToken(NormRule), useValue: mockNormRuleRepository },
        { provide: getRepositoryToken(RuleChangeLog), useValue: mockRuleChangeLogRepository },
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    service = module.get<RulesAdminService>(RulesAdminService);
    ruleSetRepository = module.get(getRepositoryToken(RuleSet));
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createRuleSet', () => {
    it('should create a rule set', async () => {
      const dto = {
        name: 'RIE-RD 2025',
        description: 'Test rules',
        effectiveFrom: '2025-09-01T00:00:00Z',
      };

      mockRuleSetRepository.create.mockReturnValue({});
      mockRuleSetRepository.save.mockResolvedValue({
        id: 'rs-1',
        name: 'RIE-RD 2025',
        description: 'Test rules',
        status: 'DRAFT',
        effectiveFrom: new Date('2025-09-01'),
        creationDate: new Date(),
        updateDate: new Date(),
      });

      const result = await service.createRuleSet(dto as any);

      expect(result.id).toBe('rs-1');
      expect(result.name).toBe('RIE-RD 2025');
      expect(result.status).toBe('DRAFT');
      expect(result.rulesCount).toBe(0);
    });
  });

  describe('getRuleSetDetail', () => {
    it('should return rule set detail with rules', async () => {
      const ruleSet = {
        id: 'rs-1',
        name: 'Test',
        description: 'Desc',
        status: 'DRAFT',
        rules: [
          {
            code: 'NEC-210.52',
            description: 'Test rule',
            numericValue: '20',
            unit: 'A',
            category: 'circuit',
          },
        ],
        creationDate: new Date(),
        updateDate: new Date(),
      };

      mockRuleSetRepository.findOne.mockResolvedValue(ruleSet);

      const result = await service.getRuleSetDetail('rs-1');

      expect(result.id).toBe('rs-1');
      expect(result.rules).toHaveLength(1);
      expect(result.rules[0].code).toBe('NEC-210.52');
    });

    it('should throw NotFoundException if not found', async () => {
      mockRuleSetRepository.findOne.mockResolvedValue(null);

      await expect(service.getRuleSetDetail('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('publishRuleSet', () => {
    it('should publish a DRAFT rule set', async () => {
      const ruleSet = {
        id: 'rs-1',
        status: 'DRAFT',
        effectiveFrom: new Date(),
        effectiveTo: null,
      };

      mockRuleSetRepository.findOne.mockResolvedValue(ruleSet);

      const mockQb = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };
      mockRuleSetRepository.createQueryBuilder.mockReturnValue(mockQb);

      mockRuleSetRepository.save.mockResolvedValue({
        ...ruleSet,
        status: 'ACTIVE',
      });

      const result = await service.publishRuleSet('rs-1');

      expect(result.status).toBe('ACTIVE');
    });

    it('should throw NotFoundException if not found', async () => {
      mockRuleSetRepository.findOne.mockResolvedValue(null);

      await expect(service.publishRuleSet('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if not DRAFT', async () => {
      mockRuleSetRepository.findOne.mockResolvedValue({
        id: 'rs-1',
        status: 'ACTIVE',
      });

      await expect(service.publishRuleSet('rs-1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('listRuleSets', () => {
    it('should list rule sets with pagination', async () => {
      const mockQb = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(0),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };
      mockRuleSetRepository.createQueryBuilder.mockReturnValue(mockQb);

      const result = await service.listRuleSets(1, 20);

      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
    });
  });
});
