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

  describe('CORS Configuration', () => {
    it('should allow CORS preflight requests', () => {
      return request(app.getHttpServer())
        .options('/api/calc/rooms/preview')
        .set('Origin', 'http://localhost:4200')
        .set('Access-Control-Request-Method', 'POST')
        .set('Access-Control-Request-Headers', 'Content-Type')
        .expect(204)
        .expect('Access-Control-Allow-Origin', 'http://localhost:4200')
        .expect('Access-Control-Allow-Methods', /POST/)
        .expect('Access-Control-Allow-Headers', /Content-Type/);
    });

    it('should include required CORS headers in responses', () => {
      return request(app.getHttpServer())
        .post('/api/calc/rooms/preview')
        .set('Origin', 'http://localhost:4200')
        .send({
          superficies: [{ nombre: 'Sala', area_m2: 20 }],
          consumos: [{ nombre: 'TV', ambiente: 'Sala', potencia_w: 100 }]
        })
        .expect(200)
        .expect('Access-Control-Allow-Origin', 'http://localhost:4200')
        .expect('Access-Control-Allow-Credentials', 'true');
    });
  });

  describe('API Endpoints Contract', () => {
    describe('POST /api/calc/rooms/preview', () => {
      it('should accept valid frontend payload', () => {
        const validPayload = {
          system: {
            voltage: 120,
            phases: 1,
            frequency: 60
          },
          superficies: [
            { nombre: 'Sala', area_m2: 18.5 },
            { nombre: 'Cocina', area_m2: 12.0 }
          ],
          consumos: [
            { nombre: 'Refrigerador', ambiente: 'Cocina', potencia_w: 350, fp: 0.85, tipo: 'electrodomestico' },
            { nombre: 'Televisor', ambiente: 'Sala', potencia_w: 120, fp: 0.9, tipo: 'electrodomestico' }
          ]
        };

        return request(app.getHttpServer())
          .post('/api/calc/rooms/preview')
          .send(validPayload)
          .expect(200)
          .expect((res) => {
            expect(res.body).toHaveProperty('ambientes');
            expect(res.body).toHaveProperty('totales');
            expect(Array.isArray(res.body.ambientes)).toBe(true);
            expect(res.body.totales).toHaveProperty('carga_total_va');
            expect(res.body.totales).toHaveProperty('corriente_total_a');
          });
      });

      it('should validate required fields', () => {
        const invalidPayload = {
          superficies: [],
          consumos: []
        };

        return request(app.getHttpServer())
          .post('/api/calc/rooms/preview')
          .send(invalidPayload)
          .expect(400);
      });
    });

    describe('POST /api/calc/demand/preview', () => {
      it('should accept valid frontend payload', () => {
        const validPayload = {
          system: {
            voltage: 120,
            phases: 1,
            frequency: 60
          },
          superficies: [
            { nombre: 'Sala', area_m2: 18.5 }
          ],
          consumos: [
            { nombre: 'Televisor', ambiente: 'Sala', potencia_w: 120, fp: 0.9, tipo: 'electrodomestico' }
          ]
        };

        return request(app.getHttpServer())
          .post('/api/calc/demand/preview')
          .send(validPayload)
          .expect(200)
          .expect((res) => {
            expect(res.body).toHaveProperty('ambientes');
            expect(res.body).toHaveProperty('totales');
            expect(res.body.totales).toHaveProperty('factor_demanda_promedio');
          });
      });
    });

    describe('POST /api/calc/circuits/preview', () => {
      it('should accept valid frontend payload', () => {
        const validPayload = {
          system: {
            voltage: 120,
            phases: 1,
            frequency: 60
          },
          superficies: [
            { nombre: 'Sala', area_m2: 18.5 }
          ],
          consumos: [
            { nombre: 'Televisor', ambiente: 'Sala', potencia_w: 120, fp: 0.9, tipo: 'electrodomestico' }
          ]
        };

        return request(app.getHttpServer())
          .post('/api/calc/circuits/preview')
          .send(validPayload)
          .expect(200)
          .expect((res) => {
            expect(res.body).toHaveProperty('circuitos');
            expect(res.body).toHaveProperty('totales');
            expect(Array.isArray(res.body.circuitos)).toBe(true);
          });
      });
    });

    describe('POST /api/calc/feeder/preview', () => {
      it('should accept valid frontend payload', () => {
        const validPayload = {
          system: {
            voltage: 120,
            phases: 1,
            frequency: 60
          },
          superficies: [
            { nombre: 'Sala', area_m2: 18.5 }
          ],
          consumos: [
            { nombre: 'Televisor', ambiente: 'Sala', potencia_w: 120, fp: 0.9, tipo: 'electrodomestico' }
          ]
        };

        return request(app.getHttpServer())
          .post('/api/calc/feeder/preview')
          .send(validPayload)
          .expect(200)
          .expect((res) => {
            expect(res.body).toHaveProperty('alimentador');
            expect(res.body).toHaveProperty('totales');
            expect(res.body.alimentador).toHaveProperty('conductor');
            expect(res.body.alimentador).toHaveProperty('proteccion');
          });
      });
    });

    describe('POST /api/calc/grounding/preview', () => {
      it('should accept valid frontend payload', () => {
        const validPayload = {
          system: {
            voltage: 120,
            phases: 1,
            frequency: 60
          },
          superficies: [
            { nombre: 'Sala', area_m2: 18.5 }
          ],
          consumos: [
            { nombre: 'Televisor', ambiente: 'Sala', potencia_w: 120, fp: 0.9, tipo: 'electrodomestico' }
          ]
        };

        return request(app.getHttpServer())
          .post('/api/calc/grounding/preview')
          .send(validPayload)
          .expect(200)
          .expect((res) => {
            expect(res.body).toHaveProperty('puesta_tierra');
            expect(res.body).toHaveProperty('totales');
            expect(res.body.puesta_tierra).toHaveProperty('conductor');
            expect(res.body.puesta_tierra).toHaveProperty('electrodo');
          });
      });
    });

    describe('POST /api/calc/report', () => {
      it('should accept valid frontend payload for PDF report', () => {
        const validPayload = {
          system: {
            voltage: 120,
            phases: 1,
            frequency: 60
          },
          superficies: [
            { nombre: 'Sala', area_m2: 18.5 }
          ],
          consumos: [
            { nombre: 'Televisor', ambiente: 'Sala', potencia_w: 120, fp: 0.9, tipo: 'electrodomestico' }
          ]
        };

        return request(app.getHttpServer())
          .post('/api/calc/report?type=pdf')
          .send(validPayload)
          .expect(200)
          .expect('Content-Type', /application\/pdf/);
      });

      it('should accept valid frontend payload for Excel report', () => {
        const validPayload = {
          system: {
            voltage: 120,
            phases: 1,
            frequency: 60
          },
          superficies: [
            { nombre: 'Sala', area_m2: 18.5 }
          ],
          consumos: [
            { nombre: 'Televisor', ambiente: 'Sala', potencia_w: 120, fp: 0.9, tipo: 'electrodomestico' }
          ]
        };

        return request(app.getHttpServer())
          .post('/api/calc/report?type=xlsx')
          .send(validPayload)
          .expect(200)
          .expect('Content-Type', /application\/vnd\.openxmlformats-officedocument\.spreadsheetml\.sheet/);
      });
    });
  });

  describe('Error Handling Contract', () => {
    it('should return consistent error format', () => {
      return request(app.getHttpServer())
        .post('/api/calc/rooms/preview')
        .send({})
        .expect(400)
        .expect((res) => {
          expect(res.body).toHaveProperty('message');
          expect(res.body).toHaveProperty('statusCode');
          expect(res.body).toHaveProperty('timestamp');
          expect(res.body).toHaveProperty('path');
        });
    });

    it('should handle validation errors properly', () => {
      const invalidPayload = {
        superficies: [{ nombre: '', area_m2: -1 }],
        consumos: [{ nombre: '', ambiente: '', potencia_w: 0 }]
      };

      return request(app.getHttpServer())
        .post('/api/calc/rooms/preview')
        .send(invalidPayload)
        .expect(400)
        .expect((res) => {
          expect(res.body).toHaveProperty('message');
          expect(res.body).toHaveProperty('errors');
          expect(Array.isArray(res.body.errors)).toBe(true);
        });
    });
  });

  describe('Response Headers Contract', () => {
    it('should include required headers in all responses', () => {
      return request(app.getHttpServer())
        .post('/api/calc/rooms/preview')
        .send({
          superficies: [{ nombre: 'Sala', area_m2: 20 }],
          consumos: [{ nombre: 'TV', ambiente: 'Sala', potencia_w: 100 }]
        })
        .expect(200)
        .expect('Content-Type', /application\/json/)
        .expect((res) => {
          expect(res.headers).toHaveProperty('x-request-id');
          expect(res.headers).toHaveProperty('x-response-time');
        });
    });
  });
});

