import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('CalcReportController (e2e)', () => {
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

  describe('POST /calc/report', () => {
    it('should generate report with complete data', () => {
      const requestData = {
        roomsData: {
          ambientes: [
            {
              nombre: 'Habitación Principal',
              area_m2: 15,
              tipo_ambiente: 'dormitorio',
              artefactos: [
                { tipo: 'lámpara', cantidad: 2, potencia_va: 60 },
                { tipo: 'tomacorriente', cantidad: 4, potencia_va: 180 },
              ],
            },
          ],
          parametros: {
            tipo_instalacion: 'residencial',
            tension_nominal_v: 120,
            phases: 1,
          },
        },
        demandData: {
          cargas_por_categoria: [
            {
              categoria: 'iluminacion_general',
              carga_bruta_va: 1200,
            },
            {
              categoria: 'tomas_generales',
              carga_bruta_va: 2400,
            },
          ],
          parametros: {
            tipo_instalacion: 'residencial',
          },
        },
        circuitsData: {
          circuitos_individuales: [
            {
              id_circuito: 'CIRC-001',
              nombre: 'Iluminación Habitación 1',
              corriente_a: 8.5,
              carga_va: 1020,
              longitud_m: 15,
            },
          ],
          parametros: {
            material_conductor: 'Cu',
            tipo_instalacion: 'residencial',
          },
        },
        feederData: {
          circuitos_ramales: [
            {
              id_circuito: 'CIRC-001',
              nombre: 'Iluminación Habitación 1',
              corriente_total_a: 8.5,
              carga_total_va: 1020,
              longitud_m: 15,
            },
          ],
          sistema: {
            tension_v: 120,
            phases: 1,
            corriente_total_a: 8.5,
            carga_total_va: 1020,
          },
          parametros: {
            longitud_alimentador_m: 50,
            material_conductor: 'Cu',
            max_caida_ramal_pct: 3,
            max_caida_total_pct: 5,
          },
        },
        groundingData: {
          sistema: {
            tension_v: 120,
            phases: 1,
            corriente_total_a: 8.5,
            carga_total_va: 1020,
          },
          alimentador: {
            corriente_a: 8.5,
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
        },
        installationType: 'residencial',
        electricalSystem: 'Monofásico 120V',
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
          expect(res.body.metadata).toHaveProperty('normsVersion');
          expect(res.body.metadata).toHaveProperty('systemVersion');
          expect(res.body.metadata).toHaveProperty('installationType');
          expect(res.body.metadata).toHaveProperty('electricalSystem');
          expect(res.body.metadata).toHaveProperty('totalCurrent');
          expect(res.body.metadata).toHaveProperty('totalLoad');
          expect(res.body.metadata).toHaveProperty('circuitCount');
          expect(res.body.metadata).toHaveProperty('generalStatus');
          expect(res.body.metadata).toHaveProperty('observations');
          
          expect(res.body.metadata.installationType).toBe('residencial');
          expect(res.body.metadata.electricalSystem).toBe('Monofásico 120V');
          expect(res.body.metadata.normsVersion).toBe('NEC 2023 + RIE RD');
          expect(res.body.metadata.systemVersion).toBe('1.0.0');
          expect(res.body.message).toBe('Reporte generado exitosamente');
          
          expect(res.headers['x-pdf-hash']).toBeDefined();
          expect(res.headers['x-excel-hash']).toBeDefined();
          expect(res.headers['x-report-date']).toBeDefined();
        });
    });

    it('should generate report with minimal data', () => {
      const requestData = {
        installationType: 'comercial',
        electricalSystem: 'Trifásico 208V',
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
          
          expect(res.body.metadata.installationType).toBe('comercial');
          expect(res.body.metadata.electricalSystem).toBe('Trifásico 208V');
          expect(res.body.metadata.totalCurrent).toBe(0);
          expect(res.body.metadata.totalLoad).toBe(0);
          expect(res.body.metadata.circuitCount).toBe(0);
        });
    });

    it('should generate report with calculationId', () => {
      const requestData = {
        calculationId: 'calc-12345',
        installationType: 'industrial',
        electricalSystem: 'Trifásico 480V',
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
          
          expect(res.body.metadata.installationType).toBe('industrial');
          expect(res.body.metadata.electricalSystem).toBe('Trifásico 480V');
        });
    });

    it('should handle empty request', () => {
      const requestData = {};

      return request(app.getHttpServer())
        .post('/calc/report')
        .send(requestData)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('pdfBase64');
          expect(res.body).toHaveProperty('excelBase64');
          expect(res.body).toHaveProperty('metadata');
          expect(res.body).toHaveProperty('message');
          
          expect(res.body.metadata.totalCurrent).toBe(0);
          expect(res.body.metadata.totalLoad).toBe(0);
          expect(res.body.metadata.circuitCount).toBe(0);
        });
    });

    it('should validate installationType enum', () => {
      const requestData = {
        installationType: 'invalid_type',
        electricalSystem: 'Monofásico 120V',
      };

      return request(app.getHttpServer())
        .post('/calc/report')
        .send(requestData)
        .expect(400)
        .expect((res) => {
          expect(res.body).toHaveProperty('message');
          expect(Array.isArray(res.body.message)).toBe(true);
          expect(res.body.message).toContain(
            'installationType must be one of the following values: residencial, comercial, industrial',
          );
        });
    });

    it('should validate calculationId as string', () => {
      const requestData = {
        calculationId: 12345, // Should be string
        installationType: 'residencial',
      };

      return request(app.getHttpServer())
        .post('/calc/report')
        .send(requestData)
        .expect(400)
        .expect((res) => {
          expect(res.body).toHaveProperty('message');
          expect(Array.isArray(res.body.message)).toBe(true);
          expect(res.body.message).toContain('calculationId must be a string');
        });
    });

    it('should handle partial data with only rooms', () => {
      const requestData = {
        roomsData: {
          ambientes: [
            {
              nombre: 'Sala de Estar',
              area_m2: 20,
              tipo_ambiente: 'sala',
              artefactos: [
                { tipo: 'lámpara', cantidad: 3, potencia_va: 60 },
                { tipo: 'tomacorriente', cantidad: 6, potencia_va: 180 },
              ],
            },
          ],
          parametros: {
            tipo_instalacion: 'residencial',
            tension_nominal_v: 120,
            phases: 1,
          },
        },
        installationType: 'residencial',
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
          
          expect(res.body.metadata.installationType).toBe('residencial');
          expect(res.body.metadata.roomLoads).toBeDefined();
        });
    });

    it('should handle partial data with only demand', () => {
      const requestData = {
        demandData: {
          cargas_por_categoria: [
            {
              categoria: 'iluminacion_general',
              carga_bruta_va: 1500,
            },
          ],
          parametros: {
            tipo_instalacion: 'comercial',
          },
        },
        installationType: 'comercial',
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
          
          expect(res.body.metadata.installationType).toBe('comercial');
          expect(res.body.metadata.demandAnalysis).toBeDefined();
        });
    });

    it('should handle partial data with only circuits', () => {
      const requestData = {
        circuitsData: {
          circuitos_individuales: [
            {
              id_circuito: 'CIRC-001',
              nombre: 'Circuito de Prueba',
              corriente_a: 10,
              carga_va: 1200,
              longitud_m: 20,
            },
          ],
          parametros: {
            material_conductor: 'Cu',
            tipo_instalacion: 'industrial',
          },
        },
        installationType: 'industrial',
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
          
          expect(res.body.metadata.installationType).toBe('industrial');
          expect(res.body.metadata.circuits).toBeDefined();
        });
    });

    it('should handle partial data with only feeder', () => {
      const requestData = {
        feederData: {
          circuitos_ramales: [
            {
              id_circuito: 'CIRC-001',
              nombre: 'Alimentador Principal',
              corriente_total_a: 15,
              carga_total_va: 1800,
              longitud_m: 30,
            },
          ],
          sistema: {
            tension_v: 120,
            phases: 1,
            corriente_total_a: 15,
            carga_total_va: 1800,
          },
          parametros: {
            longitud_alimentador_m: 40,
            material_conductor: 'Cu',
            max_caida_ramal_pct: 3,
            max_caida_total_pct: 5,
          },
        },
        installationType: 'residencial',
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
          
          expect(res.body.metadata.installationType).toBe('residencial');
          expect(res.body.metadata.voltageDropAnalysis).toBeDefined();
        });
    });

    it('should handle partial data with only grounding', () => {
      const requestData = {
        groundingData: {
          sistema: {
            tension_v: 120,
            phases: 1,
            corriente_total_a: 20,
            carga_total_va: 2400,
          },
          alimentador: {
            corriente_a: 20,
            seccion_mm2: 16,
            material: 'Cu',
            longitud_m: 25,
          },
          parametros: {
            main_breaker_amp: 150,
            tipo_instalacion: 'comercial',
            tipo_sistema_tierra: 'TN-S',
            resistividad_suelo_ohm_m: 80,
          },
        },
        installationType: 'comercial',
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
          
          expect(res.body.metadata.installationType).toBe('comercial');
          expect(res.body.metadata.groundingStatus).toBeDefined();
        });
    });

    it('should return proper content type headers', () => {
      const requestData = {
        installationType: 'residencial',
        electricalSystem: 'Monofásico 120V',
      };

      return request(app.getHttpServer())
        .post('/calc/report')
        .send(requestData)
        .expect(200)
        .expect((res) => {
          expect(res.headers['content-type']).toContain('application/json');
          expect(res.headers['x-pdf-hash']).toBeDefined();
          expect(res.headers['x-excel-hash']).toBeDefined();
          expect(res.headers['x-report-date']).toBeDefined();
        });
    });

    it('should generate unique hashes for different requests', async () => {
      const requestData1 = {
        installationType: 'residencial',
        electricalSystem: 'Monofásico 120V',
      };

      const requestData2 = {
        installationType: 'comercial',
        electricalSystem: 'Trifásico 208V',
      };

      const response1 = await request(app.getHttpServer())
        .post('/calc/report')
        .send(requestData1)
        .expect(200);

      const response2 = await request(app.getHttpServer())
        .post('/calc/report')
        .send(requestData2)
        .expect(200);

      expect(response1.body.metadata.pdfHash).not.toBe(response2.body.metadata.pdfHash);
      expect(response1.body.metadata.excelHash).not.toBe(response2.body.metadata.excelHash);
    });
  });

  describe('POST /calc/report/download', () => {
    it('should download report as binary files', () => {
      const requestData = {
        installationType: 'residencial',
        electricalSystem: 'Monofásico 120V',
      };

      return request(app.getHttpServer())
        .post('/calc/report/download')
        .send(requestData)
        .expect(200)
        .expect((res) => {
          expect(res.headers['content-type']).toContain('application/zip');
          expect(res.headers['content-disposition']).toContain('attachment');
          expect(res.headers['content-disposition']).toContain('reporte-electrico-');
          expect(res.headers['x-pdf-hash']).toBeDefined();
          expect(res.headers['x-excel-hash']).toBeDefined();
        });
    });

    it('should validate input for download endpoint', () => {
      const requestData = {
        installationType: 'invalid_type',
      };

      return request(app.getHttpServer())
        .post('/calc/report/download')
        .send(requestData)
        .expect(400)
        .expect((res) => {
          expect(res.body).toHaveProperty('message');
          expect(Array.isArray(res.body.message)).toBe(true);
        });
    });
  });
});
