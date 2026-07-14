import { Test, TestingModule } from '@nestjs/testing';
import { KeyStoreService } from '../key-store.service';
import { JwksKeyRepository } from '../../repositories/jwks-key.repository';
import { JwksKey, JwksKeyType } from '../../entities/jwks-key.entity';

describe('KeyStoreService', () => {
  let service: KeyStoreService;
  let repository: JwksKeyRepository;

  const mockJwksKeyRepository = {
    findActiveKey: jest.fn(),
    findActivePrivateKey: jest.fn(),
    findActivePublicKeys: jest.fn(),
    findByKid: jest.fn(),
    deactivatePreviousKeys: jest.fn(),
    countActiveKeys: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KeyStoreService,
        {
          provide: JwksKeyRepository,
          useValue: mockJwksKeyRepository,
        },
      ],
    }).compile();

    service = module.get<KeyStoreService>(KeyStoreService);
    repository = module.get<JwksKeyRepository>(JwksKeyRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getActiveKey', () => {
    it('should return active key', async () => {
      const mockKey = { id: '1', kid: 'test-kid', isActive: true } as JwksKey;
      mockJwksKeyRepository.findActiveKey.mockResolvedValue(mockKey);

      const result = await service.getActiveKey();

      expect(result).toBe(mockKey);
      expect(mockJwksKeyRepository.findActiveKey).toHaveBeenCalled();
    });

    it('should return null when no active key exists', async () => {
      mockJwksKeyRepository.findActiveKey.mockResolvedValue(null);

      const result = await service.getActiveKey();

      expect(result).toBeNull();
    });
  });

  describe('getActivePublicKeys', () => {
    it('should return active public keys', async () => {
      const mockKeys = [
        { id: '1', kid: 'kid-1', isActive: true },
        { id: '2', kid: 'kid-2', isActive: true },
      ] as JwksKey[];
      mockJwksKeyRepository.findActivePublicKeys.mockResolvedValue(mockKeys);

      const result = await service.getActivePublicKeys();

      expect(result).toBe(mockKeys);
      expect(mockJwksKeyRepository.findActivePublicKeys).toHaveBeenCalled();
    });
  });

  describe('getKeyByKid', () => {
    it('should return key by kid', async () => {
      const mockKey = { id: '1', kid: 'test-kid' } as JwksKey;
      mockJwksKeyRepository.findByKid.mockResolvedValue(mockKey);

      const result = await service.getKeyByKid('test-kid');

      expect(result).toBe(mockKey);
      expect(mockJwksKeyRepository.findByKid).toHaveBeenCalledWith('test-kid');
    });
  });

  describe('countActiveKeys', () => {
    it('should return count of active keys', async () => {
      mockJwksKeyRepository.countActiveKeys.mockResolvedValue(2);

      const result = await service.countActiveKeys();

      expect(result).toBe(2);
      expect(mockJwksKeyRepository.countActiveKeys).toHaveBeenCalled();
    });
  });

  describe('createInitialKey', () => {
    it('should create initial key when no active key exists', async () => {
      const mockNewKey = { id: '1', kid: 'new-kid', isActive: true } as JwksKey;
      mockJwksKeyRepository.findActiveKey.mockResolvedValue(null);
      mockJwksKeyRepository.deactivatePreviousKeys.mockResolvedValue(undefined);
      mockJwksKeyRepository.create.mockReturnValue(mockNewKey);
      mockJwksKeyRepository.save.mockResolvedValue(mockNewKey);

      const result = await service.createInitialKey();

      expect(result).toBe(mockNewKey);
      expect(mockJwksKeyRepository.findActiveKey).toHaveBeenCalled();
      expect(mockJwksKeyRepository.deactivatePreviousKeys).toHaveBeenCalled();
    });

    it('should return existing key when active key exists', async () => {
      const mockExistingKey = {
        id: '1',
        kid: 'existing-kid',
        isActive: true,
      } as JwksKey;
      mockJwksKeyRepository.findActiveKey.mockResolvedValue(mockExistingKey);

      const result = await service.createInitialKey();

      expect(result).toBe(mockExistingKey);
      expect(mockJwksKeyRepository.findActiveKey).toHaveBeenCalled();
      expect(
        mockJwksKeyRepository.deactivatePreviousKeys,
      ).not.toHaveBeenCalled();
    });
  });
});
