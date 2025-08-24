import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../../src/app.module';

describe('Auth Simple E2E Test', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
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

  it('should have NODE_ENV set to test', () => {
    expect(process.env.NODE_ENV).toBe('test');
  });

  it('should have database configuration set', () => {
    expect(process.env.DATABASE_NAME).toBeDefined();
    expect(process.env.JWT_SECRET).toBeDefined();
  });

  it('should have all required environment variables', () => {
    const requiredVars = [
      'NODE_ENV',
      'DATABASE_HOST',
      'DATABASE_PORT',
      'DATABASE_USERNAME',
      'DATABASE_PASSWORD',
      'DATABASE_NAME',
      'JWT_SECRET',
      'JWT_EXPIRES_IN',
      'REFRESH_TTL',
      'REFRESH_ROTATE',
      'REFRESH_SALT'
    ];

    requiredVars.forEach(varName => {
      expect(process.env[varName]).toBeDefined();
    });
  });
});
