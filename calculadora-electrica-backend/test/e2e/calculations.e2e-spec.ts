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
    
    // Limpiar datos existentes
    await normRuleRepository.clear();
    await ruleSetRepository.clear();
    
    // Crear un RuleSet por defecto
    const defaultRuleSet = ruleSetRepository.create({
      name: 'Test Rules',
      version: '1.0.0',
      isActive: true,
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
      // Limpiar datos de test
      const normRuleRepository = dataSource.getRepository(NormRule);
      const ruleSetRepository = dataSource.getRepository(RuleSet);
      
      await normRuleRepository.clear();
      await ruleSetRepository.clear();
      
      await app.close();
    }
  });

  describe('POST /v1/calculations/preview', () => {
    it('should calculate preview with minimal payload successfully', () => {
      return request(app.getHttpServer())
        .post('/v1/calculations/preview')
        .send(calculationFixtures.minimal)
        .expect(200)
        .expect((res) => {
          // Validar estructura básica de respuesta
          expect(res.body).toHaveProperty('cargasPorAmbiente');
          expect(res.body).toHaveProperty('totales');
          expect(res.body).toHaveProperty('propuestaCircuitos');
          expect(res.body).toHaveProperty('warnings');
          expect(res.body).toHaveProperty('traceId');

          // Validar tipos de datos
          expect(Array.isArray(res.body.cargasPorAmbiente)).toBe(true);
          expect(typeof res.body.totales.totalConectadaVA).toBe('number');
          expect(typeof res.body.totales.demandaEstimadaVA).toBe('number');
          expect(Array.isArray(res.body.propuestaCircuitos)).toBe(true);
          expect(Array.isArray(res.body.warnings)).toBe(true);
          expect(typeof res.body.traceId).toBe('string');

          // Validar valores lógicos
          expect(res.body.cargasPorAmbiente).toHaveLength(1);
          expect(res.body.totales.totalConectadaVA).toBeGreaterThan(0);
          expect(res.body.totales.demandaEstimadaVA).toBeGreaterThan(0);
        });
    });

    it('should return 400 for empty superficies', () => {
      return request(app.getHttpServer())
        .post('/v1/calculations/preview')
        .send(calculationFixtures.invalid.emptySuperficies)
        .expect(400)
        .expect((res) => {
          expect(res.body).toHaveProperty('traceId');
          expect(res.body).toHaveProperty('errors');
          expect(Array.isArray(res.body.errors)).toBe(true);
          expect(res.body.errors.length).toBeGreaterThan(0);
        });
    });

    it('should return 400 for negative area', () => {
      return request(app.getHttpServer())
        .post('/v1/calculations/preview')
        .send(calculationFixtures.invalid.negativeArea)
        .expect(400)
        .expect((res) => {
          expect(res.body).toHaveProperty('errors');
          expect(res.body.errors.length).toBeGreaterThan(0);
        });
    });

    it('should return 400 for negative watts', () => {
      return request(app.getHttpServer())
        .post('/v1/calculations/preview')
        .send(calculationFixtures.invalid.negativeWatts)
        .expect(400)
        .expect((res) => {
          expect(res.body).toHaveProperty('errors');
          expect(res.body.errors.length).toBeGreaterThan(0);
        });
    });

    it('should return 400 for duplicate environments', () => {
      return request(app.getHttpServer())
        .post('/v1/calculations/preview')
        .send(calculationFixtures.invalid.duplicateEnvironment)
        .expect(400)
        .expect((res) => {
          expect(res.body).toHaveProperty('errors');
          expect(res.body.errors.length).toBeGreaterThan(0);
        });
    });

    it('should return 400 for consumption in non-existent environment', () => {
      return request(app.getHttpServer())
        .post('/v1/calculations/preview')
        .send(calculationFixtures.invalid.consumptionInNonExistentEnvironment)
        .expect(400)
        .expect((res) => {
          expect(res.body).toHaveProperty('errors');
          expect(res.body.errors.length).toBeGreaterThan(0);
        });
    });

    it('should handle factorUso in consumptions correctly', () => {
      const payloadWithFactorUso = {
        ...calculationFixtures.minimal,
        consumos: [
          { nombre: 'TV', ambiente: 'Sala', watts: 120, factorUso: 0.8 },
        ],
      };

      return request(app.getHttpServer())
        .post('/v1/calculations/preview')
        .send(payloadWithFactorUso)
        .expect(200)
        .expect((res) => {
          const sala = res.body.cargasPorAmbiente.find(c => c.ambiente === 'Sala');
          expect(sala.tomasVA).toBe(96); // 120 * 0.8
        });
    });

    it('should include traceId in response headers', () => {
      return request(app.getHttpServer())
        .post('/v1/calculations/preview')
        .send(calculationFixtures.minimal)
        .expect(200)
        .expect((res) => {
          expect(res.headers).toHaveProperty('x-trace-id');
          expect(res.body).toHaveProperty('traceId');
          expect(res.headers['x-trace-id']).toBe(res.body.traceId);
        });
    });
  });
});
