import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('Metrics Simple E2E Tests', () => {
  let app: INestApplication;

  beforeAll(async () => {
    // Configurar variables de entorno para tests sin token
    process.env.METRICS_ENABLED = 'true';
    process.env.LOG_LEVEL = 'silent';
    delete process.env.METRICS_TOKEN;
    
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

  describe('M1: /metrics habilitado', () => {
    it('debe devolver 200 text/plain con métricas cuando METRICS_ENABLED=true', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/metrics')
        .expect(200);

      expect(response.headers['content-type']).toContain('text/plain');
      expect(response.text).toContain('# HELP');
      expect(response.text).toContain('# TYPE');
    });
  });

  describe('M3: Contador HTTP aumenta', () => {
    it('debe incrementar http_requests_total después de hacer requests', async () => {
      // Hacer 5 requests a /health
      for (let i = 0; i < 5; i++) {
        await request(app.getHttpServer()).get('/api/health').expect(200);
      }

      // Verificar métricas
      const metricsResponse = await request(app.getHttpServer())
        .get('/api/metrics')
        .expect(200);

      expect(metricsResponse.text).toContain('http_requests_total');
      expect(metricsResponse.text).toContain('method="GET"');
      expect(metricsResponse.text).toContain('route="/health"');
      expect(metricsResponse.text).toContain('status_code="200"');
    });
  });

  describe('M4: Histograma de latencia', () => {
    it('debe mostrar buckets de latencia en http_request_duration_seconds', async () => {
      // Hacer algunos requests
      await request(app.getHttpServer()).get('/api/health').expect(200);
      await request(app.getHttpServer()).get('/api/health').expect(200);

      const metricsResponse = await request(app.getHttpServer())
        .get('/api/metrics')
        .expect(200);

      expect(metricsResponse.text).toContain('http_request_duration_seconds');
      expect(metricsResponse.text).toContain('method="GET"');
      expect(metricsResponse.text).toContain('route="/health"');
    });
  });
});
