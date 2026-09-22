import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { RulesAdminController } from './rules-admin.controller';
import { RulesAdminService } from '../services/rules-admin.service';

describe('RulesAdminController', () => {
  let controller: RulesAdminController;
  let service: RulesAdminService;

  const mockRulesAdminService = {
    createRuleSet: jest.fn(),
    bulkUpsertRules: jest.fn(),
    listRuleSets: jest.fn(),
    getRuleSetDetail: jest.fn(),
    diffRuleSets: jest.fn(),
    exportRuleSet: jest.fn(),
    importRuleSet: jest.fn(),
    publishRuleSet: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn().mockReturnValue('test-api-key'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RulesAdminController],
      providers: [
        { provide: RulesAdminService, useValue: mockRulesAdminService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    controller = module.get<RulesAdminController>(RulesAdminController);
    service = module.get<RulesAdminService>(RulesAdminService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createRuleSet', () => {
    it('should create a rule set', async () => {
      const dto = {
        name: 'RIE-RD 2025',
        description: 'Test',
        effectiveFrom: '2025-09-01T00:00:00Z',
      };
      const expected = {
        id: 'rs-1',
        name: 'RIE-RD 2025',
        status: 'DRAFT',
        rulesCount: 0,
      };
      mockRulesAdminService.createRuleSet.mockResolvedValue(expected);

      const result = await controller.createRuleSet(dto as any);

      expect(result).toEqual(expected);
      expect(service.createRuleSet).toHaveBeenCalledWith(dto);
    });
  });

  describe('listRuleSets', () => {
    it('should list rule sets', async () => {
      const expected = {
        data: [{ id: 'rs-1', name: 'Test' }],
        total: 1,
      };
      mockRulesAdminService.listRuleSets.mockResolvedValue(expected);

      const result = await controller.listRuleSets({} as any);

      expect(result).toEqual(expected);
    });
  });

  describe('getRuleSetDetail', () => {
    it('should get rule set detail', async () => {
      const expected = {
        id: 'rs-1',
        name: 'Test',
        rules: [],
      };
      mockRulesAdminService.getRuleSetDetail.mockResolvedValue(expected);

      const result = await controller.getRuleSetDetail('rs-1');

      expect(result).toEqual(expected);
      expect(service.getRuleSetDetail).toHaveBeenCalledWith('rs-1');
    });
  });

  describe('exportRuleSet', () => {
    it('should export a rule set', async () => {
      const expected = {
        ruleSet: { id: 'rs-1' },
        rules: [],
      };
      mockRulesAdminService.exportRuleSet.mockResolvedValue(expected);

      const result = await controller.exportRuleSet('rs-1');

      expect(result).toEqual(expected);
    });
  });

  describe('publishRuleSet', () => {
    it('should publish a rule set', async () => {
      const expected = { id: 'rs-1', status: 'PUBLISHED' };
      mockRulesAdminService.publishRuleSet.mockResolvedValue(expected);

      const result = await controller.publishRuleSet('rs-1');

      expect(result).toEqual(expected);
    });
  });
});
