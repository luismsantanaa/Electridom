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
        notes: 'Cable de cobre 2.5mm² - Resistividad estándar',
        usrCreate: 'TEST',
        usrUpdate: 'TEST',
        active: true,
      },
      {
        material: 'Cu',
        seccionMm2: 4,
        ohmKm: 4.61,
        notes: 'Cable de cobre 4mm² - Resistividad estándar',
        usrCreate: 'TEST',
        usrUpdate: 'TEST',
        active: true,
      },
      {
        material: 'Cu',
        seccionMm2: 6,
        ohmKm: 3.08,
        notes: 'Cable de cobre 6mm² - Resistividad estándar',
        usrCreate: 'TEST',
        usrUpdate: 'TEST',
        active: true,
      },
      {
        material: 'Cu',
        seccionMm2: 10,
        ohmKm: 1.83,
        notes: 'Cable de cobre 10mm² - Resistividad estándar',
        usrCreate: 'TEST',
        usrUpdate: 'TEST',
        active: true,
      },
      {
        material: 'Cu',
        seccionMm2: 16,
        ohmKm: 1.15,
        notes: 'Cable de cobre 16mm² - Resistividad estándar',
        usrCreate: 'TEST',
        usrUpdate: 'TEST',
        active: true,
      },
      {
        material: 'Cu',
        seccionMm2: 25,
        ohmKm: 0.727,
        notes: 'Cable de cobre 25mm² - Resistividad estándar',
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
          nombre: 'Iluminación Habitación 1',
          corriente_total_a: 8.5,
          carga_total_va: 1020,
          longitud_m: 15,
        },
        {
          id_circuito: 'CIRC-002',
          nombre: 'Enchufes Habitación 1',
          corriente_total_a: 12.3,
          carga_total_va: 1476,
          longitud_m: 18,
        },
        {
          id_circuito: 'CIRC-003',
          nombre: 'Cocina',
          corriente_total_a: 25.8,
          carga_total_va: 3096,
          longitud_m: 25,
        },
        {
          id_circuito: 'CIRC-004',
          nombre: 'Aire Acondicionado',
          corriente_total_a: 15.2,
          carga_total_va: 1824,
          longitud_m: 30,
        },
      ],
      sistema: {
        tension_v: 120,
        phases: 1,
        corriente_total_a: 61.8,
        carga_total_va: 7416,
      },
      parametros: {
        longitud_alimentador_m: 50,
        material_conductor: 'Cu',
        max_caida_ramal_pct: 3,
        max_caida_total_pct: 5,
      },
      observaciones: [
        'Instalación residencial monofásica',
        'Alimentador desde medidor hasta panel principal',
      ],
    };

    it('should analyze voltage drop for residential installation', () => {
      return request(app.getHttpServer())
        .post('/calc/feeder/preview')
        .send(validRequest)
        .expect(200)
        .expect((res) => {
          expect(res.body.circuitos_analisis).toHaveLength(4);
          expect(res.body.alimentador).toBeDefined();
          expect(res.body.resumen).toBeDefined();
          expect(res.body.metadata).toBeDefined();

          // Verificar estructura de circuitos_analisis
          res.body.circuitos_analisis.forEach((circuito: any) => {
            expect(circuito.id_circuito).toBeDefined();
            expect(circuito.nombre).toBeDefined();
            expect(circuito.corriente_a).toBeGreaterThan(0);
            expect(circuito.longitud_m).toBeGreaterThan(0);
            expect(circuito.caida_tension_ramal_v).toBeGreaterThan(0);
            expect(circuito.caida_tension_ramal_pct).toBeGreaterThan(0);
            expect(['OK', 'WARNING', 'ERROR']).toContain(circuito.estado);
          });

          // Verificar estructura del alimentador
          expect(res.body.alimentador.corriente_total_a).toBe(61.8);
          expect(res.body.alimentador.longitud_m).toBe(50);
          expect(res.body.alimentador.material).toBe('Cu');
          expect(res.body.alimentador.seccion_mm2).toBeGreaterThan(0);
          expect(res.body.alimentador.resistencia_ohm_km).toBeGreaterThan(0);
          expect(res.body.alimentador.caida_tension_alimentador_v).toBeGreaterThan(0);
          expect(res.body.alimentador.caida_tension_alimentador_pct).toBeGreaterThan(0);
          expect(res.body.alimentador.longitud_critica_m).toBeGreaterThan(0);
          expect(['OK', 'WARNING', 'ERROR']).toContain(res.body.alimentador.estado);

          // Verificar resumen
          expect(res.body.resumen.tension_nominal_v).toBe(120);
          expect(res.body.resumen.phases).toBe(1);
          expect(res.body.resumen.limite_caida_ramal_pct).toBe(3);
          expect(res.body.resumen.limite_caida_total_pct).toBe(5);
          expect(res.body.resumen.caida_total_maxima_pct).toBeGreaterThan(0);
          expect(res.body.resumen.circuitos_fuera_limite).toBeGreaterThanOrEqual(0);
          expect(['OK', 'WARNING', 'ERROR']).toContain(res.body.resumen.estado_general);
          expect(res.body.resumen.calibre_minimo_recomendado_mm2).toBeGreaterThan(0);

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
            nombre: 'Iluminación Exterior',
            corriente_total_a: 5.2,
            carga_total_va: 624,
            longitud_m: 80,
          },
          {
            id_circuito: 'CIRC-002',
            nombre: 'Bomba de Agua',
            corriente_total_a: 18.5,
            carga_total_va: 2220,
            longitud_m: 120,
          },
        ],
        sistema: {
          tension_v: 240,
          phases: 1,
          corriente_total_a: 23.7,
          carga_total_va: 2844,
        },
        parametros: {
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

          // Verificar que los circuitos largos tengan mayor caída de tensión
          const circuitosConAltaCaida = res.body.circuitos_analisis.filter(
            (c: any) => c.caida_tension_ramal_pct > 2,
          );
          expect(circuitosConAltaCaida.length).toBeGreaterThan(0);

          // Verificar que el alimentador seleccione sección apropiada
          expect(res.body.alimentador.seccion_mm2).toBeGreaterThanOrEqual(16);
        });
    });

    it('should handle aluminum conductors', () => {
      // Insertar resistividades de aluminio
      const resistivityRepository = dataSource.getRepository(Resistivity);
      resistivityRepository.save([
        {
          material: 'Al',
          seccionMm2: 10,
          ohmKm: 2.90,
          notes: 'Cable de aluminio 10mm² - Resistividad estándar',
          usrCreate: 'TEST',
          usrUpdate: 'TEST',
          active: true,
        },
        {
          material: 'Al',
          seccionMm2: 16,
          ohmKm: 1.91,
          notes: 'Cable de aluminio 16mm² - Resistividad estándar',
          usrCreate: 'TEST',
          usrUpdate: 'TEST',
          active: true,
        },
      ]);

      const aluminumRequest = {
        ...validRequest,
        parametros: {
          ...validRequest.parametros,
          material_conductor: 'Al',
        },
      };

      return request(app.getHttpServer())
        .post('/calc/feeder/preview')
        .send(aluminumRequest)
        .expect(200)
        .expect((res) => {
          expect(res.body.alimentador.material).toBe('Al');
          expect(res.body.alimentador.resistencia_ohm_km).toBe(2.90);
        });
    });

    it('should handle three-phase systems', () => {
      const threePhaseRequest = {
        ...validRequest,
        sistema: {
          ...validRequest.sistema,
          tension_v: 208,
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
          expect(res.body.alimentador.caida_tension_alimentador_pct).toBeLessThan(5);
        });
    });

    it('should detect circuits exceeding voltage drop limits', () => {
      const criticalRequest = {
        ...validRequest,
        circuitos_ramales: [
          {
            id_circuito: 'CIRC-001',
            nombre: 'Carga Crítica',
            corriente_total_a: 25.0,
            carga_total_va: 3000,
            longitud_m: 150,
          },
        ],
        sistema: {
          tension_v: 120,
          phases: 1,
          corriente_total_a: 25.0,
          carga_total_va: 3000,
        },
        parametros: {
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
          // Verificar que se detecten circuitos fuera de límite
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
            nombre: 'Circuito sin longitud',
            corriente_total_a: 10.0,
            carga_total_va: 1200,
            // longitud_m no especificada
          },
        ],
      };

      return request(app.getHttpServer())
        .post('/calc/feeder/preview')
        .send(requestWithoutLengths)
        .expect(200)
        .expect((res) => {
          expect(res.body.circuitos_analisis[0].longitud_m).toBe(20); // Valor por defecto
          expect(res.body.circuitos_analisis[0].caida_tension_ramal_pct).toBeGreaterThan(0);
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
          expect(observationsText).toContain('circuitos ramales');
          expect(observationsText).toContain('Alimentador');
        });
    });

    it('should handle high current loads', () => {
      const highCurrentRequest = {
        ...validRequest,
        circuitos_ramales: [
          {
            id_circuito: 'CIRC-001',
            nombre: 'Carga Industrial',
            corriente_total_a: 100.0,
            carga_total_va: 12000,
            longitud_m: 50,
          },
        ],
        sistema: {
          tension_v: 480,
          phases: 3,
          corriente_total_a: 100.0,
          carga_total_va: 12000,
        },
        parametros: {
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
          expect(res.body.alimentador.corriente_total_a).toBe(100.0);
          expect(res.body.alimentador.seccion_mm2).toBeGreaterThanOrEqual(16);
          expect(res.body.alimentador.caida_tension_alimentador_pct).toBeLessThan(5);
        });
    });

    it('should validate required fields', () => {
      const invalidRequest = {
        circuitos_ramales: [],
        sistema: {
          tension_v: 0, // Tensión inválida
          phases: 1,
          corriente_total_a: 20.8,
          carga_total_va: 2496,
        },
        parametros: {
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
            nombre: 'Circuito Corto',
            corriente_total_a: 5.0,
            carga_total_va: 600,
            longitud_m: 2,
          },
        ],
        parametros: {
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
          expect(res.body.circuitos_analisis[0].caida_tension_ramal_pct).toBeLessThan(1);
          expect(res.body.alimentador.caida_tension_alimentador_pct).toBeLessThan(2);
        });
    });

    it('should handle maximum voltage drop limits', () => {
      const maxDropRequest = {
        ...validRequest,
        parametros: {
          ...validRequest.parametros,
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

          // Con límites altos, todos los circuitos deberían estar OK
          const circuitosOK = res.body.circuitos_analisis.filter(
            (c: any) => c.estado === 'OK',
          );
          expect(circuitosOK.length).toBe(res.body.circuitos_analisis.length);
        });
    });
  });
});
