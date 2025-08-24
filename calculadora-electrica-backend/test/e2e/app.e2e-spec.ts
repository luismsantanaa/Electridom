import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { DataSource } from 'typeorm';
import * as request from 'supertest';
import { CalculosModule } from '../../src/modules/calculos/calculos.module';
import { RulesModule } from '../../src/modules/rules/rules.module';
import { NormRule } from '../../src/modules/rules/entities/norm-rule.entity';
import { RuleSet } from '../../src/modules/rules/entities/rule-set.entity';
import { normRulesSeed } from '../../src/modules/rules/seeds/norm-rules.seed';
import { calculationFixtures } from './fixtures/calculation-payloads';
import { testConfig } from './test-config';
import { performanceTester } from './utils/performance-test';
import { coverageReporter } from './coverage-report';

describe('Calculations E2E Tests', () => {
  let app: INestApplication;
  let dataSource: DataSource;

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
          entities: [NormRule, RuleSet],
          synchronize: testConfig.database.synchronize,
          logging: testConfig.database.logging,
        }),
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
  }, 30000);

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('POST /v1/calculations/preview', () => {
    it('should calculate preview with minimal payload', async () => {
      const result = await performanceTester.testEndpoint(
        app,
        'POST /v1/calculations/preview - Minimal payload',
        'POST',
        '/v1/calculations/preview',
        calculationFixtures.minimal,
        undefined,
        200,
        800,
      );

      expect(result.passed).toBe(true);
      expect(result.statusCode).toBe(200);

      const response = result.response;
      expect(response.body).toHaveProperty('totales');
      expect(response.body).toHaveProperty('cargasPorAmbiente');
      expect(response.body).toHaveProperty('propuestaCircuitos');
      expect(response.body).toHaveProperty('rulesSignature');

      coverageReporter.addTestResult({
        test: 'Calculate preview with minimal payload',
        status: 'PASSED',
        category: 'Happy Path',
      });
    });

    it('should calculate preview with medium payload', async () => {
      const result = await performanceTester.testEndpoint(
        app,
        'POST /v1/calculations/preview - Medium payload',
        'POST',
        '/v1/calculations/preview',
        calculationFixtures.medium,
        undefined,
        200,
        800,
      );

      expect(result.passed).toBe(true);
      expect(result.statusCode).toBe(200);

      const response = result.response;
      expect(response.body).toHaveProperty('totales');
      expect(response.body).toHaveProperty('cargasPorAmbiente');
      expect(response.body).toHaveProperty('propuestaCircuitos');
      expect(response.body).toHaveProperty('rulesSignature');

      coverageReporter.addTestResult({
        test: 'Calculate preview with medium payload',
        status: 'PASSED',
        category: 'Happy Path',
      });
    });

    it('should calculate preview with large payload', async () => {
      const result = await performanceTester.testEndpoint(
        app,
        'POST /v1/calculations/preview - Large payload',
        'POST',
        '/v1/calculations/preview',
        calculationFixtures.large,
        undefined,
        200,
        800,
      );

      expect(result.passed).toBe(true);
      expect(result.statusCode).toBe(200);

      const response = result.response;
      expect(response.body).toHaveProperty('totales');
      expect(response.body).toHaveProperty('cargasPorAmbiente');
      expect(response.body).toHaveProperty('propuestaCircuitos');
      expect(response.body).toHaveProperty('rulesSignature');

      coverageReporter.addTestResult({
        test: 'Calculate preview with large payload',
        status: 'PASSED',
        category: 'Happy Path',
      });
    });

    it('should return 400 for empty superficies', async () => {
      const result = await performanceTester.testEndpoint(
        app,
        'POST /v1/calculations/preview - Empty superficies',
        'POST',
        '/v1/calculations/preview',
        calculationFixtures.invalid.emptySuperficies,
        undefined,
        400,
        1000,
      );

      expect(result.passed).toBe(true);
      expect(result.statusCode).toBe(400);

      coverageReporter.addTestResult({
        test: 'Calculate preview with empty superficies',
        status: 'PASSED',
        category: 'Validation',
      });
    });

    it('should return 400 for negative area', async () => {
      const result = await performanceTester.testEndpoint(
        app,
        'POST /v1/calculations/preview - Negative area',
        'POST',
        '/v1/calculations/preview',
        calculationFixtures.invalid.negativeArea,
        undefined,
        400,
        1000,
      );

      expect(result.passed).toBe(true);
      expect(result.statusCode).toBe(400);

      coverageReporter.addTestResult({
        test: 'Calculate preview with negative area',
        status: 'PASSED',
        category: 'Validation',
      });
    });

    it('should return 400 for negative watts', async () => {
      const result = await performanceTester.testEndpoint(
        app,
        'POST /v1/calculations/preview - Negative watts',
        'POST',
        '/v1/calculations/preview',
        calculationFixtures.invalid.negativeWatts,
        undefined,
        400,
        1000,
      );

      expect(result.passed).toBe(true);
      expect(result.statusCode).toBe(400);

      coverageReporter.addTestResult({
        test: 'Calculate preview with negative watts',
        status: 'PASSED',
        category: 'Validation',
      });
    });

    it('should return 400 for duplicate environment', async () => {
      const result = await performanceTester.testEndpoint(
        app,
        'POST /v1/calculations/preview - Duplicate environment',
        'POST',
        '/v1/calculations/preview',
        calculationFixtures.invalid.duplicateEnvironment,
        undefined,
        400,
        1000,
      );

      expect(result.passed).toBe(true);
      expect(result.statusCode).toBe(400);

      coverageReporter.addTestResult({
        test: 'Calculate preview with duplicate environment',
        status: 'PASSED',
        category: 'Validation',
      });
    });

    it('should return 400 for consumption in non-existent environment', async () => {
      const result = await performanceTester.testEndpoint(
        app,
        'POST /v1/calculations/preview - Consumption in non-existent environment',
        'POST',
        '/v1/calculations/preview',
        calculationFixtures.invalid.consumptionInNonExistentEnvironment,
        undefined,
        400,
        1000,
      );

      expect(result.passed).toBe(true);
      expect(result.statusCode).toBe(400);

      coverageReporter.addTestResult({
        test: 'Calculate preview with consumption in non-existent environment',
        status: 'PASSED',
        category: 'Validation',
      });
    });

    it('should return 400 for invalid tension', async () => {
      const result = await performanceTester.testEndpoint(
        app,
        'POST /v1/calculations/preview - Invalid tension',
        'POST',
        '/v1/calculations/preview',
        calculationFixtures.invalid.invalidTension,
        undefined,
        400,
        1000,
      );

      expect(result.passed).toBe(true);
      expect(result.statusCode).toBe(400);

      coverageReporter.addTestResult({
        test: 'Calculate preview with invalid tension',
        status: 'PASSED',
        category: 'Validation',
      });
    });

    it('should return 400 for missing required fields', async () => {
      const result = await performanceTester.testEndpoint(
        app,
        'POST /v1/calculations/preview - Missing required fields',
        'POST',
        '/v1/calculations/preview',
        calculationFixtures.invalid.missingRequiredFields,
        undefined,
        400,
        1000,
      );

      expect(result.passed).toBe(true);
      expect(result.statusCode).toBe(400);

      coverageReporter.addTestResult({
        test: 'Calculate preview with missing required fields',
        status: 'PASSED',
        category: 'Validation',
      });
    });
  });

  // Test de cobertura y performance al final
  afterAll(() => {
    console.log('\n📊 Calculations E2E Tests Summary:');
    performanceTester.printSummary();
    coverageReporter.printReport();
  });
});
