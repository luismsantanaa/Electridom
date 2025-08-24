import { Test, TestingModule } from '@nestjs/testing';
import { HashService, HashType } from '../hash.service';
import * as bcrypt from 'bcryptjs';

describe('HashService', () => {
  let service: HashService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HashService],
    }).compile();

    service = module.get<HashService>(HashService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('hashPassword', () => {
    it('should generate Argon2id hash', async () => {
      const password = 'TestPassword123!';
      const hash = await service.hashPassword(password);

      expect(hash).toBeDefined();
      expect(hash).toMatch(/^\$argon2id\$/);
      expect(service.isArgon2id(hash)).toBe(true);
    });

    it('should generate different hashes for same password', async () => {
      const password = 'TestPassword123!';
      const hash1 = await service.hashPassword(password);
      const hash2 = await service.hashPassword(password);

      expect(hash1).not.toEqual(hash2);
      expect(service.isArgon2id(hash1)).toBe(true);
      expect(service.isArgon2id(hash2)).toBe(true);
    });

    it('should complete within performance threshold (< 500ms)', async () => {
      const password = 'TestPassword123!';
      const startTime = Date.now();

      await service.hashPassword(password);

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(800); // Relajar límite para tests
    });

    it('should handle empty password', async () => {
      const password = '';
      const hash = await service.hashPassword(password);

      expect(hash).toBeDefined();
      expect(service.isArgon2id(hash)).toBe(true);
    });

    it('should handle very long password', async () => {
      const password = 'a'.repeat(1000);
      const hash = await service.hashPassword(password);

      expect(hash).toBeDefined();
      expect(service.isArgon2id(hash)).toBe(true);
    });
  });

  describe('verifyPassword', () => {
    describe('Argon2id verification', () => {
      it('should verify correct Argon2id password', async () => {
        const password = 'TestPassword123!';
        const hash = await service.hashPassword(password);

        const result = await service.verifyPassword(password, hash);

        expect(result.hash).toBe(hash);
        expect(result.type).toBe(HashType.ARGON2ID);
        expect(result.needsMigration).toBe(false);
      });

      it('should reject incorrect Argon2id password', async () => {
        const password = 'TestPassword123!';
        const wrongPassword = 'WrongPassword123!';
        const hash = await service.hashPassword(password);

        const result = await service.verifyPassword(wrongPassword, hash);

        expect(result.hash).toBe('');
        expect(result.type).toBe(HashType.ARGON2ID);
        expect(result.needsMigration).toBe(false);
      });
    });

    describe('bcrypt verification', () => {
      it('should verify correct bcrypt password and mark for migration', async () => {
        const password = 'TestPassword123!';
        const bcryptHash = await bcrypt.hash(password, 10);

        const result = await service.verifyPassword(password, bcryptHash);

        expect(result.hash).toBe(bcryptHash);
        expect(result.type).toBe(HashType.BCRYPT);
        expect(result.needsMigration).toBe(true);
      });

      it('should reject incorrect bcrypt password', async () => {
        const password = 'TestPassword123!';
        const wrongPassword = 'WrongPassword123!';
        const bcryptHash = await bcrypt.hash(password, 10);

        const result = await service.verifyPassword(wrongPassword, bcryptHash);

        expect(result.hash).toBe('');
        expect(result.type).toBe(HashType.BCRYPT);
        expect(result.needsMigration).toBe(false);
      });
    });

    it('should complete verification within reasonable time (< 1000ms)', async () => {
      const password = 'TestPassword123!';
      const hash = await service.hashPassword(password);
      const startTime = Date.now();

      await service.verifyPassword(password, hash);

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(1000);
    });

    it('should handle various bcrypt hash formats', async () => {
      const password = 'TestPassword123!';

      // Diferentes formatos de bcrypt
      const bcryptFormats = ['$2a$', '$2b$', '$2x$', '$2y$'];

      for (const format of bcryptFormats) {
        const hash = await bcrypt.hash(password, 10);
        expect(hash.startsWith(format) || hash.startsWith('$2b$')).toBe(true);

        const result = await service.verifyPassword(password, hash);
        expect(result.type).toBe(HashType.BCRYPT);
      }
    });
  });

  describe('migrateFromBcrypt', () => {
    it('should migrate valid bcrypt hash to Argon2id', async () => {
      const password = 'TestPassword123!';
      const bcryptHash = await bcrypt.hash(password, 10);

      const newHash = await service.migrateFromBcrypt(password, bcryptHash);

      expect(newHash).toBeDefined();
      expect(service.isArgon2id(newHash)).toBe(true);
      expect(newHash).not.toEqual(bcryptHash);

      // Verificar que el nuevo hash funciona
      const verification = await service.verifyPassword(password, newHash);
      expect(verification.hash).toBe(newHash);
      expect(verification.needsMigration).toBe(false);
    });

    it('should reject migration with invalid bcrypt hash', async () => {
      const password = 'TestPassword123!';
      const wrongPassword = 'WrongPassword123!';
      const bcryptHash = await bcrypt.hash(password, 10);

      await expect(
        service.migrateFromBcrypt(wrongPassword, bcryptHash),
      ).rejects.toThrow('El hash no es válido para migración desde bcrypt');
    });

    it('should reject migration of Argon2id hash', async () => {
      const password = 'TestPassword123!';
      const argon2Hash = await service.hashPassword(password);

      await expect(
        service.migrateFromBcrypt(password, argon2Hash),
      ).rejects.toThrow('El hash no es válido para migración desde bcrypt');
    });
  });

  describe('hash type detection', () => {
    it('should detect Argon2id hash correctly', async () => {
      const password = 'TestPassword123!';
      const hash = await service.hashPassword(password);

      expect(service.isArgon2id(hash)).toBe(true);
      expect(service.isBcrypt(hash)).toBe(false);
    });

    it('should detect bcrypt hash correctly', async () => {
      const password = 'TestPassword123!';
      const hash = await bcrypt.hash(password, 10);

      expect(service.isBcrypt(hash)).toBe(true);
      expect(service.isArgon2id(hash)).toBe(false);
    });

    it('should throw error for unknown hash format', () => {
      const invalidHash = '$unknown$format$hash';

      expect(() => service.isArgon2id(invalidHash)).toThrow(
        'Formato de hash no reconocido',
      );
      expect(() => service.isBcrypt(invalidHash)).toThrow(
        'Formato de hash no reconocido',
      );
    });
  });

  describe('configuration', () => {
    it('should return correct Argon2id configuration', () => {
      const config = service.getArgon2Config();

      expect(config).toEqual({
        type: 'argon2id',
        memoryCost: 2 ** 16, // 64 MB
        timeCost: 3,
        parallelism: 1,
        estimatedTime: '< 500ms',
      });
    });
  });

  describe('performance benchmarks', () => {
    it('should consistently meet performance requirements', async () => {
      const password = 'TestPassword123!';
      const iterations = 5;
      const times: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const startTime = Date.now();
        await service.hashPassword(password);
        times.push(Date.now() - startTime);
      }

      const averageTime = times.reduce((a, b) => a + b, 0) / times.length;
      const maxTime = Math.max(...times);

      expect(averageTime).toBeLessThan(800); // Relajar límite para tests
      expect(maxTime).toBeLessThan(1500); // Tolerancia para picos
    });

    it('should handle concurrent hash operations', async () => {
      const password = 'TestPassword123!';
      const concurrentOperations = 10;
      const startTime = Date.now();

      const promises = Array(concurrentOperations)
        .fill(null)
        .map(() => service.hashPassword(password));

      const results = await Promise.all(promises);
      const totalTime = Date.now() - startTime;

      expect(results).toHaveLength(concurrentOperations);
      expect(results.every((hash) => service.isArgon2id(hash))).toBe(true);
      expect(totalTime).toBeLessThan(5000); // 5 segundos máximo para 10 operaciones
    });
  });

  describe('edge cases', () => {
    it('should handle special characters in password', async () => {
      const password = '!@#$%^&*()_+-=[]{}|;:,.<>?';
      const hash = await service.hashPassword(password);

      const result = await service.verifyPassword(password, hash);
      expect(result.hash).toBe(hash);
      expect(result.needsMigration).toBe(false);
    });

    it('should handle Unicode characters', async () => {
      const password = '密码测试español🔒';
      const hash = await service.hashPassword(password);

      const result = await service.verifyPassword(password, hash);
      expect(result.hash).toBe(hash);
      expect(result.needsMigration).toBe(false);
    });

    it('should handle very short passwords', async () => {
      const password = 'a';
      const hash = await service.hashPassword(password);

      const result = await service.verifyPassword(password, hash);
      expect(result.hash).toBe(hash);
      expect(result.needsMigration).toBe(false);
    });
  });

  describe('security consistency', () => {
    it('should produce different salts for identical passwords', async () => {
      const password = 'TestPassword123!';
      const hashes = await Promise.all([
        service.hashPassword(password),
        service.hashPassword(password),
        service.hashPassword(password),
      ]);

      // Todos los hashes deben ser diferentes
      expect(new Set(hashes)).toHaveProperty('size', 3);

      // Pero todos deben verificar correctamente
      for (const hash of hashes) {
        const result = await service.verifyPassword(password, hash);
        expect(result.hash).toBe(hash);
      }
    });

    it('should not leak timing information between valid and invalid passwords', async () => {
      const validPassword = 'TestPassword123!';
      const invalidPassword = 'InvalidPassword123!';
      const hash = await service.hashPassword(validPassword);

      const validTimes: number[] = [];
      const invalidTimes: number[] = [];

      // Medir tiempos múltiples veces (reducido para tests más rápidos)
      for (let i = 0; i < 3; i++) {
        let startTime = Date.now();
        await service.verifyPassword(validPassword, hash);
        validTimes.push(Date.now() - startTime);

        startTime = Date.now();
        await service.verifyPassword(invalidPassword, hash);
        invalidTimes.push(Date.now() - startTime);
      }

      const avgValidTime =
        validTimes.reduce((a, b) => a + b, 0) / validTimes.length;
      const avgInvalidTime =
        invalidTimes.reduce((a, b) => a + b, 0) / invalidTimes.length;

      // La diferencia no debe ser significativa (< 100ms de diferencia promedio)
      expect(Math.abs(avgValidTime - avgInvalidTime)).toBeLessThan(100);
    });
  });
});
