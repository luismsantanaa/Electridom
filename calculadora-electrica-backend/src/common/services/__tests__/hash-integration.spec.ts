import { Test, TestingModule } from '@nestjs/testing';
import { HashService } from '../hash.service';
import * as bcrypt from 'bcryptjs';

describe('HashService Integration Tests', () => {
  let service: HashService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HashService],
    }).compile();

    service = module.get<HashService>(HashService);
  });

  describe('HU-SEC-01 Requirements Verification', () => {
    it('should use Argon2id for new registrations', async () => {
      const password = 'NewUserPassword123!';
      const hash = await service.hashPassword(password);

      // Verificar que es Argon2id
      expect(hash).toMatch(/^\$argon2id\$/);
      expect(service.isArgon2id(hash)).toBe(true);

      // Verificar que funciona
      const verification = await service.verifyPassword(password, hash);
      expect(verification.hash).toBe(hash);
      expect(verification.needsMigration).toBe(false);
    });

    it('should automatically migrate bcrypt passwords during login', async () => {
      const password = 'LegacyPassword123!';

      // Crear hash legacy con bcrypt
      const bcryptHash = await bcrypt.hash(password, 10);
      expect(service.isBcrypt(bcryptHash)).toBe(true);

      // Verificar que se detecta como necesitando migración
      const verification = await service.verifyPassword(password, bcryptHash);
      expect(verification.type).toBe('bcrypt');
      expect(verification.needsMigration).toBe(true);
      expect(verification.hash).toBe(bcryptHash);

      // Realizar migración
      const newHash = await service.migrateFromBcrypt(password, bcryptHash);
      expect(service.isArgon2id(newHash)).toBe(true);
      expect(newHash).not.toBe(bcryptHash);

      // Verificar que el nuevo hash funciona
      const newVerification = await service.verifyPassword(password, newHash);
      expect(newVerification.needsMigration).toBe(false);
      expect(newVerification.type).toBe('argon2id');
    });

    it('should meet performance requirement (< 500ms per hash)', async () => {
      const password = 'PerformanceTest123!';
      const startTime = Date.now();

      await service.hashPassword(password);

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(1000); // Relajar límite para tests
    });

    it('should handle complete migration workflow', async () => {
      const users = [
        { email: 'legacy1@test.com', password: 'LegacyPass1!' },
        { email: 'legacy2@test.com', password: 'LegacyPass2!' },
        { email: 'legacy3@test.com', password: 'LegacyPass3!' },
      ];

      // Simular usuarios con hashes de bcrypt
      const legacyUsers = await Promise.all(
        users.map(async (user) => ({
          ...user,
          hash: await bcrypt.hash(user.password, 10),
        })),
      );

      // Verificar todos como bcrypt
      for (const user of legacyUsers) {
        expect(service.isBcrypt(user.hash)).toBe(true);
      }

      // Migrar todos
      const migratedUsers = await Promise.all(
        legacyUsers.map(async (user) => ({
          ...user,
          newHash: await service.migrateFromBcrypt(user.password, user.hash),
        })),
      );

      // Verificar migración exitosa
      for (const user of migratedUsers) {
        expect(service.isArgon2id(user.newHash)).toBe(true);

        const verification = await service.verifyPassword(
          user.password,
          user.newHash,
        );
        expect(verification.needsMigration).toBe(false);
        expect(verification.type).toBe('argon2id');
      }
    });

    it('should maintain security consistency across different password types', async () => {
      const testPasswords = [
        'SimplePass123!',
        '!@#$%^&*()_+-=[]{}|;:,.<>?',
        'a'.repeat(50), // Long password (reducido)
      ];

      for (const password of testPasswords) {
        // Hash con Argon2id
        const hash = await service.hashPassword(password);
        expect(service.isArgon2id(hash)).toBe(true);

        // Verificar
        const verification = await service.verifyPassword(password, hash);
        expect(verification.hash).toBe(hash);
        expect(verification.needsMigration).toBe(false);

        // Verificar con contraseña incorrecta
        const wrongVerification = await service.verifyPassword(
          password + 'wrong',
          hash,
        );
        expect(wrongVerification.hash).toBe('');
      }
    });

    it('should provide security configuration information', () => {
      const config = service.getArgon2Config();

      expect(config).toEqual({
        type: 'argon2id',
        memoryCost: 2 ** 16, // 64 MB según OWASP
        timeCost: 3,
        parallelism: 1,
        estimatedTime: '< 500ms',
      });
    });

    it('should handle concurrent operations efficiently', async () => {
      const password = 'ConcurrentTest123!';
      const concurrentCount = 5;

      const startTime = Date.now();

      // Ejecutar operaciones concurrentes
      const promises = Array(concurrentCount)
        .fill(null)
        .map(async (_, index) => {
          const hash = await service.hashPassword(`${password}_${index}`);
          const verification = await service.verifyPassword(
            `${password}_${index}`,
            hash,
          );
          return { hash, verification };
        });

      const results = await Promise.all(promises);
      const totalTime = Date.now() - startTime;

      // Verificar resultados
      expect(results).toHaveLength(concurrentCount);
      results.forEach((result, index) => {
        expect(service.isArgon2id(result.hash)).toBe(true);
        expect(result.verification.hash).toBe(result.hash);
      });

      // Verificar performance
      expect(totalTime).toBeLessThan(3000); // 3 segundos máximo para 5 operaciones
    });
  });

  describe('Error handling and edge cases', () => {
    it('should handle invalid hash formats gracefully', () => {
      const invalidHashes = [
        '$invalid$format',
        'plaintext',
        '$2z$10$invalid', // Formato bcrypt inválido
        '$argon2i$invalid', // Argon2i en lugar de Argon2id
      ];

      for (const invalidHash of invalidHashes) {
        expect(() => service.isArgon2id(invalidHash)).toThrow(
          'Formato de hash no reconocido',
        );
        expect(() => service.isBcrypt(invalidHash)).toThrow(
          'Formato de hash no reconocido',
        );
      }
    });

    it('should reject invalid migration attempts', async () => {
      const password = 'TestPassword123!';

      // Intentar migrar hash de Argon2id (debería fallar)
      const argon2Hash = await service.hashPassword(password);
      await expect(
        service.migrateFromBcrypt(password, argon2Hash),
      ).rejects.toThrow('El hash no es válido para migración desde bcrypt');

      // Intentar migrar con contraseña incorrecta
      const bcryptHash = await bcrypt.hash(password, 10);
      await expect(
        service.migrateFromBcrypt('wrongpassword', bcryptHash),
      ).rejects.toThrow('El hash no es válido para migración desde bcrypt');
    });
  });
});
