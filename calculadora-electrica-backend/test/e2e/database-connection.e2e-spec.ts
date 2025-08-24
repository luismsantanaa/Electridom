import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AppModule } from '../../src/app.module';

describe('Database Connection E2E Test', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    dataSource = moduleFixture.get<DataSource>(DataSource);
    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('should connect to database successfully', async () => {
    expect(dataSource).toBeDefined();
    expect(dataSource.isInitialized).toBe(true);
    
    // Verificar que podemos hacer una consulta simple
    const result = await dataSource.query('SELECT 1 as test');
    expect(result).toEqual([{ test: 1 }]);
  });

  it('should have users table accessible', async () => {
    const result = await dataSource.query('SHOW TABLES LIKE "users"');
    expect(result.length).toBeGreaterThan(0);
  });

  it('should have sessions table accessible', async () => {
    const result = await dataSource.query('SHOW TABLES LIKE "sessions"');
    expect(result.length).toBeGreaterThan(0);
  });

  it('should have test user in database', async () => {
    const result = await dataSource.query(
      'SELECT COUNT(*) as count FROM users WHERE email = ?',
      ['test@example.com']
    );
    expect(parseInt(result[0].count)).toBeGreaterThan(0);
  });

  it('should be able to query sessions table', async () => {
    const result = await dataSource.query('SELECT COUNT(*) as count FROM sessions');
    expect(result[0].count).toBeDefined();
  });
});
