import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { DataSource } from 'typeorm';
import { Ampacity } from '../../src/modules/calculos/entities/ampacity.entity';
import { BreakerCurve } from '../../src/modules/calculos/entities/breaker-curve.entity';

describe('CalcCircuitsController (e2e)', () => {
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

  beforeEach(async () => {
    // Limpiar y sembrar datos de prueba
    await dataSource.query('DELETE FROM ampacity');
    await dataSource.query('DELETE FROM breaker_curve');

    // Insertar ampacities de prueba
    const ampacityRepository = dataSource.getRepository(Ampacity);
    await ampacityRepository.save([
      {
        material: 'Cu',
        insulation: 'THHN',
        tempC: 75,
        calibreAwg: 12,
        seccionMm2: 3.31,
        amp: 20,
        usrCreate: 'TEST',
        usrUpdate: 'TEST',
        active: true,
      },
      {
        material: 'Cu',
        insulation: 'THHN',
        tempC: 75,
        calibreAwg: 10,
        seccionMm2: 5.26,
        amp: 30,
        usrCreate: 'TEST',
        usrUpdate: 'TEST',
        active: true,
      },
      {
        material: 'Cu',
        insulation: 'THHN',
        tempC: 75,
        calibreAwg: 8,
        seccionMm2: 8.37,
        amp: 55,
        usrCreate: 'TEST',
        usrUpdate: 'TEST',
        active: true,
      },
    ]);

    // Insertar breakers de prueba
    const breakerRepository = dataSource.getRepository(BreakerCurve);
    await breakerRepository.save([
      {
        amp: 15,
        poles: 1,
        curve: 'C',
        useCase: 'iluminacion',
        notes: 'Breaker para iluminación',
        usrCreate: 'TEST',
        usrUpdate: 'TEST',
        active: true,
      },
      {
        amp: 20,
        poles: 1,
        curve: 'C',
        useCase: 'tomas generales',
        notes: 'Breaker para tomas',
        usrCreate: 'TEST',
        usrUpdate: 'TEST',
        active: true,
      },
      {
        amp: 30,
        poles: 2,
        curve: 'C',
        useCase: 'electrodomestico',
        notes: 'Breaker para electrodomésticos',
        usrCreate: 'TEST',
        usrUpdate: 'TEST',
        active: true,
      },
    ]);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /calc/circuits/preview', () => {
    const validRequest = {
      cargas_diversificadas: [
        {
          categoria: 'lighting_general',
          carga_diversificada_va: 1453.5,
          factor_demanda: 1.0,
          descripcion: 'Iluminación general de todos los ambientes',
          ambiente: 'General',
        },
        {
          categoria: 'tomas_generales',
          carga_diversificada_va: 800.0,
          factor_demanda: 1.0,
          descripcion: 'Tomacorrientes generales',
          ambiente: 'General',
        },
        {
          categoria: 'electrodomesticos',
          carga_diversificada_va: 1252.65,
          factor_demanda: 0.85,
          descripcion: 'Nevera, microondas, lavadora, TV',
          ambiente: 'Cocina/Lavandería',
        },
        {
          categoria: 'climatizacion',
          carga_diversificada_va: 1222.2,
          factor_demanda: 1.0,
          descripcion: 'Aires acondicionados',
          ambiente: 'Habitaciones',
        },
      ],
      sistema: {
        tension_v: 120,
        phases: 1,
        system_type: 1,
        frequency: 60,
      },
      observaciones: [
        'Cargas diversificadas desde CE-02',
        'Sistema residencial monofásico',
      ],
      configuraciones: {
        max_utilizacion_circuito: 0.8,
        separar_por_ambiente: false,
        preferir_monofasico: true,
      },
    };

    it('should group loads into circuits successfully', () => {
      return request(app.getHttpServer())
        .post('/calc/circuits/preview')
        .send(validRequest)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('circuitos_ramales');
          expect(res.body).toHaveProperty('resumen');
          expect(res.body).toHaveProperty('observaciones_generales');
          expect(res.body).toHaveProperty('metadata');

          expect(res.body.circuitos_ramales).toHaveLength(4);

          // Verificar que cada circuito tenga los componentes necesarios
          res.body.circuitos_ramales.forEach((circuito: any) => {
            expect(circuito).toHaveProperty('id_circuito');
            expect(circuito).toHaveProperty('nombre');
            expect(circuito).toHaveProperty('cargas');
            expect(circuito).toHaveProperty('breaker');
            expect(circuito).toHaveProperty('conductor');
            expect(circuito).toHaveProperty('utilizacion_pct');
          });
        });
    });

    it('should select appropriate breakers and conductors', () => {
      return request(app.getHttpServer())
        .post('/calc/circuits/preview')
        .send(validRequest)
        .expect(200)
        .expect((res) => {
          const circuitos = res.body.circuitos_ramales;

          // Verificar que los breakers seleccionados sean apropiados
          circuitos.forEach((circuito: any) => {
            expect(circuito.breaker.amp).toBeGreaterThan(0);
            expect(circuito.breaker.poles).toBeLessThanOrEqual(
              validRequest.sistema.phases,
            );
            expect(circuito.breaker.curve).toBeDefined();
            expect(circuito.breaker.use_case).toBeDefined();
          });

          // Verificar que los conductores seleccionados sean apropiados
          circuitos.forEach((circuito: any) => {
            expect(circuito.conductor.calibre_awg).toBeGreaterThan(0);
            expect(circuito.conductor.ampacity).toBeGreaterThan(0);
            expect(circuito.conductor.material).toBeDefined();
            expect(circuito.conductor.insulation).toBeDefined();
          });
        });
    });

    it('should calculate utilization correctly', () => {
      return request(app.getHttpServer())
        .post('/calc/circuits/preview')
        .send(validRequest)
        .expect(200)
        .expect((res) => {
          const circuitos = res.body.circuitos_ramales;

          circuitos.forEach((circuito: any) => {
            expect(circuito.utilizacion_pct).toBeGreaterThan(0);
            expect(circuito.utilizacion_pct).toBeLessThanOrEqual(100);

            // Verificar que la utilización sea consistente
            const corrienteCalculada = circuito.corriente_total_a;
            const breakerAmp = circuito.breaker.amp;
            const utilizacionEsperada = (corrienteCalculada / breakerAmp) * 100;
            expect(circuito.utilizacion_pct).toBeCloseTo(
              utilizacionEsperada,
              1,
            );
          });
        });
    });

    it('should handle continuous loads with 125% margin', () => {
      const continuousLoadRequest = {
        ...validRequest,
        cargas_diversificadas: [
          {
            categoria: 'climatizacion',
            carga_diversificada_va: 2400,
            factor_demanda: 1.0,
            descripcion: 'Aire acondicionado',
            ambiente: 'Habitación',
          },
        ],
      };

      return request(app.getHttpServer())
        .post('/calc/circuits/preview')
        .send(continuousLoadRequest)
        .expect(200)
        .expect((res) => {
          expect(res.body.circuitos_ramales[0].margen_seguridad_pct).toBe(125);
        });
    });

    it('should generate correct summary', () => {
      return request(app.getHttpServer())
        .post('/calc/circuits/preview')
        .send(validRequest)
        .expect(200)
        .expect((res) => {
          const resumen = res.body.resumen;

          expect(resumen.total_circuitos).toBe(4);
          expect(resumen.carga_total_va).toBe(4728.35);
          expect(resumen.circuitos_monofasicos).toBe(4);
          expect(resumen.circuitos_trifasicos).toBe(0);
          expect(resumen.utilizacion_promedio_pct).toBeGreaterThan(0);
          expect(resumen.calibre_minimo_awg).toBeGreaterThan(0);
          expect(resumen.calibre_maximo_awg).toBeGreaterThan(0);
        });
    });

    it('should handle empty loads array', () => {
      const emptyRequest = {
        ...validRequest,
        cargas_diversificadas: [],
      };

      return request(app.getHttpServer())
        .post('/calc/circuits/preview')
        .send(emptyRequest)
        .expect(200)
        .expect((res) => {
          expect(res.body.circuitos_ramales).toHaveLength(0);
          expect(res.body.resumen.total_circuitos).toBe(0);
          expect(res.body.resumen.carga_total_va).toBe(0);
        });
    });

    it('should handle three-phase system', () => {
      const threePhaseRequest = {
        ...validRequest,
        sistema: {
          tension_v: 208,
          phases: 3,
          system_type: 3,
          frequency: 60,
        },
      };

      return request(app.getHttpServer())
        .post('/calc/circuits/preview')
        .send(threePhaseRequest)
        .expect(200)
        .expect((res) => {
          expect(res.body.circuitos_ramales[0].tension_v).toBe(208);
          expect(res.body.circuitos_ramales[0].phases).toBe(3);
        });
    });

    it('should validate required fields', () => {
      const invalidRequest = {
        cargas_diversificadas: [
          {
            categoria: 'lighting_general',
            // falta carga_diversificada_va
          },
        ],
        sistema: {
          tension_v: 120,
          phases: 1,
          system_type: 1,
        },
      };

      return request(app.getHttpServer())
        .post('/calc/circuits/preview')
        .send(invalidRequest)
        .expect(400);
    });

    it('should handle negative load values', () => {
      const negativeLoadRequest = {
        ...validRequest,
        cargas_diversificadas: [
          {
            categoria: 'lighting_general',
            carga_diversificada_va: -100,
            factor_demanda: 1.0,
            descripcion: 'Carga negativa',
            ambiente: 'Test',
          },
        ],
      };

      return request(app.getHttpServer())
        .post('/calc/circuits/preview')
        .send(negativeLoadRequest)
        .expect(400);
    });

    it('should include metadata in response', () => {
      return request(app.getHttpServer())
        .post('/calc/circuits/preview')
        .send(validRequest)
        .expect(200)
        .expect((res) => {
          expect(res.body.metadata).toBeDefined();
          expect(res.body.metadata.version).toBe('1.0');
          expect(res.body.metadata.timestamp).toBeDefined();
          expect(res.body.metadata.duracion_calculo_ms).toBeGreaterThan(0);
          expect(res.body.metadata.algoritmo_usado).toBe(
            'grouping_by_category_with_80pct_rule',
          );
        });
    });

    it('should generate correct observations', () => {
      return request(app.getHttpServer())
        .post('/calc/circuits/preview')
        .send(validRequest)
        .expect(200)
        .expect((res) => {
          expect(res.body.observaciones_generales).toBeDefined();
          expect(Array.isArray(res.body.observaciones_generales)).toBe(true);
          expect(res.body.observaciones_generales.length).toBeGreaterThan(0);

          // Verificar que contenga información sobre circuitos
          const observationsText = res.body.observaciones_generales.join(' ');
          expect(observationsText).toContain('circuitos ramales generados');
          expect(observationsText).toContain('Utilización promedio');
        });
    });

    it('should handle high utilization warnings', () => {
      const highLoadRequest = {
        ...validRequest,
        cargas_diversificadas: [
          {
            categoria: 'lighting_general',
            carga_diversificada_va: 2500, // Alta carga
            factor_demanda: 1.0,
            descripcion: 'Iluminación intensiva',
            ambiente: 'Oficina',
          },
        ],
      };

      return request(app.getHttpServer())
        .post('/calc/circuits/preview')
        .send(highLoadRequest)
        .expect(200)
        .expect((res) => {
          const observacionesText = res.body.observaciones_generales.join(' ');
          expect(observacionesText).toContain('alta utilización');
        });
    });
  });
});
