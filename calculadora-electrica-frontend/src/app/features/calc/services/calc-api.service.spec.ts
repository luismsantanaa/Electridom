import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { CalcApiService, CalculationInput, Environment, Consumption, DemandResult, CircuitsResult, FeederResult, GroundingResult, FullCalculationResult } from './calc-api.service';

describe('CalcApiService', () => {
  let service: CalcApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [CalcApiService]
    });
    service = TestBed.inject(CalcApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('previewRooms', () => {
    it('should validate input data correctly', () => {
      const validInput: CalculationInput = {
        system: { voltage: 120, phases: 1, frequency: 60 },
        superficies: [
          { nombre: 'Sala', area_m2: 20 }
        ],
        consumos: [
          { nombre: 'TV', ambiente: 'Sala', potencia_w: 100, fp: 0.9, tipo: 'electrodomestico' }
        ]
      };

      service.previewRooms(validInput).subscribe();

      const req = httpMock.expectOne('/api/calc/rooms/preview');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(validInput);
      req.flush({ ambientes: [], totales: {} });
    });

    it('should handle validation errors', () => {
      const invalidInput: any = {
        superficies: [],
        consumos: []
      };

      service.previewRooms(invalidInput).subscribe({
        error: (error) => {
          expect(error.message).toContain('Datos inválidos');
        }
      });
    });

    it('should handle HTTP errors', () => {
      const input: CalculationInput = {
        superficies: [{ nombre: 'Sala', area_m2: 20 }],
        consumos: [{ nombre: 'TV', ambiente: 'Sala', potencia_w: 100 }]
      };

      service.previewRooms(input).subscribe({
        error: (error) => {
          expect(error.message).toContain('Error 500');
        }
      });

      const req = httpMock.expectOne('/api/calc/rooms/preview');
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
    });

    it('should set loading state correctly', () => {
      const input: CalculationInput = {
        superficies: [{ nombre: 'Sala', area_m2: 20 }],
        consumos: [{ nombre: 'TV', ambiente: 'Sala', potencia_w: 100 }]
      };

      expect(service.loading()).toBe(false);

      service.previewRooms(input).subscribe();

      expect(service.loading()).toBe(true);

      const req = httpMock.expectOne('/api/calc/rooms/preview');
      req.flush({ ambientes: [], totales: {} });

      // Loading should be false after response
      setTimeout(() => {
        expect(service.loading()).toBe(false);
      }, 0);
    });
  });

  describe('previewDemand', () => {
    it('should call demand endpoint correctly', () => {
      const input: CalculationInput = {
        superficies: [{ nombre: 'Sala', area_m2: 20 }],
        consumos: [{ nombre: 'TV', ambiente: 'Sala', potencia_w: 100 }]
      };

      service.previewDemand(input).subscribe();

      const req = httpMock.expectOne('/api/calc/demand/preview');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(input);
      req.flush({ ambientes: [], totales: {} });
    });
  });

  describe('previewCircuits', () => {
    it('should call circuits endpoint correctly', () => {
      const input: CalculationInput = {
        superficies: [{ nombre: 'Sala', area_m2: 20 }],
        consumos: [{ nombre: 'TV', ambiente: 'Sala', potencia_w: 100 }]
      };

      service.previewCircuits(input).subscribe();

      const req = httpMock.expectOne('/api/calc/circuits/preview');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(input);
      req.flush({ circuitos: [], totales: {} });
    });
  });

  describe('previewFeeder', () => {
    it('should call feeder endpoint correctly', () => {
      const input: CalculationInput = {
        superficies: [{ nombre: 'Sala', area_m2: 20 }],
        consumos: [{ nombre: 'TV', ambiente: 'Sala', potencia_w: 100 }]
      };

      service.previewFeeder(input).subscribe();

      const req = httpMock.expectOne('/api/calc/feeder/preview');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(input);
      req.flush({ alimentador: {}, totales: {} });
    });
  });

  describe('previewGrounding', () => {
    it('should call grounding endpoint correctly', () => {
      const input: CalculationInput = {
        superficies: [{ nombre: 'Sala', area_m2: 20 }],
        consumos: [{ nombre: 'TV', ambiente: 'Sala', potencia_w: 100 }]
      };

      service.previewGrounding(input).subscribe();

      const req = httpMock.expectOne('/api/calc/grounding/preview');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(input);
      req.flush({ puesta_tierra: {}, totales: {} });
    });
  });

  describe('executeFullCalculation', () => {
    it('should execute the complete calculation flow', () => {
      const input: CalculationInput = {
        superficies: [{ nombre: 'Sala', area_m2: 20 }],
        consumos: [{ nombre: 'TV', ambiente: 'Sala', potencia_w: 100 }]
      };

      service.executeFullCalculation(input).subscribe();

      // Should call all endpoints in sequence
      const roomsReq = httpMock.expectOne('/api/calc/rooms/preview');
      roomsReq.flush({ ambientes: [], totales: {} });

      const demandReq = httpMock.expectOne('/api/calc/demand/preview');
      demandReq.flush({ ambientes: [], totales: {} });

      const circuitsReq = httpMock.expectOne('/api/calc/circuits/preview');
      circuitsReq.flush({ circuitos: [], totales: {} });

      const feederReq = httpMock.expectOne('/api/calc/feeder/preview');
      feederReq.flush({ alimentador: {}, totales: {} });

      const groundingReq = httpMock.expectOne('/api/calc/grounding/preview');
      groundingReq.flush({ puesta_tierra: {}, totales: {} });
    });

    it('should handle errors in the calculation flow', () => {
      const input: CalculationInput = {
        superficies: [{ nombre: 'Sala', area_m2: 20 }],
        consumos: [{ nombre: 'TV', ambiente: 'Sala', potencia_w: 100 }]
      };

      service.executeFullCalculation(input).subscribe({
        error: (error) => {
          expect(error.message).toContain('Error 500');
        }
      });

      const req = httpMock.expectOne('/api/calc/rooms/preview');
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
    });
  });

  describe('utility methods', () => {
    it('should clear error correctly', () => {
      service.lastError.set('Test error');
      service.clearError();
      expect(service.lastError()).toBeNull();
    });

    it('should clear result correctly', () => {
      service.lastResult.set({ ambientes: [], totales: {} as any });
      service.clearResult();
      expect(service.lastResult()).toBeNull();
    });

    it('should clear all results correctly', () => {
      service.lastResult.set({ ambientes: [], totales: {} as any });
      service.lastDemandResult.set({ ambientes: [], totales: {} as any });
      service.lastCircuitsResult.set({ circuitos: [], totales: {} as any });
      service.lastFeederResult.set({ alimentador: {} as any, totales: {} as any });
      service.lastGroundingResult.set({ puesta_tierra: {} as any, totales: {} as any });
      service.lastFullResult.set({} as any);

      service.clearAllResults();

      expect(service.lastResult()).toBeNull();
      expect(service.lastDemandResult()).toBeNull();
      expect(service.lastCircuitsResult()).toBeNull();
      expect(service.lastFeederResult()).toBeNull();
      expect(service.lastGroundingResult()).toBeNull();
      expect(service.lastFullResult()).toBeNull();
    });
  });

  describe('validation', () => {
    it('should validate required fields', () => {
      const invalidInput: any = {
        superficies: [{ nombre: '', area_m2: 0 }],
        consumos: [{ nombre: '', ambiente: '', potencia_w: 0 }]
      };

      service.previewRooms(invalidInput).subscribe({
        error: (error) => {
          expect(error.message).toContain('Datos inválidos');
        }
      });
    });

    it('should validate minimum values', () => {
      const invalidInput: any = {
        superficies: [{ nombre: 'Sala', area_m2: 0.05 }], // Less than 0.1
        consumos: [{ nombre: 'TV', ambiente: 'Sala', potencia_w: 0 }] // Less than 1
      };

      service.previewRooms(invalidInput).subscribe({
        error: (error) => {
          expect(error.message).toContain('Datos inválidos');
        }
      });
    });

    it('should validate factor de potencia range', () => {
      const invalidInput: any = {
        superficies: [{ nombre: 'Sala', area_m2: 20 }],
        consumos: [{ nombre: 'TV', ambiente: 'Sala', potencia_w: 100, fp: 1.5 }] // Greater than 1.0
      };

      service.previewRooms(invalidInput).subscribe({
        error: (error) => {
          expect(error.message).toContain('Datos inválidos');
        }
      });
    });
  });

  describe('getReport', () => {
    it('should call report endpoint correctly for PDF', () => {
      const input: CalculationInput = {
        superficies: [{ nombre: 'Sala', area_m2: 20 }],
        consumos: [{ nombre: 'TV', ambiente: 'Sala', potencia_w: 100 }]
      };

      service.getReport(input, 'pdf').subscribe();

      const req = httpMock.expectOne('/api/calc/report?type=pdf');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(input);
      expect(req.request.responseType).toBe('blob');
      req.flush(new Blob(['test']));
    });

    it('should call report endpoint correctly for Excel', () => {
      const input: CalculationInput = {
        superficies: [{ nombre: 'Sala', area_m2: 20 }],
        consumos: [{ nombre: 'TV', ambiente: 'Sala', potencia_w: 100 }]
      };

      service.getReport(input, 'xlsx').subscribe();

      const req = httpMock.expectOne('/api/calc/report?type=xlsx');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(input);
      expect(req.request.responseType).toBe('blob');
      req.flush(new Blob(['test']));
    });

    it('should validate input before calling report endpoint', () => {
      const invalidInput: any = {
        superficies: [],
        consumos: []
      };

      service.getReport(invalidInput, 'pdf').subscribe({
        error: (error) => {
          expect(error.message).toContain('Datos inválidos');
        }
      });
    });

    it('should handle errors in report generation', () => {
      const input: CalculationInput = {
        superficies: [{ nombre: 'Sala', area_m2: 20 }],
        consumos: [{ nombre: 'TV', ambiente: 'Sala', potencia_w: 100 }]
      };

      service.getReport(input, 'pdf').subscribe({
        error: (error) => {
          expect(error.message).toContain('Error 500');
        }
      });

      const req = httpMock.expectOne('/api/calc/report?type=pdf');
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
    });
  });

  describe('utility methods for reports', () => {
    it('should generate correct filename for basic calculation', () => {
      const filename = service.generateReportFilename('pdf', 'basic');
      expect(filename).toMatch(/calculadora_electrica_basico_\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}\.pdf/);
    });

    it('should generate correct filename for full calculation', () => {
      const filename = service.generateReportFilename('xlsx', 'full');
      expect(filename).toMatch(/calculadora_electrica_completo_\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}\.xlsx/);
    });

    it('should generate filename with default calculation type', () => {
      const filename = service.generateReportFilename('pdf');
      expect(filename).toMatch(/calculadora_electrica_basico_\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}\.pdf/);
    });

    it('should download report correctly', () => {
      const blob = new Blob(['test content'], { type: 'application/pdf' });
      const filename = 'test.pdf';
      
      // Mock document methods
      const mockLink = {
        href: '',
        download: '',
        click: jasmine.createSpy('click')
      };
      
      spyOn(document, 'createElement').and.returnValue(mockLink as any);
      spyOn(document.body, 'appendChild');
      spyOn(document.body, 'removeChild');
      spyOn(window.URL, 'createObjectURL').and.returnValue('blob:test');
      spyOn(window.URL, 'revokeObjectURL');

      service.downloadReport(blob, filename);

      expect(window.URL.createObjectURL).toHaveBeenCalledWith(blob);
      expect(mockLink.download).toBe(filename);
      expect(mockLink.click).toHaveBeenCalled();
      expect(document.body.appendChild).toHaveBeenCalledWith(mockLink);
      expect(document.body.removeChild).toHaveBeenCalledWith(mockLink);
      expect(window.URL.revokeObjectURL).toHaveBeenCalledWith('blob:test');
    });
  });
});
