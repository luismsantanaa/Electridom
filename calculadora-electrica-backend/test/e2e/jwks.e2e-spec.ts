import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { KeyStoreService } from '../../src/modules/jwks/services/key-store.service';

describe('JWKS Endpoints (e2e)', () => {
  let app: INestApplication;
  let keyStoreService: KeyStoreService;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    keyStoreService = moduleFixture.get<KeyStoreService>(KeyStoreService);

    // Asegurar que existe al menos una clave
    await keyStoreService.createInitialKey();

    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('GET /.well-known/jwks.json', () => {
    it('should return JWKS with public keys', () => {
      return request(app.getHttpServer())
        .get('/.well-known/jwks.json')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('success', true);
          expect(res.body).toHaveProperty('data');
          expect(res.body.data).toHaveProperty('keys');
          expect(Array.isArray(res.body.data.keys)).toBe(true);
          expect(res.body.data.keys.length).toBeGreaterThan(0);

          const key = res.body.data.keys[0];
          expect(key).toHaveProperty('kty', 'RSA');
          expect(key).toHaveProperty('kid');
          expect(key).toHaveProperty('n');
          expect(key).toHaveProperty('e', 'AQAB');
          expect(key).toHaveProperty('alg', 'RS256');
          expect(key).toHaveProperty('use', 'sig');
        });
    });

    it('should not expose private keys', () => {
      return request(app.getHttpServer())
        .get('/.well-known/jwks.json')
        .expect(200)
        .expect((res) => {
          const keys = res.body.data.keys;
          keys.forEach((key: any) => {
            expect(key).not.toHaveProperty('d');
            expect(key).not.toHaveProperty('p');
            expect(key).not.toHaveProperty('q');
            expect(key).not.toHaveProperty('dp');
            expect(key).not.toHaveProperty('dq');
            expect(key).not.toHaveProperty('qi');
          });
        });
    });
  });

  describe('Key Rotation', () => {
    it('should rotate keys successfully', async () => {
      // Obtener el estado inicial
      const initialResponse = await request(app.getHttpServer())
        .get('/.well-known/jwks.json')
        .expect(200);

      const initialKeys = initialResponse.body.data.keys;
      const initialKid = initialKeys[0]?.kid;

      // Rotar claves
      const newKey = await keyStoreService.rotateKeys();

      // Verificar que se creó una nueva clave
      expect(newKey.kid).toBeDefined();
      expect(newKey.kid).not.toBe(initialKid);
      expect(newKey.isActive).toBe(true);

      // Verificar que el endpoint JWKS refleja la nueva clave
      const newResponse = await request(app.getHttpServer())
        .get('/.well-known/jwks.json')
        .expect(200);

      const newKeys = newResponse.body.data.keys;
      expect(newKeys.length).toBeGreaterThan(0);

      // La nueva clave debe estar en la respuesta
      const hasNewKey = newKeys.some((key: any) => key.kid === newKey.kid);
      expect(hasNewKey).toBe(true);
    });
  });
});
