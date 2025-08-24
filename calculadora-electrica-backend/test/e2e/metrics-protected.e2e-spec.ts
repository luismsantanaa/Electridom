import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('Metrics Protected E2E Tests', () => {
  let app: INestApplication;

  beforeAll(async () => {
    // Configurar variables de entorno para tests con token
    process.env.METRICS_ENABLED = 'true';
    process.env.LOG_LEVEL = 'silent';
    process.env.METRICS_TOKEN = 'test_token';
    
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('M2: /metrics protegido', () => {
    it('debe devolver 401/403 cuando METRICS_TOKEN está definido y no se proporciona', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/metrics')
        .expect(401);

      // Verificar que es un error de autorización
      expect(response.status).toBe(401);
    });

    it('debe devolver 200 cuando se proporciona el token correcto', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/metrics')
        .set('X-Metrics-Token', 'test_token')
        .expect(200);

      expect(response.headers['content-type']).toContain('text/plain');
      expect(response.text).toContain('# HELP');
    });
  });
});
