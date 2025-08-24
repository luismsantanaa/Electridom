import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('CalcGroundingController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('POST /calc/grounding/preview', () => {
    const baseRequest = {
      sistema: {
        tension_v: 120,
        phases: 1,
        corriente_total_a: 61.8,
        carga_total_va: 7416,
      },
      alimentador: {
        corriente_a: 61.8,
        seccion_mm2: 10,
        material: 'Cu',
        longitud_m: 50,
      },
      parametros: {
        main_breaker_amp: 100,
        tipo_instalacion: 'residencial',
        tipo_sistema_tierra: 'TN-S',
        resistividad_suelo_ohm_m: 100,
      },
      observaciones: ['Instalación residencial monofásica'],
    };

    it('should size grounding system for residential installation', () => {
      return request(app.getHttpServer())
        .post('/calc/grounding/preview')
        .send(baseRequest)
        .expect(200)
        .expect((res) => {
          expect(res.body.conductor_proteccion).toBeDefined();
          expect(res.body.conductor_proteccion.tipo).toBe('EGC');
          expect(res.body.conductor_proteccion.seccion_mm2).toBe(10);
          expect(res.body.conductor_proteccion.calibre_awg).toBe('8');
          expect(res.body.conductor_tierra).toBeDefined();
          expect(res.body.conductor_tierra.tipo).toBe('GEC');
          expect(res.body.conductor_tierra.seccion_mm2).toBe(16);
          expect(res.body.conductor_tierra.calibre_awg).toBe('6');
          expect(res.body.sistema_tierra).toBeDefined();
          expect(res.body.sistema_tierra.tipo_sistema).toBe('TN-S');
          expect(res.body.sistema_tierra.resistencia_maxima_ohm).toBe(25);
          expect(res.body.sistema_tierra.numero_electrodos).toBe(1);
          expect(res.body.resumen).toBeDefined();
          expect(res.body.resumen.estado).toBe('ESTÁNDAR');
          expect(res.body.metadata).toBeDefined();
          expect(res.body.metadata.version).toBe('1.0');
        });
    });

    it('should size grounding system for commercial installation', () => {
      const requestData = {
        ...baseRequest,
        parametros: {
          ...baseRequest.parametros,
          main_breaker_amp: 200,
          tipo_instalacion: 'comercial',
          tipo_sistema_tierra: 'TN-C-S',
        },
      };

      return request(app.getHttpServer())
        .post('/calc/grounding/preview')
        .send(request)
        .expect(200)
        .expect((res) => {
          expect(res.body.conductor_proteccion.seccion_mm2).toBe(25);
          expect(res.body.conductor_tierra.seccion_mm2).toBe(35);
          expect(res.body.sistema_tierra.tipo_sistema).toBe('TN-C-S');
          expect(res.body.sistema_tierra.resistencia_maxima_ohm).toBe(5);
          expect(res.body.sistema_tierra.numero_electrodos).toBe(1);
          expect(res.body.resumen.estado).toBe('ESTRICTO');
        });
    });

    it('should size grounding system for industrial installation', () => {
      const requestData = {
        ...baseRequest,
        parametros: {
          ...baseRequest.parametros,
          main_breaker_amp: 600,
          tipo_instalacion: 'industrial',
          tipo_sistema_tierra: 'TT',
        },
      };

      return request(app.getHttpServer())
        .post('/calc/grounding/preview')
        .send(requestData)
        .expect(200)
        .expect((res) => {
          expect(res.body.conductor_proteccion.seccion_mm2).toBe(95);
          expect(res.body.conductor_tierra.seccion_mm2).toBe(120);
          expect(res.body.sistema_tierra.tipo_sistema).toBe('TT');
          expect(res.body.sistema_tierra.resistencia_maxima_ohm).toBe(1);
          expect(res.body.sistema_tierra.numero_electrodos).toBe(2);
          expect(res.body.sistema_tierra.tipo_electrodo).toBe(
            'Malla de tierra',
          );
          expect(res.body.resumen.estado).toBe('CRÍTICO');
        });
    });

    it('should handle TT system with multiple electrodes', () => {
      const requestData = {
        ...baseRequest,
        parametros: {
          ...baseRequest.parametros,
          tipo_sistema_tierra: 'TT',
        },
      };

      return request(app.getHttpServer())
        .post('/calc/grounding/preview')
        .send(requestData)
        .expect(200)
        .expect((res) => {
          expect(res.body.sistema_tierra.tipo_sistema).toBe('TT');
          expect(res.body.sistema_tierra.numero_electrodos).toBe(2);
          expect(res.body.sistema_tierra.separacion_electrodos_m).toBe(3.0);
        });
    });

    it('should handle IT system with industrial installation', () => {
      const requestData = {
        ...baseRequest,
        parametros: {
          ...baseRequest.parametros,
          tipo_instalacion: 'industrial',
          tipo_sistema_tierra: 'IT',
        },
      };

      return request(app.getHttpServer())
        .post('/calc/grounding/preview')
        .send(requestData)
        .expect(200)
        .expect((res) => {
          expect(res.body.sistema_tierra.tipo_sistema).toBe('IT');
          expect(res.body.sistema_tierra.numero_electrodos).toBe(3);
          expect(res.body.sistema_tierra.separacion_electrodos_m).toBe(6.0);
        });
    });

    it('should handle high amperage breakers', () => {
      const requestData = {
        ...baseRequest,
        parametros: {
          ...baseRequest.parametros,
          main_breaker_amp: 2000,
        },
      };

      return request(app.getHttpServer())
        .post('/calc/grounding/preview')
        .send(requestData)
        .expect(200)
        .expect((res) => {
          expect(res.body.conductor_proteccion.seccion_mm2).toBe(240);
          expect(res.body.conductor_tierra.seccion_mm2).toBe(300);
          expect(res.body.conductor_proteccion.calibre_awg).toBe('4/0');
          expect(res.body.conductor_tierra.calibre_awg).toBe('300');
        });
    });

    it('should generate correct observations', () => {
      return request(app.getHttpServer())
        .post('/calc/grounding/preview')
        .send(baseRequest)
        .expect(200)
        .expect((res) => {
          expect(res.body.observaciones_generales).toBeDefined();
          expect(res.body.observaciones_generales).toContain(
            'Sistema de puesta a tierra para breaker de 100A',
          );
          expect(res.body.observaciones_generales).toContain(
            'EGC: 10mm² (8 AWG)',
          );
          expect(res.body.observaciones_generales).toContain(
            'GEC: 16mm² (6 AWG)',
          );
          expect(res.body.observaciones_generales).toContain(
            'Sistema TN-S con 1 electrodo(s)',
          );
          expect(res.body.observaciones_generales).toContain(
            'Resistencia máxima: 25Ω',
          );
        });
    });

    it('should validate required fields', () => {
      const invalidRequest = {
        sistema: {
          tension_v: 120,
          phases: 1,
          // Missing corriente_total_a and carga_total_va
        },
        alimentador: {
          corriente_a: 61.8,
          seccion_mm2: 10,
          material: 'Cu',
          longitud_m: 50,
        },
        parametros: {
          // Missing main_breaker_amp
          tipo_instalacion: 'residencial',
          tipo_sistema_tierra: 'TN-S',
        },
      };

      return request(app.getHttpServer())
        .post('/calc/grounding/preview')
        .send(invalidRequest)
        .expect(400);
    });

    it('should handle negative amperage values', () => {
      const requestData = {
        ...baseRequest,
        parametros: {
          ...baseRequest.parametros,
          main_breaker_amp: -50,
        },
      };

      return request(app.getHttpServer())
        .post('/calc/grounding/preview')
        .send(requestData)
        .expect(400);
    });

    it('should handle missing sistema field', () => {
      const invalidRequest = {
        alimentador: {
          corriente_a: 61.8,
          seccion_mm2: 10,
          material: 'Cu',
          longitud_m: 50,
        },
        parametros: {
          main_breaker_amp: 100,
          tipo_instalacion: 'residencial',
          tipo_sistema_tierra: 'TN-S',
        },
      };

      return request(app.getHttpServer())
        .post('/calc/grounding/preview')
        .send(invalidRequest)
        .expect(400);
    });

    it('should handle missing alimentador field', () => {
      const invalidRequest = {
        sistema: {
          tension_v: 120,
          phases: 1,
          corriente_total_a: 61.8,
          carga_total_va: 7416,
        },
        parametros: {
          main_breaker_amp: 100,
          tipo_instalacion: 'residencial',
          tipo_sistema_tierra: 'TN-S',
        },
      };

      return request(app.getHttpServer())
        .post('/calc/grounding/preview')
        .send(invalidRequest)
        .expect(400);
    });

    it('should handle missing parametros field', () => {
      const invalidRequest = {
        sistema: {
          tension_v: 120,
          phases: 1,
          corriente_total_a: 61.8,
          carga_total_va: 7416,
        },
        alimentador: {
          corriente_a: 61.8,
          seccion_mm2: 10,
          material: 'Cu',
          longitud_m: 50,
        },
      };

      return request(app.getHttpServer())
        .post('/calc/grounding/preview')
        .send(invalidRequest)
        .expect(400);
    });
  });
});
