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
      ('lighting_va_per_m2', '32.3', 'VA/m2', 'TODO_RIE: valor base', NOW(), NOW()),
      ('socket_max_va_per_circuit', '1800', 'VA', 'TODO_RIE', NOW(), NOW()),
      ('circuit_max_utilization', '0.8', 'ratio', '80%', NOW(), NOW()),
      ('vd_branch_limit_pct', '3', '%', 'Límite recomendado', NOW(), NOW()),
      ('vd_total_limit_pct', '5', '%', 'Límite recomendado', NOW(), NOW()),
      ('system_type', '1', 'ph', '1=monofásico,3=trifásico', NOW(), NOW())
    `);
  });

  describe('/calc/rooms/preview (POST)', () => {
    it('debería calcular cargas por ambiente correctamente', () => {
      const payload = {
        superficies: [
          { nombre: 'Sala', area_m2: 18 },
          { nombre: 'Cocina', area_m2: 12 },
        ],
        consumos: [
          {
            nombre: 'TV',
            ambiente: 'Sala',
            potencia_w: 140,
            tipo: 'electrodomestico',
          },
          {
            nombre: 'Nevera',
            ambiente: 'Cocina',
            potencia_w: 200,
            tipo: 'electrodomestico',
            fp: 0.95,
          },
        ],
      };

      return request(app.getHttpServer())
        .post('/calc/rooms/preview')
        .send(payload)
        .expect(200)
        .expect((res) => {
          expect(res.body.ambientes).toHaveLength(2);
          expect(res.body.ambientes[0].nombre).toBe('Sala');
          expect(res.body.ambientes[1].nombre).toBe('Cocina');
          expect(res.body.totales.tension_v).toBe(120);
          expect(res.body.totales.phases).toBe(1);
          expect(res.body.circuits).toEqual([]);
          expect(res.body.feeder).toEqual({});
          expect(res.body.grounding).toEqual({});
        });
    });

    it('debería manejar configuración de sistema personalizada', () => {
      const payload = {
        system: { voltage: 240, phases: 3, frequency: 50 },
        superficies: [{ nombre: 'Sala', area_m2: 10 }],
        consumos: [],
      };

      return request(app.getHttpServer())
        .post('/calc/rooms/preview')
        .send(payload)
        .expect(200)
        .expect((res) => {
          expect(res.body.totales.tension_v).toBe(240);
          expect(res.body.totales.phases).toBe(3);
        });
    });

    it('debería manejar ambientes sin consumos', () => {
      const payload = {
        superficies: [{ nombre: 'Sala', area_m2: 15 }],
        consumos: [],
      };

      return request(app.getHttpServer())
        .post('/calc/rooms/preview')
        .send(payload)
        .expect(200)
        .expect((res) => {
          expect(res.body.ambientes[0].carga_va).toBeCloseTo(484.5, 1); // 15 * 32.3
          expect(res.body.ambientes[0].observaciones).toContain('Solo carga base de iluminación');
        });
    });

    it('debería validar datos de entrada requeridos', () => {
      const payload = {
        superficies: [],
        consumos: [],
      };

      return request(app.getHttpServer())
        .post('/calc/rooms/preview')
        .send(payload)
        .expect(200);
    });

    it('debería manejar consumos con factor de potencia por defecto', () => {
      const payload = {
        superficies: [{ nombre: 'Sala', area_m2: 10 }],
        consumos: [
          {
            nombre: 'Carga',
            ambiente: 'Sala',
            potencia_w: 100,
            tipo: 'electrodomestico',
          },
        ],
      };

      return request(app.getHttpServer())
        .post('/calc/rooms/preview')
        .send(payload)
        .expect(200)
        .expect((res) => {
          expect(res.body.ambientes[0].carga_va).toBeCloseTo(143.6, 1); // 10*32.3 + 100/0.9
        });
    });

    it('debería ignorar consumos de ambientes no definidos', () => {
      const payload = {
        superficies: [{ nombre: 'Sala', area_m2: 10 }],
        consumos: [
          {
            nombre: 'Carga',
            ambiente: 'AmbienteInexistente',
            potencia_w: 100,
          },
        ],
      };

      return request(app.getHttpServer())
        .post('/calc/rooms/preview')
        .send(payload)
        .expect(200)
        .expect((res) => {
          expect(res.body.ambientes[0].carga_va).toBeCloseTo(323, 1); // Solo iluminación
        });
    });

    it('debería calcular totales correctamente', () => {
      const payload = {
        superficies: [
          { nombre: 'Sala', area_m2: 10 },
          { nombre: 'Cocina', area_m2: 8 },
        ],
        consumos: [
          {
            nombre: 'Carga',
            ambiente: 'Sala',
            potencia_w: 100,
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

    it('debería manejar payload complejo con múltiples ambientes y consumos', () => {
      const payload = {
        system: { voltage: 120, phases: 1, frequency: 60 },
        superficies: [
          { nombre: 'Sala', area_m2: 18 },
          { nombre: 'Cocina', area_m2: 12 },
          { nombre: 'Habitación 1', area_m2: 12 },
          { nombre: 'Baño', area_m2: 5 },
        ],
        consumos: [
          {
            nombre: 'Nevera',
            ambiente: 'Cocina',
            potencia_w: 200,
            tipo: 'electrodomestico',
            fp: 0.95,
          },
          {
            nombre: 'Microondas',
            ambiente: 'Cocina',
            potencia_w: 1200,
            tipo: 'electrodomestico',
            fp: 0.95,
          },
          {
            nombre: 'TV',
            ambiente: 'Sala',
            potencia_w: 140,
            tipo: 'electrodomestico',
          },
          {
            nombre: 'A/C 12k BTU',
            ambiente: 'Habitación 1',
            potencia_w: 1100,
            tipo: 'climatizacion',
            fp: 0.9,
          },
          {
            nombre: 'Lavadora',
            ambiente: 'Baño',
            potencia_w: 500,
            tipo: 'electrodomestico',
            fp: 0.9,
          },
        ],
      };

      return request(app.getHttpServer())
        .post('/calc/rooms/preview')
        .send(payload)
        .expect(200)
        .expect((res) => {
          expect(res.body.ambientes).toHaveLength(4);
          expect(res.body.ambientes[0].nombre).toBe('Sala');
          expect(res.body.ambientes[1].nombre).toBe('Cocina');
          expect(res.body.ambientes[2].nombre).toBe('Habitación 1');
          expect(res.body.ambientes[3].nombre).toBe('Baño');
          
          // Verificar que todos los ambientes tienen carga calculada
          res.body.ambientes.forEach((ambiente: any) => {
            expect(ambiente.carga_va).toBeGreaterThan(0);
            expect(ambiente.fp).toBeGreaterThan(0);
            expect(ambiente.fp).toBeLessThanOrEqual(1);
          });
        });
    });
  });
});
