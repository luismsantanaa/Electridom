import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { JwtRs256Service } from '../jwt-rs256.service';
import { KeyStoreService } from '../key-store.service';
import { JwksKey, JwksKeyType } from '../../entities/jwks-key.entity';
import { UnauthorizedException } from '@nestjs/common';

describe('JwtRs256Service', () => {
  let service: JwtRs256Service;
  let keyStoreService: KeyStoreService;
  let jwtService: JwtService;

  const mockPrivateKey = `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC7VJTUt9Us8cKB
AgEAAoIBAQC7VJTUt9Us8cKB
-----END PRIVATE KEY-----`;

  const mockPublicKey = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAu1SU1LfVLPHCgQIBAAOC
AQ8AMIIBCgKCAQEAu1SU1LfVLPHCgQIBAAOC
-----END PUBLIC KEY-----`;

  const mockJwksKey: JwksKey = {
    id: '1',
    kid: 'test-kid-123',
    type: JwksKeyType.RSA,
    publicPem: mockPublicKey,
    privatePem: mockPrivateKey,
    isActive: true,
    rotatedAt: null as any,
    creationDate: new Date(),
    updateDate: new Date(),
    usrCreate: 'system',
    usrUpdate: 'system',
    active: true,
  };

  const mockJwtService = {
    decode: jest.fn(),
  };

  const mockKeyStoreService = {
    getActivePrivateKey: jest.fn(),
    getKeyByKid: jest.fn(),
    getActiveKey: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtRs256Service,
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: KeyStoreService,
          useValue: mockKeyStoreService,
        },
      ],
    }).compile();

    service = module.get<JwtRs256Service>(JwtRs256Service);
    keyStoreService = module.get<KeyStoreService>(KeyStoreService);
    jwtService = module.get<JwtService>(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sign', () => {
    it('should sign a JWT token with RS256', async () => {
      const payload = { email: 'test@example.com', sub: 1, role: 'admin' };
      mockKeyStoreService.getActivePrivateKey.mockResolvedValue(mockJwksKey);

      const result = await service.sign(payload);

      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(mockKeyStoreService.getActivePrivateKey).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when no active private key', async () => {
      const payload = { email: 'test@example.com', sub: 1, role: 'admin' };
      mockKeyStoreService.getActivePrivateKey.mockResolvedValue(null);

      await expect(service.sign(payload)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when private key is missing', async () => {
      const payload = { email: 'test@example.com', sub: 1, role: 'admin' };
      const keyWithoutPrivate = { ...mockJwksKey, privatePem: null };
      mockKeyStoreService.getActivePrivateKey.mockResolvedValue(keyWithoutPrivate);

      await expect(service.sign(payload)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('verify', () => {
    it('should verify a valid JWT token', async () => {
      const mockToken = 'valid.jwt.token';
      const mockDecodedHeader = {
        header: { kid: 'test-kid-123' },
        payload: { email: 'test@example.com', sub: 1, role: 'admin' },
      };

      mockJwtService.decode.mockReturnValue(mockDecodedHeader);
      mockKeyStoreService.getKeyByKid.mockResolvedValue(mockJwksKey);

      // Mock the jsonwebtoken verify function
      jest.doMock('jsonwebtoken', () => ({
        verify: jest.fn().mockImplementation((token, key, options, callback) => {
          callback(null, { email: 'test@example.com', sub: 1, role: 'admin' });
        }),
      }));

      const result = await service.verify(mockToken);

      expect(result).toBeDefined();
      expect(mockJwtService.decode).toHaveBeenCalledWith(mockToken, { complete: true });
      expect(mockKeyStoreService.getKeyByKid).toHaveBeenCalledWith('test-kid-123');
    });

    it('should throw UnauthorizedException when token has no kid', async () => {
      const mockToken = 'invalid.jwt.token';
      const mockDecodedHeader = { header: {}, payload: {} };

      mockJwtService.decode.mockReturnValue(mockDecodedHeader);

      await expect(service.verify(mockToken)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when key not found', async () => {
      const mockToken = 'valid.jwt.token';
      const mockDecodedHeader = {
        header: { kid: 'non-existent-kid' },
        payload: {},
      };

      mockJwtService.decode.mockReturnValue(mockDecodedHeader);
      mockKeyStoreService.getKeyByKid.mockResolvedValue(null);

      await expect(service.verify(mockToken)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('decode', () => {
    it('should decode a JWT token without verification', () => {
      const mockToken = 'test.jwt.token';
      const mockPayload = { email: 'test@example.com', sub: 1, role: 'admin' };

      mockJwtService.decode.mockReturnValue(mockPayload);

      const result = service.decode(mockToken);

      expect(result).toEqual(mockPayload);
      expect(mockJwtService.decode).toHaveBeenCalledWith(mockToken);
    });

    it('should return null when decode fails', () => {
      const mockToken = 'invalid.jwt.token';

      mockJwtService.decode.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const result = service.decode(mockToken);

      expect(result).toBeNull();
    });
  });

  describe('getActiveKid', () => {
    it('should return the kid of the active key', async () => {
      mockKeyStoreService.getActiveKey.mockResolvedValue(mockJwksKey);

      const result = await service.getActiveKid();

      expect(result).toBe('test-kid-123');
      expect(mockKeyStoreService.getActiveKey).toHaveBeenCalled();
    });

    it('should return null when no active key exists', async () => {
      mockKeyStoreService.getActiveKey.mockResolvedValue(null);

      const result = await service.getActiveKid();

      expect(result).toBeNull();
    });
  });
});
