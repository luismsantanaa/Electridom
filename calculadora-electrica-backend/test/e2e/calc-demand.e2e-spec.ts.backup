import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { DataSource } from 'typeorm';
import { DemandFactor } from '../../src/modules/calculos/entities/demand-factor.entity';

describe('CalcDemandController (e2e)', () => {
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
    await dataSource.query('DELETE FROM demand_factor');
    
    // Insertar factores de demanda de prueba
    const demandFactorRepository = dataSource.getRepository(DemandFactor);
    await demandFactorRepository.save([
      {
        category: 'lighting_general',
        rangeMin: 0,
        rangeMax: 999999,
        factor: 1.0,
        notes: 'Factor base para iluminación',
        usrCreate: 'TEST',
        usrUpdate: 'TEST',
        active: true,
      },
      {
        category: 'electrodomesticos',
        rangeMin: 0,
        rangeMax: 999999,
        factor: 0.85,
        notes: 'Factor para electrodomésticos',
        usrCreate: 'TEST',
        usrUpdate: 'TEST',
        active: true,
      },
      {
        category: 'tomas_generales',
        rangeMin: 0,
        rangeMax: 999999,
        factor: 1.0,
        notes: 'Factor para tomacorrientes',
        usrCreate: 'TEST',
        usrUpdate: 'TEST',
        active: true,
      },
    ]);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /calc/demand/preview', () => {
    const validRequest = {
      cargas_por_categoria: [
        {
          categoria: 'lighting_general',
          carga_va: 1453.5,
          descripcion: 'Iluminación general de todos los ambientes',
        },
        {
          categoria: 'tomas_generales',
          carga_va: 800.0,
          descripcion: 'Tomacorrientes generales',
        },
        {
          categoria: 'electrodomesticos',
          carga_va: 1473.7,
          descripcion: 'Nevera, microondas, lavadora, TV',
        },
        {
          categoria: 'climatizacion',
          carga_va: 1222.2,
          descripcion: 'Aires acondicionados',
        },
      ],
      totales: {
        carga_total_va: 4949.4,
        tension_v: 120,
        phases: 1,
      },
      observaciones: [
        'Cargas calculadas desde CE-01',
        'Factores RIE/NEC aplicables',
      ],
    };

    it('should apply demand factors successfully', () => {
      return request(app.getHttpServer())
        .post('/calc/demand/preview')
        .send(validRequest)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('cargas_diversificadas');
          expect(res.body).toHaveProperty('totales_diversificados');
          expect(res.body).toHaveProperty('observaciones_generales');
          expect(res.body).toHaveProperty('metadata');

          expect(res.body.cargas_diversificadas).toHaveLength(4);
          
          // Verificar iluminación (factor 1.0)
          const lighting = res.body.cargas_diversificadas.find(
            (c: any) => c.categoria === 'lighting_general',
          );
          expect(lighting.factor_demanda).toBe(1.0);
          expect(lighting.carga_diversificada_va).toBe(1453.5);

          // Verificar electrodomésticos (factor 0.85)
          const appliances = res.body.cargas_diversificadas.find(
            (c: any) => c.categoria === 'electrodomesticos',
          );
          expect(appliances.factor_demanda).toBe(0.85);
          expect(appliances.carga_diversificada_va).toBe(1252.65);

          // Verificar totales
          expect(res.body.totales_diversificados.carga_total_original_va).toBe(4949.4);
          expect(res.body.totales_diversificados.carga_total_diversificada_va).toBe(4728.05);
          expect(res.body.totales_diversificados.ahorro_carga_va).toBe(221.35);
        });
    });

    it('should handle category without defined factor', () => {
      const requestWithUnknownCategory = {
        ...validRequest,
        cargas_por_categoria: [
          {
            categoria: 'categoria_desconocida',
            carga_va: 500,
            descripcion: 'Categoría sin factor definido',
          },
        ],
        totales: {
          carga_total_va: 500,
          tension_v: 120,
          phases: 1,
        },
      };

      return request(app.getHttpServer())
        .post('/calc/demand/preview')
        .send(requestWithUnknownCategory)
        .expect(200)
        .expect((res) => {
          expect(res.body.cargas_diversificadas[0].factor_demanda).toBe(1.0);
          expect(res.body.cargas_diversificadas[0].carga_diversificada_va).toBe(500);
          expect(res.body.cargas_diversificadas[0].rango_aplicado).toBe('Sin factor definido');
        });
    });

    it('should handle empty cargas array', () => {
      const emptyRequest = {
        ...validRequest,
        cargas_por_categoria: [],
        totales: {
          carga_total_va: 0,
          tension_v: 120,
          phases: 1,
        },
      };

      return request(app.getHttpServer())
        .post('/calc/demand/preview')
        .send(emptyRequest)
        .expect(200)
        .expect((res) => {
          expect(res.body.cargas_diversificadas).toHaveLength(0);
          expect(res.body.totales_diversificados.carga_total_original_va).toBe(0);
          expect(res.body.totales_diversificados.carga_total_diversificada_va).toBe(0);
        });
    });

    it('should validate required fields', () => {
      const invalidRequest = {
        cargas_por_categoria: [
          {
            categoria: 'lighting_general',
            // falta carga_va
          },
        ],
        totales: {
          carga_total_va: 1000,
          tension_v: 120,
          phases: 1,
        },
      };

      return request(app.getHttpServer())
        .post('/calc/demand/preview')
        .send(invalidRequest)
        .expect(400);
    });

    it('should handle negative load values', () => {
      const negativeLoadRequest = {
        ...validRequest,
        cargas_por_categoria: [
          {
            categoria: 'lighting_general',
            carga_va: -100,
            descripcion: 'Carga negativa',
          },
        ],
        totales: {
          carga_total_va: -100,
          tension_v: 120,
          phases: 1,
        },
      };

      return request(app.getHttpServer())
        .post('/calc/demand/preview')
        .send(negativeLoadRequest)
        .expect(400);
    });

    it('should include metadata in response', () => {
      return request(app.getHttpServer())
        .post('/calc/demand/preview')
        .send(validRequest)
        .expect(200)
        .expect((res) => {
          expect(res.body.metadata).toBeDefined();
          expect(res.body.metadata.version).toBe('1.0');
          expect(res.body.metadata.timestamp).toBeDefined();
          expect(res.body.metadata.duracion_calculo_ms).toBeGreaterThan(0);
        });
    });

    it('should generate correct observations', () => {
      return request(app.getHttpServer())
        .post('/calc/demand/preview')
        .send(validRequest)
        .expect(200)
        .expect((res) => {
          expect(res.body.observaciones_generales).toBeDefined();
          expect(Array.isArray(res.body.observaciones_generales)).toBe(true);
          expect(res.body.observaciones_generales.length).toBeGreaterThan(0);
          
          // Verificar que contenga información sobre factores aplicados
          const observationsText = res.body.observaciones_generales.join(' ');
          expect(observationsText).toContain('Factores de demanda aplicados');
        });
    });
  });
});
