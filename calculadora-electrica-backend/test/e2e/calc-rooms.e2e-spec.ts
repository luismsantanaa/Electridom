import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { DataSource } from 'typeorm';

describe('CalcRoomsController (e2e)', () => {
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
    await app.close();
  });

  beforeEach(async () => {
    // Limpiar base de datos antes de cada test
    await dataSource.query('DELETE FROM norm_const');
    
    // Insertar parámetros normativos necesarios
    await dataSource.query(`
      INSERT INTO norm_const (key, value, unit, notes, created_at, updated_at) VALUES
      ('lighting_va_per_m2', '32.3', 'VA/m2', 'TODO_RIE: value base', NOW(), NOW()),
      ('socket_max_va_per_circuit', '1800', 'VA', 'TODO_RIE', NOW(), NOW()),
      ('circuit_max_utilization', '0.8', 'ratio', '80%', NOW(), NOW()),
      ('vd_branch_limit_pct', '3', '%', 'Límite recomendado', NOW(), NOW()),
      ('vd_total_limit_pct', '5', '%', 'Límite recomendado', NOW(), NOW()),
      ('system_type', '1', 'ph', '1=monofásico,3=trifásico', NOW(), NOW())
    `);
  });

  describe('/calc/rooms/preview (POST)', () => {
    it('debería calcular loads por environment correctamente', () => {
      const payload = {
        surfaces: [
          { name: 'Sala', area_m2: 18 },
          { name: 'Cocina', area_m2: 12 },
        ],
        consumptions: [
          {
            name: 'TV',
            environment: 'Sala',
            power_w: 140,
            type: 'electrodomestico',
          },
          {
            name: 'Nevera',
            environment: 'Cocina',
            power_w: 200,
            type: 'electrodomestico',
            fp: 0.95,
          },
        ],
      };

      return request(app.getHttpServer())
        .post('/calc/rooms/preview')
        .send(payload)
        .expect(200)
        .expect((res) => {
          expect(res.body.environments).toHaveLength(2);
          expect(res.body.environments[0].name).toBe('Sala');
          expect(res.body.environments[1].name).toBe('Cocina');
          expect(res.body.totales.voltage_v).toBe(120);
          expect(res.body.totales.phases).toBe(1);
          expect(res.body.circuits).toEqual([]);
          expect(res.body.feeder).toEqual({});
          expect(res.body.grounding).toEqual({});
        });
    });

    it('debería manejar configuración de system personalizada', () => {
      const payload = {
        system: { voltage: 240, phases: 3, frequency: 50 },
        surfaces: [{ name: 'Sala', area_m2: 10 }],
        consumptions: [],
      };

      return request(app.getHttpServer())
        .post('/calc/rooms/preview')
        .send(payload)
        .expect(200)
        .expect((res) => {
          expect(res.body.totales.voltage_v).toBe(240);
          expect(res.body.totales.phases).toBe(3);
        });
    });

    it('debería manejar environments sin consumptions', () => {
      const payload = {
        surfaces: [{ name: 'Sala', area_m2: 15 }],
        consumptions: [],
      };

      return request(app.getHttpServer())
        .post('/calc/rooms/preview')
        .send(payload)
        .expect(200)
        .expect((res) => {
          expect(res.body.environments[0].carga_va).toBeCloseTo(484.5, 1); // 15 * 32.3
          expect(res.body.environments[0].observaciones).toContain('Solo load base de iluminación');
        });
    });

    it('debería validar datos de entrada requeridos', () => {
      const payload = {
        surfaces: [],
        consumptions: [],
      };

      return request(app.getHttpServer())
        .post('/calc/rooms/preview')
        .send(payload)
        .expect(200);
    });

    it('debería manejar consumptions con factor de potencia por defecto', () => {
      const payload = {
        surfaces: [{ name: 'Sala', area_m2: 10 }],
        consumptions: [
          {
            name: 'load',
            environment: 'Sala',
            power_w: 100,
            type: 'electrodomestico',
          },
        ],
      };

      return request(app.getHttpServer())
        .post('/calc/rooms/preview')
        .send(payload)
        .expect(200)
        .expect((res) => {
          expect(res.body.environments[0].carga_va).toBeCloseTo(143.6, 1); // 10*32.3 + 100/0.9
        });
    });

    it('debería ignorar consumptions de environments no definidos', () => {
      const payload = {
        surfaces: [{ name: 'Sala', area_m2: 10 }],
        consumptions: [
          {
            name: 'load',
            environment: 'AmbienteInexistente',
            power_w: 100,
          },
        ],
      };

      return request(app.getHttpServer())
        .post('/calc/rooms/preview')
        .send(payload)
        .expect(200)
        .expect((res) => {
          expect(res.body.environments[0].carga_va).toBeCloseTo(323, 1); // Solo iluminación
        });
    });

    it('debería calcular totales correctamente', () => {
      const payload = {
        surfaces: [
          { name: 'Sala', area_m2: 10 },
          { name: 'Cocina', area_m2: 8 },
        ],
        consumptions: [
          {
            name: 'load',
            environment: 'Sala',
            power_w: 100,
            fp: 0.9,
          },
        ],
      };

      return request(app.getHttpServer())
        .post('/calc/rooms/preview')
        .send(payload)
        .expect(200)
        .expect((res) => {
          const cargaTotal = 10 * 32.3 + 8 * 32.3 + 100 / 0.9;
          expect(res.body.totales.carga_total_va).toBeCloseTo(cargaTotal, 1);
          expect(res.body.totales.corriente_total_a).toBeCloseTo(cargaTotal / 120, 1);
        });
    });

    it('debería manejar payload complejo con múltiples environments y consumptions', () => {
      const payload = {
        system: { voltage: 120, phases: 1, frequency: 60 },
        surfaces: [
          { name: 'Sala', area_m2: 18 },
          { name: 'Cocina', area_m2: 12 },
          { name: 'Habitación 1', area_m2: 12 },
          { name: 'Baño', area_m2: 5 },
        ],
        consumptions: [
          {
            name: 'Nevera',
            environment: 'Cocina',
            power_w: 200,
            type: 'electrodomestico',
            fp: 0.95,
          },
          {
            name: 'Microondas',
            environment: 'Cocina',
            power_w: 1200,
            type: 'electrodomestico',
            fp: 0.95,
          },
          {
            name: 'TV',
            environment: 'Sala',
            power_w: 140,
            type: 'electrodomestico',
          },
          {
            name: 'A/C 12k BTU',
            environment: 'Habitación 1',
            power_w: 1100,
            type: 'climatizacion',
            fp: 0.9,
          },
          {
            name: 'Lavadora',
            environment: 'Baño',
            power_w: 500,
            type: 'electrodomestico',
            fp: 0.9,
          },
        ],
      };

      return request(app.getHttpServer())
        .post('/calc/rooms/preview')
        .send(payload)
        .expect(200)
        .expect((res) => {
          expect(res.body.environments).toHaveLength(4);
          expect(res.body.environments[0].name).toBe('Sala');
          expect(res.body.environments[1].name).toBe('Cocina');
          expect(res.body.environments[2].name).toBe('Habitación 1');
          expect(res.body.environments[3].name).toBe('Baño');
          
          // Verificar que todos los environments tienen load calculada
          res.body.environments.forEach((environment: any) => {
            expect(environment.carga_va).toBeGreaterThan(0);
            expect(environment.fp).toBeGreaterThan(0);
            expect(environment.fp).toBeLessThanOrEqual(1);
          });
        });
    });
  });
});

