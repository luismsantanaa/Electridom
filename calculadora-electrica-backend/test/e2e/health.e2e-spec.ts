import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('Health E2E Tests', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    
    // Configurar prefijo global para tests
    app.setGlobalPrefix('api');
    
    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('should be defined', () => {
    expect(app).toBeDefined();
  });

  it('should have health endpoint available with all checks', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/health')
      .expect(200);

    console.log('Health response:', JSON.stringify(response.body, null, 2));
    
    // Verificar estructura de respuesta (envuelta en data)
    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('data');
    expect(response.body.data).toHaveProperty('status');
    expect(response.body.data).toHaveProperty('info');
    expect(response.body.data).toHaveProperty('error');
    expect(response.body.data).toHaveProperty('details');
    
    // Verificar que todos los health checks están presentes
    expect(response.body.data.info).toHaveProperty('liveness');
    expect(response.body.data.info).toHaveProperty('database');
    expect(response.body.data.info).toHaveProperty('disk');
    
    // Verificar que todos están "up"
    expect(response.body.data.info.liveness.status).toBe('up');
    expect(response.body.data.info.database.status).toBe('up');
    expect(response.body.data.info.disk.status).toBe('up');
  });
});
