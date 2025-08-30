import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { DataSource } from 'typeorm';
import { Resistivity } from '../../src/modules/calculos/entities/resistivity.entity';

describe('CalcFeederController (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    dataSource = moduleFixture.get<DataSource>(DataSource);
  });

  beforeEach(async () => {
    // Limpiar datos de prueba
    await dataSource.query('DELETE FROM resistivity');
    await dataSource.query('DELETE FROM norm_const');

    // Insertar resistividades de prueba
    const resistivityRepository = dataSource.getRepository(Resistivity);
    await resistivityRepository.save([
      {
        material: 'Cu',
        seccionMm2: 2.5,
        ohmKm: 7.41,
        notes: 'Cable de cobre 2.5mm² - resistivity estándar',
        usrCreate: 'TEST',
        usrUpdate: 'TEST',
        active: true,
      },
      {
        material: 'Cu',
        seccionMm2: 4,
        ohmKm: 4.61,
        notes: 'Cable de cobre 4mm² - resistivity estándar',
        usrCreate: 'TEST',
        usrUpdate: 'TEST',
        active: true,
      },
      {
        material: 'Cu',
        seccionMm2: 6,
        ohmKm: 3.08,
        notes: 'Cable de cobre 6mm² - resistivity estándar',
        usrCreate: 'TEST',
        usrUpdate: 'TEST',
        active: true,
      },
      {
        material: 'Cu',
        seccionMm2: 10,
        ohmKm: 1.83,
        notes: 'Cable de cobre 10mm² - resistivity estándar',
        usrCreate: 'TEST',
        usrUpdate: 'TEST',
        active: true,
      },
      {
        material: 'Cu',
        seccionMm2: 16,
        ohmKm: 1.15,
        notes: 'Cable de cobre 16mm² - resistivity estándar',
        usrCreate: 'TEST',
        usrUpdate: 'TEST',
        active: true,
      },
      {
        material: 'Cu',
        seccionMm2: 25,
        ohmKm: 0.727,
        notes: 'Cable de cobre 25mm² - resistivity estándar',
        usrCreate: 'TEST',
        usrUpdate: 'TEST',
        active: true,
      },
    ]);

    // Insertar parámetros normativos
    await dataSource.query(`
      INSERT INTO norm_const (key, value, description, usr_create, usr_update, active) VALUES
      ('vd_branch_limit_pct', '3', 'Límite de caída de tensión en ramal (%)', 'TEST', 'TEST', 1),
      ('vd_total_limit_pct', '5', 'Límite de caída de tensión total (%)', 'TEST', 'TEST', 1)
    `);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /calc/feeder/preview', () => {
    const validRequest = {
      circuitos_ramales: [
        {
          id_circuito: 'CIRC-001',
          name: 'Iluminación Habitación 1',
          corriente_total_a: 8.5,
          carga_total_va: 1020,
          length_m: 15,
        },
        {
          id_circuito: 'CIRC-002',
          name: 'Enchufes Habitación 1',
          corriente_total_a: 12.3,
          carga_total_va: 1476,
          length_m: 18,
        },
        {
          id_circuito: 'CIRC-003',
          name: 'Cocina',
          corriente_total_a: 25.8,
          carga_total_va: 3096,
          length_m: 25,
        },
        {
          id_circuito: 'CIRC-004',
          name: 'Aire Acondicionado',
          corriente_total_a: 15.2,
          carga_total_va: 1824,
          length_m: 30,
        },
      ],
      system: {
        voltage_v: 120,
        phases: 1,
        corriente_total_a: 61.8,
        carga_total_va: 7416,
      },
      parameters: {
        longitud_alimentador_m: 50,
        material_conductor: 'Cu',
        max_caida_ramal_pct: 3,
        max_caida_total_pct: 5,
      },
      observaciones: [
        'Instalación residencial monofásica',
        'feeder desde medidor hasta panel principal',
      ],
    };

    it('should analyze voltage drop for residential installation', () => {
      return request(app.getHttpServer())
        .post('/calc/feeder/preview')
        .send(validRequest)
        .expect(200)
        .expect((res) => {
          expect(res.body.circuitos_analisis).toHaveLength(4);
          expect(res.body.feeder).toBeDefined();
          expect(res.body.resumen).toBeDefined();
          expect(res.body.metadata).toBeDefined();

          // Verificar estructura de circuitos_analisis
          res.body.circuitos_analisis.forEach((circuit: any) => {
            expect(circuit.id_circuito).toBeDefined();
            expect(circuit.name).toBeDefined();
            expect(circuit.current_a).toBeGreaterThan(0);
            expect(circuit.length_m).toBeGreaterThan(0);
            expect(circuit.caida_tension_ramal_v).toBeGreaterThan(0);
            expect(circuit.caida_tension_ramal_pct).toBeGreaterThan(0);
            expect(['OK', 'WARNING', 'ERROR']).toContain(circuit.estado);
          });

          // Verificar estructura del feeder
          expect(res.body.feeder.corriente_total_a).toBe(61.8);
          expect(res.body.feeder.length_m).toBe(50);
          expect(res.body.feeder.material).toBe('Cu');
          expect(res.body.feeder.section_mm2).toBeGreaterThan(0);
          expect(res.body.feeder.resistencia_ohm_km).toBeGreaterThan(0);
          expect(res.body.feeder.caida_tension_alimentador_v).toBeGreaterThan(
            0,
          );
          expect(res.body.feeder.caida_tension_alimentador_pct).toBeGreaterThan(
            0,
          );
          expect(res.body.feeder.longitud_critica_m).toBeGreaterThan(0);
          expect(['OK', 'WARNING', 'ERROR']).toContain(res.body.feeder.estado);

          // Verificar resumen
          expect(res.body.resumen.tension_nominal_v).toBe(120);
          expect(res.body.resumen.phases).toBe(1);
          expect(res.body.resumen.limite_caida_ramal_pct).toBe(3);
          expect(res.body.resumen.limite_caida_total_pct).toBe(5);
          expect(res.body.resumen.caida_total_maxima_pct).toBeGreaterThan(0);
          expect(
            res.body.resumen.circuitos_fuera_limite,
          ).toBeGreaterThanOrEqual(0);
          expect(['OK', 'WARNING', 'ERROR']).toContain(
            res.body.resumen.estado_general,
          );
          expect(
            res.body.resumen.calibre_minimo_recomendado_mm2,
          ).toBeGreaterThan(0);

          // Verificar metadata
          expect(res.body.metadata.version).toBeDefined();
          expect(res.body.metadata.timestamp).toBeDefined();
          expect(res.body.metadata.duracion_calculo_ms).toBeGreaterThan(0);
          expect(res.body.metadata.algoritmo_usado).toBe(
            'voltage_drop_analysis_with_feeder_selection',
          );
        });
    });

    it('should handle circuits with long lengths (critical case)', () => {
      const longLengthRequest = {
        ...validRequest,
        circuitos_ramales: [
          {
            id_circuito: 'CIRC-001',
            name: 'Iluminación Exterior',
            corriente_total_a: 5.2,
            carga_total_va: 624,
            length_m: 80,
          },
          {
            id_circuito: 'CIRC-002',
            name: 'Bomba de Agua',
            corriente_total_a: 18.5,
            carga_total_va: 2220,
            length_m: 120,
          },
        ],
        system: {
          voltage_v: 240,
          phases: 1,
          corriente_total_a: 23.7,
          carga_total_va: 2844,
        },
        parameters: {
          longitud_alimentador_m: 200,
          material_conductor: 'Cu',
          max_caida_ramal_pct: 2.5,
          max_caida_total_pct: 4,
        },
      };

      return request(app.getHttpServer())
        .post('/calc/feeder/preview')
        .send(longLengthRequest)
        .expect(200)
        .expect((res) => {
          expect(res.body.circuitos_analisis).toHaveLength(2);

          // Verificar que los circuits largos tengan mayor caída de tensión
          const circuitosConAltaCaida = res.body.circuitos_analisis.filter(
            (c: any) => c.caida_tension_ramal_pct > 2,
          );
          expect(circuitosConAltaCaida.length).toBeGreaterThan(0);

          // Verificar que el feeder seleccione sección apropiada
          expect(res.body.feeder.section_mm2).toBeGreaterThanOrEqual(16);
        });
    });

    it('should handle aluminum conductors', () => {
      // Insertar resistividades de aluminio
      const resistivityRepository = dataSource.getRepository(Resistivity);
      resistivityRepository.save([
        {
          material: 'Al',
          seccionMm2: 10,
          ohmKm: 2.9,
          notes: 'Cable de aluminio 10mm² - resistivity estándar',
          usrCreate: 'TEST',
          usrUpdate: 'TEST',
          active: true,
        },
        {
          material: 'Al',
          seccionMm2: 16,
          ohmKm: 1.91,
          notes: 'Cable de aluminio 16mm² - resistivity estándar',
          usrCreate: 'TEST',
          usrUpdate: 'TEST',
          active: true,
        },
      ]);

      const aluminumRequest = {
        ...validRequest,
        parameters: {
          ...validRequest.parameters,
          material_conductor: 'Al',
        },
      };

      return request(app.getHttpServer())
        .post('/calc/feeder/preview')
        .send(aluminumRequest)
        .expect(200)
        .expect((res) => {
          expect(res.body.feeder.material).toBe('Al');
          expect(res.body.feeder.resistencia_ohm_km).toBe(2.9);
        });
    });

    it('should handle three-phase systems', () => {
      const threePhaseRequest = {
        ...validRequest,
        system: {
          ...validRequest.system,
          voltage_v: 208,
          phases: 3,
          corriente_total_a: 35.2,
          carga_total_va: 12672,
        },
      };

      return request(app.getHttpServer())
        .post('/calc/feeder/preview')
        .send(threePhaseRequest)
        .expect(200)
        .expect((res) => {
          expect(res.body.resumen.phases).toBe(3);
          expect(res.body.resumen.tension_nominal_v).toBe(208);

          // En trifásico, la caída de tensión debería ser menor que en monofásico
          expect(res.body.feeder.caida_tension_alimentador_pct).toBeLessThan(5);
        });
    });

    it('should detect circuits exceeding voltage drop limits', () => {
      const criticalRequest = {
        ...validRequest,
        circuitos_ramales: [
          {
            id_circuito: 'CIRC-001',
            name: 'load Crítica',
            corriente_total_a: 25.0,
            carga_total_va: 3000,
            length_m: 150,
          },
        ],
        system: {
          voltage_v: 120,
          phases: 1,
          corriente_total_a: 25.0,
          carga_total_va: 3000,
        },
        parameters: {
          longitud_alimentador_m: 100,
          material_conductor: 'Cu',
          max_caida_ramal_pct: 2,
          max_caida_total_pct: 3,
        },
      };

      return request(app.getHttpServer())
        .post('/calc/feeder/preview')
        .send(criticalRequest)
        .expect(200)
        .expect((res) => {
          // Verificar que se detecten circuits fuera de límite
          const circuitosFueraLimite = res.body.circuitos_analisis.filter(
            (c: any) => c.estado === 'ERROR',
          );
          expect(circuitosFueraLimite.length).toBeGreaterThan(0);
          expect(res.body.resumen.circuitos_fuera_limite).toBeGreaterThan(0);
        });
    });

    it('should handle circuits without specified length', () => {
      const requestWithoutLengths = {
        ...validRequest,
        circuitos_ramales: [
          {
            id_circuito: 'CIRC-001',
            name: 'circuit sin longitud',
            corriente_total_a: 10.0,
            carga_total_va: 1200,
            // length_m no especificada
          },
        ],
      };

      return request(app.getHttpServer())
        .post('/calc/feeder/preview')
        .send(requestWithoutLengths)
        .expect(200)
        .expect((res) => {
          expect(res.body.circuitos_analisis[0].length_m).toBe(20); // value por defecto
          expect(
            res.body.circuitos_analisis[0].caida_tension_ramal_pct,
          ).toBeGreaterThan(0);
        });
    });

    it('should generate appropriate observations', () => {
      return request(app.getHttpServer())
        .post('/calc/feeder/preview')
        .send(validRequest)
        .expect(200)
        .expect((res) => {
          expect(res.body.observaciones_generales).toBeDefined();
          expect(res.body.observaciones_generales.length).toBeGreaterThan(0);

          // Verificar que contenga información sobre el análisis
          const observationsText = res.body.observaciones_generales.join(' ');
          expect(observationsText).toContain('circuits ramales');
          expect(observationsText).toContain('feeder');
        });
    });

    it('should handle high current loads', () => {
      const highCurrentRequest = {
        ...validRequest,
        circuitos_ramales: [
          {
            id_circuito: 'CIRC-001',
            name: 'load Industrial',
            corriente_total_a: 100.0,
            carga_total_va: 12000,
            length_m: 50,
          },
        ],
        system: {
          voltage_v: 480,
          phases: 3,
          corriente_total_a: 100.0,
          carga_total_va: 12000,
        },
        parameters: {
          longitud_alimentador_m: 80,
          material_conductor: 'Cu',
          max_caida_ramal_pct: 3,
          max_caida_total_pct: 5,
        },
      };

      return request(app.getHttpServer())
        .post('/calc/feeder/preview')
        .send(highCurrentRequest)
        .expect(200)
        .expect((res) => {
          expect(res.body.feeder.corriente_total_a).toBe(100.0);
          expect(res.body.feeder.section_mm2).toBeGreaterThanOrEqual(16);
          expect(res.body.feeder.caida_tension_alimentador_pct).toBeLessThan(5);
        });
    });

    it('should validate required fields', () => {
      const invalidRequest = {
        circuitos_ramales: [],
        system: {
          voltage_v: 0, // Tensión inválida
          phases: 1,
          corriente_total_a: 20.8,
          carga_total_va: 2496,
        },
        parameters: {
          longitud_alimentador_m: 50,
          material_conductor: 'Cu',
        },
      };

      return request(app.getHttpServer())
        .post('/calc/feeder/preview')
        .send(invalidRequest)
        .expect(400);
    });

    it('should handle edge case with very short lengths', () => {
      const shortLengthRequest = {
        ...validRequest,
        circuitos_ramales: [
          {
            id_circuito: 'CIRC-001',
            name: 'circuit Corto',
            corriente_total_a: 5.0,
            carga_total_va: 600,
            length_m: 2,
          },
        ],
        parameters: {
          longitud_alimentador_m: 5,
          material_conductor: 'Cu',
          max_caida_ramal_pct: 3,
          max_caida_total_pct: 5,
        },
      };

      return request(app.getHttpServer())
        .post('/calc/feeder/preview')
        .send(shortLengthRequest)
        .expect(200)
        .expect((res) => {
          expect(
            res.body.circuitos_analisis[0].caida_tension_ramal_pct,
          ).toBeLessThan(1);
          expect(res.body.feeder.caida_tension_alimentador_pct).toBeLessThan(2);
        });
    });

    it('should handle maximum voltage drop limits', () => {
      const maxDropRequest = {
        ...validRequest,
        parameters: {
          ...validRequest.parameters,
          max_caida_ramal_pct: 10,
          max_caida_total_pct: 15,
        },
      };

      return request(app.getHttpServer())
        .post('/calc/feeder/preview')
        .send(maxDropRequest)
        .expect(200)
        .expect((res) => {
          expect(res.body.resumen.limite_caida_ramal_pct).toBe(10);
          expect(res.body.resumen.limite_caida_total_pct).toBe(15);

          // Con límites altos, todos los circuits deberían estar OK
          const circuitosOK = res.body.circuitos_analisis.filter(
            (c: any) => c.estado === 'OK',
          );
          expect(circuitosOK.length).toBe(res.body.circuitos_analisis.length);
        });
    });
  });
});
