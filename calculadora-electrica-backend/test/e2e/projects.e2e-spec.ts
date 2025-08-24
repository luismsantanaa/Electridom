import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { DataSource } from 'typeorm';
import * as request from 'supertest';
import { ProjectsModule } from '../../src/modules/projects/projects.module';
import { AuthModule } from '../../src/modules/auth/auth.module';
import { UsersModule } from '../../src/modules/users/users.module';
import { CalculosModule } from '../../src/modules/calculos/calculos.module';
import { RulesModule } from '../../src/modules/rules/rules.module';
import { Project } from '../../src/modules/projects/entities/project.entity';
import { ProjectVersion } from '../../src/modules/projects/entities/project-version.entity';
import { User } from '../../src/modules/users/entities/user.entity';
import { NormRule } from '../../src/modules/rules/entities/norm-rule.entity';
import { RuleSet } from '../../src/modules/rules/entities/rule-set.entity';
import { normRulesSeed } from '../../src/modules/rules/seeds/norm-rules.seed';
import {
  projectFixtures,
  userFixtures,
  authFixtures,
} from './fixtures/project-payloads';
import { testConfig } from './test-config';
import { performanceTester } from './utils/performance-test';
import { coverageReporter } from './coverage-report';
import {
  UserRole,
  UserStatus,
} from '../../src/modules/users/entities/user.entity';

describe('Projects E2E Tests', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let authToken: string;
  let testProjectId: string;
  let testVersionId: string;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
        }),
        TypeOrmModule.forRoot({
          type: 'mariadb',
          host: testConfig.database.host,
          port: testConfig.database.port,
          username: testConfig.database.username,
          password: testConfig.database.password,
          database: testConfig.database.database,
          entities: [Project, ProjectVersion, User, NormRule, RuleSet],
          synchronize: testConfig.database.synchronize,
          logging: testConfig.database.logging,
        }),
        ProjectsModule,
        AuthModule,
        UsersModule,
        CalculosModule,
        RulesModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ transform: true, whitelist: true }),
    );
    await app.init();

    // Obtener DataSource
    dataSource = app.get<DataSource>(DataSource);

    // Seed test data
    const ruleSetRepository = dataSource.getRepository(RuleSet);
    const normRuleRepository = dataSource.getRepository(NormRule);
    const userRepository = dataSource.getRepository(User);

    // Crear un RuleSet por defecto
    const defaultRuleSet = ruleSetRepository.create({
      name: 'Test Rules',
      status: 'ACTIVE',
      description: 'Test rule set for e2e tests',
    });
    await ruleSetRepository.save(defaultRuleSet);

    // Crear reglas con el RuleSet
    for (const ruleData of normRulesSeed) {
      const rule = normRuleRepository.create({
        ...ruleData,
        ruleSet: defaultRuleSet,
      });
      await normRuleRepository.save(rule);
    }

    // Crear usuario de prueba
    const testUser = userRepository.create({
      username: userFixtures.testUser.username,
      email: userFixtures.testUser.email,
      password: userFixtures.testUser.password,
      nombre: userFixtures.testUser.firstName,
      apellido: userFixtures.testUser.lastName,
      role: UserRole.CLIENTE,
      estado: UserStatus.ACTIVO,
    });
    await testUser.hashPassword();
    await userRepository.save(testUser);

    // Autenticar usuario para obtener token
    const loginResponse = await request(app.getHttpServer())
      .post('/v1/auth/login')
      .send(authFixtures.loginData)
      .expect(200);

    authToken = loginResponse.body.access_token;
  }, 30000);

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('POST /v1/projects', () => {
    it('should create project with calculation successfully', async () => {
      const result = await performanceTester.testEndpoint(
        app,
        'POST /v1/projects - Create with calculation',
        'POST',
        '/v1/projects',
        projectFixtures.valid.minimal,
        authToken,
        201,
        2000,
      );

      expect(result.passed).toBe(true);
      expect(result.statusCode).toBe(201);

      const response = result.response;
      expect(response.body).toHaveProperty('projectId');
      expect(response.body).toHaveProperty('projectName');
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('createdAt');
      expect(response.body).toHaveProperty('latestVersion');

      // Guardar ID para tests posteriores
      testProjectId = response.body.projectId;
      testVersionId = response.body.latestVersion.versionId;

      coverageReporter.addTestResult({
        test: 'Create project with calculation',
        status: 'PASSED',
        category: 'CRUD',
      });
    });

    it('should create project without calculation successfully', async () => {
      const result = await performanceTester.testEndpoint(
        app,
        'POST /v1/projects - Create without calculation',
        'POST',
        '/v1/projects',
        projectFixtures.valid.withoutCalculation,
        authToken,
        201,
        2000,
      );

      expect(result.passed).toBe(true);
      expect(result.statusCode).toBe(201);

      const response = result.response;
      expect(response.body).toHaveProperty('projectId');
      expect(response.body).toHaveProperty('projectName');
      expect(response.body).toHaveProperty('status');
      expect(response.body.latestVersion).toBeUndefined();

      coverageReporter.addTestResult({
        test: 'Create project without calculation',
        status: 'PASSED',
        category: 'CRUD',
      });
    });

    it('should return 400 for empty project name', async () => {
      const result = await performanceTester.testEndpoint(
        app,
        'POST /v1/projects - Empty name',
        'POST',
        '/v1/projects',
        projectFixtures.invalid.emptyName,
        authToken,
        400,
        1000,
      );

      expect(result.passed).toBe(true);
      expect(result.statusCode).toBe(400);

      coverageReporter.addTestResult({
        test: 'Create project with empty name',
        status: 'PASSED',
        category: 'Validation',
      });
    });

    it('should return 400 for missing project name', async () => {
      const result = await performanceTester.testEndpoint(
        app,
        'POST /v1/projects - Missing name',
        'POST',
        '/v1/projects',
        projectFixtures.invalid.missingName,
        authToken,
        400,
        1000,
      );

      expect(result.passed).toBe(true);
      expect(result.statusCode).toBe(400);

      coverageReporter.addTestResult({
        test: 'Create project with missing name',
        status: 'PASSED',
        category: 'Validation',
      });
    });

    it('should return 400 for invalid calculation data', async () => {
      const result = await performanceTester.testEndpoint(
        app,
        'POST /v1/projects - Invalid calculation data',
        'POST',
        '/v1/projects',
        projectFixtures.invalid.invalidCalculationData,
        authToken,
        400,
        1000,
      );

      expect(result.passed).toBe(true);
      expect(result.statusCode).toBe(400);

      coverageReporter.addTestResult({
        test: 'Create project with invalid calculation data',
        status: 'PASSED',
        category: 'Validation',
      });
    });
  });

  describe('GET /v1/projects', () => {
    beforeEach(async () => {
      // Crear proyectos de prueba
      await request(app.getHttpServer())
        .post('/v1/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send(projectFixtures.valid.minimal);

      await request(app.getHttpServer())
        .post('/v1/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send(projectFixtures.valid.complete);
    });

    it('should list projects successfully', async () => {
      const result = await performanceTester.testEndpoint(
        app,
        'GET /v1/projects - List projects',
        'GET',
        '/v1/projects',
        null,
        authToken,
        200,
        1000,
      );

      expect(result.passed).toBe(true);
      expect(result.statusCode).toBe(200);

      const response = result.response;
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('page');
      expect(response.body).toHaveProperty('pageSize');
      expect(response.body).toHaveProperty('total');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);

      coverageReporter.addTestResult({
        test: 'List projects',
        status: 'PASSED',
        category: 'CRUD',
      });
    });

    it('should list projects with pagination', async () => {
      const result = await performanceTester.testEndpoint(
        app,
        'GET /v1/projects - List with pagination',
        'GET',
        '/v1/projects?page=1&pageSize=1',
        null,
        authToken,
        200,
        1000,
      );

      expect(result.passed).toBe(true);
      expect(result.statusCode).toBe(200);

      const response = result.response;
      expect(response.body.page).toBe(1);
      expect(response.body.pageSize).toBe(1);
      expect(response.body.data.length).toBeLessThanOrEqual(1);

      coverageReporter.addTestResult({
        test: 'List projects with pagination',
        status: 'PASSED',
        category: 'CRUD',
      });
    });

    it('should list projects with search query', async () => {
      const result = await performanceTester.testEndpoint(
        app,
        'GET /v1/projects - List with search',
        'GET',
        '/v1/projects?query=Completa',
        null,
        authToken,
        200,
        1000,
      );

      expect(result.passed).toBe(true);
      expect(result.statusCode).toBe(200);

      const response = result.response;
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0].projectName).toContain('Completa');

      coverageReporter.addTestResult({
        test: 'List projects with search',
        status: 'PASSED',
        category: 'CRUD',
      });
    });
  });

  describe('POST /v1/projects/:projectId/versions', () => {
    beforeEach(async () => {
      // Crear proyecto de prueba
      const createResponse = await request(app.getHttpServer())
        .post('/v1/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send(projectFixtures.valid.minimal);

      testProjectId = createResponse.body.projectId;
    });

    it('should create new version successfully', async () => {
      const result = await performanceTester.testEndpoint(
        app,
        'POST /v1/projects/:id/versions - Create version',
        'POST',
        `/v1/projects/${testProjectId}/versions`,
        projectFixtures.versions.version2,
        authToken,
        201,
        2000,
      );

      expect(result.passed).toBe(true);
      expect(result.statusCode).toBe(201);

      const response = result.response;
      expect(response.body).toHaveProperty('versionId');
      expect(response.body).toHaveProperty('versionNumber');
      expect(response.body).toHaveProperty('createdAt');
      expect(response.body).toHaveProperty('rulesSignature');
      expect(response.body).toHaveProperty('totales');

      testVersionId = response.body.versionId;

      coverageReporter.addTestResult({
        test: 'Create project version',
        status: 'PASSED',
        category: 'Versioning',
      });
    });

    it('should return 404 for non-existent project', async () => {
      const result = await performanceTester.testEndpoint(
        app,
        'POST /v1/projects/:id/versions - Non-existent project',
        'POST',
        '/v1/projects/non-existent-id/versions',
        projectFixtures.versions.version1,
        authToken,
        404,
        1000,
      );

      expect(result.passed).toBe(true);
      expect(result.statusCode).toBe(404);

      coverageReporter.addTestResult({
        test: 'Create version for non-existent project',
        status: 'PASSED',
        category: 'Error Handling',
      });
    });
  });

  describe('GET /v1/projects/:projectId/versions/:versionId', () => {
    beforeEach(async () => {
      // Crear proyecto y versión de prueba
      const createResponse = await request(app.getHttpServer())
        .post('/v1/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send(projectFixtures.valid.minimal);

      testProjectId = createResponse.body.projectId;
      testVersionId = createResponse.body.latestVersion.versionId;
    });

    it('should get version successfully', async () => {
      const result = await performanceTester.testEndpoint(
        app,
        'GET /v1/projects/:id/versions/:versionId - Get version',
        'GET',
        `/v1/projects/${testProjectId}/versions/${testVersionId}`,
        null,
        authToken,
        200,
        1000,
      );

      expect(result.passed).toBe(true);
      expect(result.statusCode).toBe(200);

      const response = result.response;
      expect(response.body).toHaveProperty('versionId');
      expect(response.body).toHaveProperty('versionNumber');
      expect(response.body).toHaveProperty('createdAt');
      expect(response.body).toHaveProperty('rulesSignature');
      expect(response.body).toHaveProperty('inputData');
      expect(response.body).toHaveProperty('outputTotales');
      expect(response.body).toHaveProperty('outputCargasPorAmbiente');
      expect(response.body).toHaveProperty('outputPropuestaCircuitos');

      coverageReporter.addTestResult({
        test: 'Get project version',
        status: 'PASSED',
        category: 'Versioning',
      });
    });

    it('should return 404 for non-existent version', async () => {
      const result = await performanceTester.testEndpoint(
        app,
        'GET /v1/projects/:id/versions/:versionId - Non-existent version',
        'GET',
        `/v1/projects/${testProjectId}/versions/non-existent-version`,
        null,
        authToken,
        404,
        1000,
      );

      expect(result.passed).toBe(true);
      expect(result.statusCode).toBe(404);

      coverageReporter.addTestResult({
        test: 'Get non-existent version',
        status: 'PASSED',
        category: 'Error Handling',
      });
    });
  });

  describe('PATCH /v1/projects/:projectId', () => {
    beforeEach(async () => {
      // Crear proyecto de prueba
      const createResponse = await request(app.getHttpServer())
        .post('/v1/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send(projectFixtures.valid.minimal);

      testProjectId = createResponse.body.projectId;
    });

    it('should update project name successfully', async () => {
      const result = await performanceTester.testEndpoint(
        app,
        'PATCH /v1/projects/:id - Update name',
        'PATCH',
        `/v1/projects/${testProjectId}`,
        projectFixtures.updates.nameOnly,
        authToken,
        200,
        1000,
      );

      expect(result.passed).toBe(true);
      expect(result.statusCode).toBe(200);

      const response = result.response;
      expect(response.body.projectName).toBe(
        projectFixtures.updates.nameOnly.projectName,
      );

      coverageReporter.addTestResult({
        test: 'Update project name',
        status: 'PASSED',
        category: 'CRUD',
      });
    });

    it('should update project status successfully', async () => {
      const result = await performanceTester.testEndpoint(
        app,
        'PATCH /v1/projects/:id - Update status',
        'PATCH',
        `/v1/projects/${testProjectId}`,
        projectFixtures.updates.statusOnly,
        authToken,
        200,
        1000,
      );

      expect(result.passed).toBe(true);
      expect(result.statusCode).toBe(200);

      const response = result.response;
      expect(response.body.status).toBe(
        projectFixtures.updates.statusOnly.status,
      );

      coverageReporter.addTestResult({
        test: 'Update project status',
        status: 'PASSED',
        category: 'CRUD',
      });
    });

    it('should return 404 for non-existent project', async () => {
      const result = await performanceTester.testEndpoint(
        app,
        'PATCH /v1/projects/:id - Non-existent project',
        'PATCH',
        '/v1/projects/non-existent-id',
        projectFixtures.updates.nameOnly,
        authToken,
        404,
        1000,
      );

      expect(result.passed).toBe(true);
      expect(result.statusCode).toBe(404);

      coverageReporter.addTestResult({
        test: 'Update non-existent project',
        status: 'PASSED',
        category: 'Error Handling',
      });
    });
  });

  describe('GET /v1/projects/:projectId/export', () => {
    beforeEach(async () => {
      // Crear proyecto de prueba
      const createResponse = await request(app.getHttpServer())
        .post('/v1/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send(projectFixtures.valid.complete);

      testProjectId = createResponse.body.projectId;
    });

    it('should export project successfully', async () => {
      const result = await performanceTester.testEndpoint(
        app,
        'GET /v1/projects/:id/export - Export project',
        'GET',
        `/v1/projects/${testProjectId}/export`,
        null,
        authToken,
        200,
        2000,
      );

      expect(result.passed).toBe(true);
      expect(result.statusCode).toBe(200);

      const response = result.response;
      expect(response.body).toHaveProperty('project');
      expect(response.body).toHaveProperty('versions');
      expect(response.body.project).toHaveProperty('projectId');
      expect(response.body.project).toHaveProperty('projectName');
      expect(Array.isArray(response.body.versions)).toBe(true);

      coverageReporter.addTestResult({
        test: 'Export project',
        status: 'PASSED',
        category: 'Export',
      });
    });

    it('should return 404 for non-existent project', async () => {
      const result = await performanceTester.testEndpoint(
        app,
        'GET /v1/projects/:id/export - Non-existent project',
        'GET',
        '/v1/projects/non-existent-id/export',
        null,
        authToken,
        404,
        1000,
      );

      expect(result.passed).toBe(true);
      expect(result.statusCode).toBe(404);

      coverageReporter.addTestResult({
        test: 'Export non-existent project',
        status: 'PASSED',
        category: 'Error Handling',
      });
    });
  });

  // Test de cobertura y performance al final
  afterAll(() => {
    console.log('\n📊 Projects E2E Tests Summary:');
    performanceTester.printSummary();
    coverageReporter.printReport();
  });
});
