import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('API Contract Tests (e2e)', () => {
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

  describe('Swagger Documentation', () => {
    it('should serve Swagger UI at /api/docs', () => {
      return request(app.getHttpServer())
        .get('/api/docs')
        .expect(200)
        .expect((res) => {
          expect(res.text).toContain('swagger-ui');
          expect(res.text).toContain('Calculadora Eléctrica RD');
        });
    });

    it('should serve OpenAPI JSON schema at /api/docs-json', () => {
      return request(app.getHttpServer())
        .get('/api/docs-json')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('openapi');
          expect(res.body).toHaveProperty('info');
          expect(res.body).toHaveProperty('paths');
          expect(res.body.info.title).toBe('Calculadora Eléctrica RD - API');
          expect(res.body.info.version).toBe('1.0.0');
        });
    });

    it('should include all calculation endpoints in OpenAPI schema', () => {
      return request(app.getHttpServer())
        .get('/api/docs-json')
        .expect(200)
        .expect((res) => {
          const paths = res.body.paths;
          
          // Verificar que todos los endpoints de cálculos estén documentados
          expect(paths).toHaveProperty('/calc/rooms/preview');
          expect(paths).toHaveProperty('/calc/demand/preview');
          expect(paths).toHaveProperty('/calc/circuits/preview');
          expect(paths).toHaveProperty('/calc/feeder/preview');
          expect(paths).toHaveProperty('/calc/grounding/preview');
          expect(paths).toHaveProperty('/calc/report');
          expect(paths).toHaveProperty('/calc/report/download');
        });
    });

    it('should include proper security schemes in OpenAPI schema', () => {
      return request(app.getHttpServer())
        .get('/api/docs-json')
        .expect(200)
        .expect((res) => {
          expect(res.body.components).toHaveProperty('securitySchemes');
          expect(res.body.components.securitySchemes).toHaveProperty('bearerAuth');
          expect(res.body.components.securitySchemes).toHaveProperty('apiKeyAuth');
        });
    });
  });

  describe('API Contract Validation', () => {
    it('should validate rooms endpoint contract', () => {
      const requestData = {
        system: {
          voltage: 120,
          phases: 1,
          frequency: 60
        },
        superficies: [
          { nombre: "Sala", area_m2: 18 },
          { nombre: "Cocina", area_m2: 12 }
        ],
        consumos: [
          {
            nombre: "TV",
            ambiente: "Sala",
            potencia_w: 140,
            tipo: "electrodomestico"
          }
        ]
      };

      return request(app.getHttpServer())
        .post('/calc/rooms/preview')
        .send(requestData)
        .expect(200)
        .expect((res) => {
          // Verificar estructura de respuesta
          expect(res.body).toHaveProperty('ambientes');
          expect(res.body).toHaveProperty('totales');
          expect(res.body).toHaveProperty('metadata');
          
          expect(Array.isArray(res.body.ambientes)).toBe(true);
          expect(res.body.totales).toHaveProperty('carga_total_va');
          expect(res.body.totales).toHaveProperty('corriente_total_a');
          expect(res.body.metadata).toHaveProperty('calculation_date');
          expect(res.body.metadata).toHaveProperty('norms_version');
        });
    });

    it('should validate demand endpoint contract', () => {
      const requestData = {
        cargas_por_categoria: [
          {
            categoria: "iluminacion_general",
            carga_bruta_va: 1200
          }
        ],
        parametros: {
          tipo_instalacion: "residencial"
        }
      };

      return request(app.getHttpServer())
        .post('/calc/demand/preview')
        .send(requestData)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('cargas_diversificadas');
          expect(res.body).toHaveProperty('totales_diversificados');
          expect(res.body).toHaveProperty('metadata');
          
          expect(Array.isArray(res.body.cargas_diversificadas)).toBe(true);
          expect(res.body.totales_diversificados).toHaveProperty('carga_total_diversificada_va');
          expect(res.body.totales_diversificados).toHaveProperty('corriente_total_diversificada_a');
        });
    });

    it('should validate circuits endpoint contract', () => {
      const requestData = {
        circuitos_individuales: [
          {
            id_circuito: "CIRC-001",
            nombre: "Circuito de Prueba",
            corriente_a: 10,
            carga_va: 1200,
            longitud_m: 20
          }
        ],
        parametros: {
          material_conductor: "Cu",
          tipo_instalacion: "residencial"
        }
      };

      return request(app.getHttpServer())
        .post('/calc/circuits/preview')
        .send(requestData)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('circuitos_ramales');
          expect(res.body).toHaveProperty('resumen');
          expect(res.body).toHaveProperty('metadata');
          
          expect(Array.isArray(res.body.circuitos_ramales)).toBe(true);
          expect(res.body.resumen).toHaveProperty('total_circuitos');
          expect(res.body.resumen).toHaveProperty('carga_total_va');
        });
    });

    it('should validate feeder endpoint contract', () => {
      const requestData = {
        circuitos_ramales: [
          {
            id_circuito: "CIRC-001",
            nombre: "Alimentador Principal",
            corriente_total_a: 15,
            carga_total_va: 1800,
            longitud_m: 30
          }
        ],
        sistema: {
          tension_v: 120,
          phases: 1,
          corriente_total_a: 15,
          carga_total_va: 1800
        },
        parametros: {
          longitud_alimentador_m: 40,
          material_conductor: "Cu",
          max_caida_ramal_pct: 3,
          max_caida_total_pct: 5
        }
      };

      return request(app.getHttpServer())
        .post('/calc/feeder/preview')
        .send(requestData)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('circuitos_analisis');
          expect(res.body).toHaveProperty('alimentador');
          expect(res.body).toHaveProperty('resumen');
          expect(res.body).toHaveProperty('metadata');
          
          expect(Array.isArray(res.body.circuitos_analisis)).toBe(true);
          expect(res.body.alimentador).toHaveProperty('material');
          expect(res.body.alimentador).toHaveProperty('seccion_mm2');
          expect(res.body.resumen).toHaveProperty('estado_general');
        });
    });

    it('should validate grounding endpoint contract', () => {
      const requestData = {
        sistema: {
          tension_v: 120,
          phases: 1,
          corriente_total_a: 20,
          carga_total_va: 2400
        },
        alimentador: {
          corriente_a: 20,
          seccion_mm2: 16,
          material: "Cu",
          longitud_m: 25
        },
        parametros: {
          main_breaker_amp: 150,
          tipo_instalacion: "comercial",
          tipo_sistema_tierra: "TN-S",
          resistividad_suelo_ohm_m: 80
        }
      };

      return request(app.getHttpServer())
        .post('/calc/grounding/preview')
        .send(requestData)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('conductor_proteccion');
          expect(res.body).toHaveProperty('conductor_tierra');
          expect(res.body).toHaveProperty('sistema_tierra');
          expect(res.body).toHaveProperty('resumen');
          expect(res.body).toHaveProperty('metadata');
          
          expect(res.body.conductor_proteccion).toHaveProperty('seccion_mm2');
          expect(res.body.conductor_proteccion).toHaveProperty('calibre_awg');
          expect(res.body.sistema_tierra).toHaveProperty('tipo_sistema');
          expect(res.body.resumen).toHaveProperty('estado');
        });
    });

    it('should validate report endpoint contract', () => {
      const requestData = {
        installationType: 'residencial',
        electricalSystem: 'Monofásico 120V'
      };

      return request(app.getHttpServer())
        .post('/calc/report')
        .send(requestData)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('pdfBase64');
          expect(res.body).toHaveProperty('excelBase64');
          expect(res.body).toHaveProperty('metadata');
          expect(res.body).toHaveProperty('message');
          
          expect(res.body.metadata).toHaveProperty('pdfHash');
          expect(res.body.metadata).toHaveProperty('excelHash');
          expect(res.body.metadata).toHaveProperty('calculationDate');
          expect(res.body.metadata).toHaveProperty('installationType');
          expect(res.body.metadata).toHaveProperty('electricalSystem');
          
          expect(res.headers['x-pdf-hash']).toBeDefined();
          expect(res.headers['x-excel-hash']).toBeDefined();
          expect(res.headers['x-report-date']).toBeDefined();
        });
    });
  });

  describe('Error Handling Contract', () => {
    it('should return proper error structure for invalid input', () => {
      const invalidRequest = {
        superficies: [], // Array vacío - inválido
        consumos: []     // Array vacío - inválido
      };

      return request(app.getHttpServer())
        .post('/calc/rooms/preview')
        .send(invalidRequest)
        .expect(400)
        .expect((res) => {
          expect(res.body).toHaveProperty('message');
          expect(res.body).toHaveProperty('error');
          expect(res.body).toHaveProperty('statusCode');
          expect(Array.isArray(res.body.message)).toBe(true);
        });
    });

    it('should return proper error structure for missing required fields', () => {
      const incompleteRequest = {
        superficies: [
          { nombre: "Sala" } // Falta area_m2
        ]
      };

      return request(app.getHttpServer())
        .post('/calc/rooms/preview')
        .send(incompleteRequest)
        .expect(400)
        .expect((res) => {
          expect(res.body).toHaveProperty('message');
          expect(res.body).toHaveProperty('error');
          expect(res.body).toHaveProperty('statusCode');
          expect(Array.isArray(res.body.message)).toBe(true);
        });
    });
  });

  describe('Content Type Headers', () => {
    it('should return proper content type headers for JSON responses', () => {
      const requestData = {
        installationType: 'residencial',
        electricalSystem: 'Monofásico 120V'
      };

      return request(app.getHttpServer())
        .post('/calc/report')
        .send(requestData)
        .expect(200)
        .expect((res) => {
          expect(res.headers['content-type']).toContain('application/json');
        });
    });

    it('should return proper content type headers for binary downloads', () => {
      const requestData = {
        installationType: 'residencial',
        electricalSystem: 'Monofásico 120V'
      };

      return request(app.getHttpServer())
        .post('/calc/report/download')
        .send(requestData)
        .expect(200)
        .expect((res) => {
          expect(res.headers['content-type']).toContain('application/zip');
          expect(res.headers['content-disposition']).toContain('attachment');
        });
    });
  });
});
