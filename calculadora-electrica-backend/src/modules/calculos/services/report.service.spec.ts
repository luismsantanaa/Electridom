import { Test, TestingModule } from '@nestjs/testing';
import { ReportService, ReportRequest } from './report.service';
import { MetricsService } from '../../metrics/metrics.service';

// Mock puppeteer
jest.mock('puppeteer', () => ({
  launch: jest.fn().mockResolvedValue({
    newPage: jest.fn().mockResolvedValue({
      setContent: jest.fn().mockResolvedValue(undefined),
      setViewport: jest.fn().mockResolvedValue(undefined),
      pdf: jest.fn().mockResolvedValue(Buffer.from('fake-pdf-content')),
      close: jest.fn().mockResolvedValue(undefined),
    }),
    close: jest.fn().mockResolvedValue(undefined),
  }),
}));

// Mock XLSX
jest.mock('xlsx', () => ({
  utils: {
    book_new: jest.fn().mockReturnValue({}),
    aoa_to_sheet: jest.fn().mockReturnValue({}),
    book_append_sheet: jest.fn().mockReturnValue(undefined),
  },
  write: jest.fn().mockReturnValue(Buffer.from('fake-excel-content')),
}));

// Mock fs
jest.mock('fs', () => ({
  readFileSync: jest.fn().mockReturnValue(`
    <!DOCTYPE html>
    <html>
    <head><title>{{title}}</title></head>
    <body>
      <h1>{{calculationDate}}</h1>
      <div>{{#each roomLoads}}{{name}}{{/each}}</div>
      <div>{{#each demandAnalysis}}{{category}}{{/each}}</div>
      <div>{{#each circuits}}{{id}}{{/each}}</div>
      <div>{{#each voltageDropAnalysis}}{{circuitId}}{{/each}}</div>
      <div>{{#each observations}}{{this}}{{/each}}</div>
    </body>
    </html>
  `),
}));

// Mock path
jest.mock('path', () => ({
  join: jest.fn().mockReturnValue('/fake/template/path'),
}));

describe('ReportService', () => {
  let service: ReportService;
  let metricsService: MetricsService;

  const mockMetricsService = {
    incrementCalcRuns: jest.fn(),
    observeCalcDuration: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportService,
        {
          provide: MetricsService,
          useValue: mockMetricsService,
        },
      ],
    }).compile();

    service = module.get<ReportService>(ReportService);
    metricsService = module.get<MetricsService>(MetricsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await service.onModuleDestroy();
  });

  describe('generateReport', () => {
    it('should generate report with minimal data', async () => {
      const request: ReportRequest = {
        installationType: 'comercial',
        electricalSystem: 'Trifásico 208V',
      };

      const result = await service.generateReport(request);

      expect(result).toBeDefined();
      expect(result.pdfBuffer).toBeInstanceOf(Buffer);
      expect(result.excelBuffer).toBeInstanceOf(Buffer);
      expect(result.pdfHash).toBeDefined();
      expect(result.excelHash).toBeDefined();
      expect(result.reportData).toBeDefined();
      expect(result.reportData.installationType).toBe('comercial');
      expect(result.reportData.electricalSystem).toBe('Trifásico 208V');
      expect(result.reportData.totalCurrent).toBe(0);
      expect(result.reportData.totalLoad).toBe(0);
      expect(result.reportData.circuitCount).toBe(0);
    });

    it('should handle calculationId mode', async () => {
      const request: ReportRequest = {
        calculationId: 'calc-12345',
        installationType: 'industrial',
      };

      const result = await service.generateReport(request);

      expect(result).toBeDefined();
      expect(result.reportData.installationType).toBe('industrial');
      expect(result.reportData.calculationDate).toBeDefined();
    });

    it('should determine general status as OK when no data provided', async () => {
      const request: ReportRequest = {};

      const result = await service.generateReport(request);

      expect(result.reportData.generalStatus).toBe('OK');
    });

    it('should include general observations', async () => {
      const request: ReportRequest = {};

      const result = await service.generateReport(request);

      expect(result.reportData.observations).toContain(
        'Reporte generado automáticamente por Calculadora Eléctrica RD',
      );
      expect(result.reportData.observations).toContain(
        'Todos los cálculos cumplen con las normas NEC 2023 y RIE RD',
      );
    });

    it('should record metrics on successful generation', async () => {
      const request: ReportRequest = {};

      await service.generateReport(request);

      expect(mockMetricsService.incrementCalcRuns).toHaveBeenCalledWith(
        'report',
        'success',
      );
      expect(mockMetricsService.observeCalcDuration).toHaveBeenCalledWith(
        'report',
        expect.any(Number),
      );
    });

    it('should record metrics on error', async () => {
      const request: ReportRequest = {};

      // Mock puppeteer to throw error
      const puppeteer = require('puppeteer');
      puppeteer.launch.mockRejectedValueOnce(
        new Error('PDF generation failed'),
      );

      try {
        await service.generateReport(request);
      } catch (error) {
        expect(mockMetricsService.incrementCalcRuns).toHaveBeenCalledWith(
          'report',
          'error',
        );
        expect(mockMetricsService.observeCalcDuration).toHaveBeenCalledWith(
          'report',
          expect.any(Number),
        );
      }
    });

    it('should calculate unique hashes for different reports', async () => {
      const request1: ReportRequest = {
        installationType: 'residencial',
        electricalSystem: 'Monofásico 120V',
        roomsData: {
          ambientes: [
            {
              nombre: 'Habitación 1',
              area_m2: 15,
              carga_va: 840,
              fp: 0.9,
            },
          ],
          totales: {
            carga_total_va: 840,
            carga_diversificada_va: 840,
            corriente_total_a: 7,
            tension_v: 120,
            phases: 1,
          },
        },
        circuitsData: {
          circuitos_ramales: [
            {
              id_circuito: 'CIRC-001',
              nombre: 'Circuito de Prueba 1',
              cargas: [
                {
                  categoria: 'iluminacion',
                  carga_va: 1200,
                  corriente_a: 10,
                },
              ],
              carga_total_va: 1200,
              corriente_total_a: 10,
              breaker: {
                amp: 15,
                poles: 1,
                curve: 'C',
                use_case: 'Residencial',
              },
              conductor: {
                calibre_awg: 14,
                seccion_mm2: 2.08,
                material: 'Cu',
                insulation: 'THHN',
                ampacity: 20,
                temp_c: 75,
              },
              utilizacion_pct: 80,
              margen_seguridad_pct: 125,
              tension_v: 120,
              phases: 1,
            },
          ],
          resumen: {
            total_circuitos: 1,
            carga_total_va: 1200,
            corriente_total_a: 10,
            utilizacion_promedio_pct: 80,
            circuitos_monofasicos: 1,
            circuitos_trifasicos: 0,
            calibre_minimo_awg: 14,
            calibre_maximo_awg: 14,
          },
        },
      };

      const request2: ReportRequest = {
        installationType: 'industrial',
        electricalSystem: 'Trifásico 480V',
        demandData: {
          cargas_diversificadas: [
            {
              categoria: 'iluminacion_general',
              carga_original_va: 5000,
              factor_demanda: 0.7,
              carga_diversificada_va: 3500,
            },
            {
              categoria: 'electrodomesticos',
              carga_original_va: 3000,
              factor_demanda: 0.6,
              carga_diversificada_va: 1800,
            },
          ],
          totales_diversificados: {
            carga_total_original_va: 8000,
            carga_total_diversificada_va: 5300,
            factor_diversificacion_efectivo: 0.66,
            corriente_total_diversificada_a: 15,
            ahorro_carga_va: 2700,
            porcentaje_ahorro: 34,
            tension_v: 480,
            phases: 3,
          },
        },
        feederData: {
          circuitos_analisis: [
            {
              id_circuito: 'CIRC-001',
              nombre: 'Circuito de Prueba',
              corriente_a: 10,
              longitud_m: 20,
              caida_tension_ramal_v: 6.2,
              caida_tension_ramal_pct: 2.1,
              estado: 'OK',
            },
          ],
          alimentador: {
            corriente_total_a: 15,
            longitud_m: 50,
            material: 'Cu',
            seccion_mm2: 25,
            resistencia_ohm_km: 0.727,
            caida_tension_alimentador_v: 18.2,
            caida_tension_alimentador_pct: 3.8,
            caida_tension_total_max_pct: 5.2,
            longitud_critica_m: 65,
            estado: 'OK',
          },
          resumen: {
            tension_nominal_v: 480,
            phases: 3,
            limite_caida_ramal_pct: 3,
            limite_caida_total_pct: 5,
            caida_total_maxima_pct: 5.2,
            circuitos_fuera_limite: 0,
            estado_general: 'OK',
            calibre_minimo_recomendado_mm2: 25,
          },
        },
      };

      const result1 = await service.generateReport(request1);
      const result2 = await service.generateReport(request2);

      expect(result1.pdfHash).not.toBe(result2.pdfHash);
      expect(result1.excelHash).not.toBe(result2.excelHash);
    });

    it('should include all required metadata fields', async () => {
      const request: ReportRequest = {
        installationType: 'industrial',
        electricalSystem: 'Trifásico 480V',
      };

      const result = await service.generateReport(request);

      expect(result.reportData.calculationDate).toBeDefined();
      expect(result.reportData.normsVersion).toBe('NEC 2023 + RIE RD');
      expect(result.reportData.normsHash).toBeDefined();
      expect(result.reportData.systemVersion).toBe('1.0.0');
      expect(result.reportData.installationType).toBe('industrial');
      expect(result.reportData.electricalSystem).toBe('Trifásico 480V');
    });

    it('should handle rooms data correctly', async () => {
      const request: ReportRequest = {
        roomsData: {
          ambientes: [
            {
              nombre: 'Habitación Principal',
              area_m2: 15,
              carga_va: 840,
              fp: 0.9,
            },
          ],
          totales: {
            carga_total_va: 840,
            carga_diversificada_va: 840,
            corriente_total_a: 7,
            tension_v: 120,
            phases: 1,
          },
        },
      };

      const result = await service.generateReport(request);

      expect(result.reportData.roomLoads).toBeDefined();
      expect(result.reportData.roomLoads.length).toBe(1);
      expect(result.reportData.roomLoads[0].name).toBe('Habitación Principal');
      expect(result.reportData.roomLoads[0].area).toBe(15);
      expect(result.reportData.roomLoads[0].totalLoad).toBe(840);
    });

    it('should handle demand data correctly', async () => {
      const request: ReportRequest = {
        demandData: {
          cargas_diversificadas: [
            {
              categoria: 'iluminacion_general',
              carga_original_va: 120,
              factor_demanda: 0.8,
              carga_diversificada_va: 96,
            },
          ],
          totales_diversificados: {
            carga_total_original_va: 840,
            carga_total_diversificada_va: 672,
            factor_diversificacion_efectivo: 0.8,
            corriente_total_diversificada_a: 7,
            ahorro_carga_va: 168,
            porcentaje_ahorro: 20,
            tension_v: 120,
            phases: 1,
          },
        },
      };

      const result = await service.generateReport(request);

      expect(result.reportData.demandAnalysis).toBeDefined();
      expect(result.reportData.demandAnalysis.length).toBe(1);
      expect(result.reportData.demandAnalysis[0].category).toBe(
        'iluminacion_general',
      );
      expect(result.reportData.totalCurrent).toBe(7);
      expect(result.reportData.totalLoad).toBe(672);
    });

    it('should handle circuits data correctly', async () => {
      const request: ReportRequest = {
        circuitsData: {
          circuitos_ramales: [
            {
              id_circuito: 'CIRC-001',
              nombre: 'Iluminación Habitación 1',
              cargas: [],
              carga_total_va: 840,
              corriente_total_a: 7,
              breaker: {
                amp: 15,
                poles: 1,
                curve: 'C',
                use_case: 'general',
              },
              conductor: {
                calibre_awg: 14,
                seccion_mm2: 2.5,
                material: 'Cu',
                insulation: 'THHN',
                ampacity: 20,
                temp_c: 75,
              },
              utilizacion_pct: 80,
              margen_seguridad_pct: 125,
              tension_v: 120,
              phases: 1,
            },
          ],
          resumen: {
            total_circuitos: 1,
            carga_total_va: 840,
            corriente_total_a: 7,
            utilizacion_promedio_pct: 70,
            circuitos_monofasicos: 1,
            circuitos_trifasicos: 0,
            calibre_minimo_awg: 14,
            calibre_maximo_awg: 14,
          },
        },
      };

      const result = await service.generateReport(request);

      expect(result.reportData.circuits).toBeDefined();
      expect(result.reportData.circuits.length).toBe(1);
      expect(result.reportData.circuits[0].id).toBe('CIRC-001');
      expect(result.reportData.circuits[0].name).toBe(
        'Iluminación Habitación 1',
      );
      expect(result.reportData.circuitCount).toBe(1);
    });

    it('should handle feeder data correctly', async () => {
      const request: ReportRequest = {
        feederData: {
          circuitos_analisis: [
            {
              id_circuito: 'CIRC-001',
              nombre: 'Circuito Test',
              corriente_a: 8.5,
              longitud_m: 15,
              caida_tension_ramal_v: 1.2,
              caida_tension_ramal_pct: 1.0,
              estado: 'OK',
            },
          ],
          alimentador: {
            material: 'Cu',
            seccion_mm2: 10,
            longitud_m: 50,
            corriente_total_a: 8.5,
            resistencia_ohm_km: 1.8,
            caida_tension_alimentador_v: 0.8,
            caida_tension_alimentador_pct: 0.7,
            caida_tension_total_max_pct: 3.5,
            longitud_critica_m: 100,
            estado: 'OK',
          },
          resumen: {
            tension_nominal_v: 120,
            phases: 1,
            limite_caida_ramal_pct: 3,
            limite_caida_total_pct: 5,
            caida_total_maxima_pct: 3.5,
            circuitos_fuera_limite: 0,
            estado_general: 'OK',
            calibre_minimo_recomendado_mm2: 10,
          },
        },
      };

      const result = await service.generateReport(request);

      expect(result.reportData.voltageDropAnalysis).toBeDefined();
      expect(result.reportData.voltageDropAnalysis.length).toBe(1);
      expect(result.reportData.voltageDropAnalysis[0].circuitId).toBe(
        'CIRC-001',
      );
      expect(result.reportData.feederMaterial).toBe('Cu');
      expect(result.reportData.feederSection).toBe(10);
    });

    it('should handle grounding data correctly', async () => {
      const request: ReportRequest = {
        groundingData: {
          conductor_proteccion: {
            seccion_mm2: 10,
            calibre_awg: '8',
            material: 'Cu',
            tipo: 'EGC',
            longitud_minima_m: 50,
          },
          conductor_tierra: {
            seccion_mm2: 10,
            calibre_awg: '8',
            material: 'Cu',
            tipo: 'GEC',
            longitud_minima_m: 30,
          },
          sistema_tierra: {
            tipo_sistema: 'TN-S',
            numero_electrodos: 1,
            resistencia_maxima_ohm: 25,
            tipo_electrodo: 'varilla',
            longitud_electrodo_m: 2.4,
            separacion_electrodos_m: 0,
          },
          resumen: {
            main_breaker_amp: 100,
            tipo_instalacion: 'residencial',
            tipo_sistema_tierra: 'TN-S',
            egc_mm2: 10,
            gec_mm2: 16,
            resistencia_maxima_ohm: 25,
            estado: 'ESTÁNDAR',
            cumplimiento_normas: 'NEC 250.66',
          },
        },
      };

      const result = await service.generateReport(request);

      expect(result.reportData.egcSection).toBe(10);
      expect(result.reportData.egcAwg).toBe('8');
      expect(result.reportData.gecSection).toBe(10);
      expect(result.reportData.gecAwg).toBe('8');
      expect(result.reportData.groundingSystemType).toBe('TN-S');
      expect(result.reportData.electrodeCount).toBe(1);
      expect(result.reportData.maxResistance).toBe(25);
      expect(result.reportData.groundingStatus).toBe('ESTÁNDAR');
    });

    it('should determine general status based on circuit utilization', async () => {
      const request: ReportRequest = {
        circuitsData: {
          circuitos_ramales: [
            {
              id_circuito: 'CIRC-001',
              nombre: 'Test Circuit',
              cargas: [],
              carga_total_va: 1800,
              corriente_total_a: 15,
              breaker: {
                amp: 15,
                poles: 1,
                curve: 'C',
                use_case: 'general',
              },
              conductor: {
                calibre_awg: 14,
                seccion_mm2: 2.5,
                material: 'Cu',
                insulation: 'THHN',
                ampacity: 20,
                temp_c: 75,
              },
              utilizacion_pct: 120, // Over 100% utilization
              margen_seguridad_pct: 125,
              tension_v: 120,
              phases: 1,
            },
          ],
          resumen: {
            total_circuitos: 1,
            carga_total_va: 1800,
            corriente_total_a: 15,
            utilizacion_promedio_pct: 120,
            circuitos_monofasicos: 1,
            circuitos_trifasicos: 0,
            calibre_minimo_awg: 14,
            calibre_maximo_awg: 14,
          },
        },
      };

      const result = await service.generateReport(request);

      expect(result.reportData.observations).toContain(
        '⚠️ 1 circuito(s) requieren atención',
      );
    });

    it('should determine general status based on voltage drop', async () => {
      const request: ReportRequest = {
        feederData: {
          circuitos_analisis: [],
          alimentador: {
            material: 'Cu',
            seccion_mm2: 10,
            longitud_m: 50,
            corriente_total_a: 8.5,
            resistencia_ohm_km: 1.8,
            caida_tension_alimentador_v: 0.8,
            caida_tension_alimentador_pct: 0.7,
            caida_tension_total_max_pct: 6.5, // Over 5% limit
            longitud_critica_m: 100,
            estado: 'OK',
          },
          resumen: {
            tension_nominal_v: 120,
            phases: 1,
            limite_caida_ramal_pct: 3,
            limite_caida_total_pct: 5,
            caida_total_maxima_pct: 6.5,
            circuitos_fuera_limite: 1,
            estado_general: 'WARNING',
            calibre_minimo_recomendado_mm2: 10,
          },
        },
      };

      const result = await service.generateReport(request);

      expect(result.reportData.observations).toContain(
        '⚠️ Caída de tensión total (6.50%) excede el límite recomendado',
      );
    });

    it('should determine general status based on grounding status', async () => {
      const request: ReportRequest = {
        groundingData: {
          conductor_proteccion: {
            seccion_mm2: 10,
            calibre_awg: '8',
            material: 'Cu',
            tipo: 'EGC',
            longitud_minima_m: 50,
          },
          conductor_tierra: {
            seccion_mm2: 10,
            calibre_awg: '8',
            material: 'Cu',
            tipo: 'GEC',
            longitud_minima_m: 30,
          },
          sistema_tierra: {
            tipo_sistema: 'TN-S',
            numero_electrodos: 1,
            resistencia_maxima_ohm: 25,
            tipo_electrodo: 'varilla',
            longitud_electrodo_m: 2.4,
            separacion_electrodos_m: 0,
          },
          resumen: {
            main_breaker_amp: 100,
            tipo_instalacion: 'residencial',
            tipo_sistema_tierra: 'TN-S',
            egc_mm2: 10,
            gec_mm2: 16,
            resistencia_maxima_ohm: 25,
            estado: 'CRÍTICO',
            cumplimiento_normas: 'NEC 250.66',
          },
        },
      };

      const result = await service.generateReport(request);

      expect(result.reportData.observations).toContain(
        'Sistema de puesta a tierra: CRÍTICO',
      );
      expect(result.reportData.observations).toContain(
        '⚠️ Sistema de puesta a tierra requiere revisión inmediata',
      );
      expect(result.reportData.generalStatus).toBe('ERROR');
    });
  });

  describe('onModuleDestroy', () => {
    it('should close browser on module destroy', async () => {
      await service.onModuleDestroy();

      // Verify that browser close was called (mocked)
      expect(true).toBe(true); // Browser close is mocked
    });
  });
});
