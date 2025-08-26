import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ReportDownloadComponent } from './report-download.component';
import { CalcApiService } from '../../services/calc-api.service';
import { CalculationResult, FullCalculationResult, CalculationInput } from '../../services/calc-api.service';

describe('ReportDownloadComponent', () => {
  let component: ReportDownloadComponent;
  let fixture: ComponentFixture<ReportDownloadComponent>;
  let apiService: CalcApiService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReportDownloadComponent, HttpClientTestingModule],
      providers: [CalcApiService]
    }).compileComponents();

    fixture = TestBed.createComponent(ReportDownloadComponent);
    component = fixture.componentInstance;
    apiService = TestBed.inject(CalcApiService);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show warning when no data is available', () => {
    fixture.detectChanges();
    
    const warningElement = fixture.nativeElement.querySelector('.alert-warning');
    expect(warningElement).toBeTruthy();
    expect(warningElement.textContent).toContain('Sin datos para generar reporte');
  });

  it('should show download buttons when basic data is available', () => {
    const mockBasicData: CalculationResult = {
      ambientes: [{ nombre: 'Sala', area_m2: 20, carga_va: 1000, fp: 0.9 }],
      totales: { carga_total_va: 1000, carga_diversificada_va: 800, corriente_total_a: 8.33, tension_v: 120, phases: 1 }
    };

    component.basicData.set(mockBasicData);
    fixture.detectChanges();

    const pdfButton = fixture.nativeElement.querySelector('.btn-danger');
    const excelButton = fixture.nativeElement.querySelector('.btn-success');
    
    expect(pdfButton).toBeTruthy();
    expect(excelButton).toBeTruthy();
    expect(pdfButton.textContent).toContain('Descargar PDF');
    expect(excelButton.textContent).toContain('Descargar Excel');
  });

  it('should show preview data correctly', () => {
    const mockBasicData: CalculationResult = {
      ambientes: [{ nombre: 'Sala', area_m2: 20, carga_va: 1000, fp: 0.9 }],
      totales: { carga_total_va: 1000, carga_diversificada_va: 800, corriente_total_a: 8.33, tension_v: 120, phases: 1 }
    };

    component.basicData.set(mockBasicData);
    fixture.detectChanges();

    const cargaElement = fixture.nativeElement.querySelector('.text-primary');
    const corrienteElement = fixture.nativeElement.querySelector('.text-success');
    
    expect(cargaElement.textContent).toContain('1,000');
    expect(corrienteElement.textContent).toContain('8.33');
  });

  it('should show full calculation type when full data is available', () => {
    const mockFullData: FullCalculationResult = {
      roomsResult: {
        ambientes: [{ nombre: 'Sala', area_m2: 20, carga_va: 1000, fp: 0.9 }],
        totales: { carga_total_va: 1000, carga_diversificada_va: 800, corriente_total_a: 8.33, tension_v: 120, phases: 1 }
      },
      demandResult: {
        ambientes: [{ nombre: 'Sala', factor_demanda: 0.8, carga_diversificada_va: 800 }],
        totales: { carga_total_va: 1000, carga_diversificada_va: 800, factor_demanda_promedio: 0.8 }
      },
      circuitsResult: {
        circuitos: [{ nombre: 'C1', ambiente: 'Sala', carga_va: 1000, corriente_a: 8.33, conductor: '12 AWG', proteccion: '15A' }],
        totales: { total_circuitos: 1, carga_total_va: 1000, corriente_total_a: 8.33 }
      },
      feederResult: {
        alimentador: { carga_total_va: 1000, corriente_total_a: 8.33, conductor: '10 AWG', proteccion: '20A', caida_tension: 2.5 },
        totales: { potencia_instalada_kw: 1.0, potencia_diversificada_kw: 0.8, factor_demanda: 0.8 }
      },
      groundingResult: {
        puesta_tierra: { resistencia_maxima: 25, conductor: '6 AWG', electrodo: 'Varilla', longitud: 2.4 },
        totales: { corriente_falla: 100, tension_tierra: 50 }
      }
    };

    component.fullData.set(mockFullData);
    fixture.detectChanges();

    const tipoElement = fixture.nativeElement.querySelector('.text-warning');
    expect(tipoElement.textContent).toContain('Completo (CE-01→CE-05)');
  });

  it('should call download methods when buttons are clicked', () => {
    const mockBasicData: CalculationResult = {
      ambientes: [{ nombre: 'Sala', area_m2: 20, carga_va: 1000, fp: 0.9 }],
      totales: { carga_total_va: 1000, carga_diversificada_va: 800, corriente_total_a: 8.33, tension_v: 120, phases: 1 }
    };

    const mockInput: CalculationInput = {
      superficies: [{ nombre: 'Sala', area_m2: 20 }],
      consumos: [{ nombre: 'TV', ambiente: 'Sala', potencia_w: 100 }]
    };

    component.basicData.set(mockBasicData);
    component.calculationInput.set(mockInput);

    spyOn(component, 'downloadPDF');
    spyOn(component, 'downloadExcel');

    fixture.detectChanges();

    const pdfButton = fixture.nativeElement.querySelector('.btn-danger');
    const excelButton = fixture.nativeElement.querySelector('.btn-success');

    pdfButton.click();
    excelButton.click();

    expect(component.downloadPDF).toHaveBeenCalled();
    expect(component.downloadExcel).toHaveBeenCalled();
  });

  it('should disable buttons when loading', () => {
    const mockBasicData: CalculationResult = {
      ambientes: [{ nombre: 'Sala', area_m2: 20, carga_va: 1000, fp: 0.9 }],
      totales: { carga_total_va: 1000, carga_diversificada_va: 800, corriente_total_a: 8.33, tension_v: 120, phases: 1 }
    };

    component.basicData.set(mockBasicData);
    apiService.loading.set(true);
    
    fixture.detectChanges();

    const buttons = fixture.nativeElement.querySelectorAll('button[disabled]');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('should show loading state when downloading PDF', () => {
    const mockBasicData: CalculationResult = {
      ambientes: [{ nombre: 'Sala', area_m2: 20, carga_va: 1000, fp: 0.9 }],
      totales: { carga_total_va: 1000, carga_diversificada_va: 800, corriente_total_a: 8.33, tension_v: 120, phases: 1 }
    };

    component.basicData.set(mockBasicData);
    component.downloadingPDF.set(true);
    
    fixture.detectChanges();

    const pdfButton = fixture.nativeElement.querySelector('.btn-danger');
    expect(pdfButton.textContent).toContain('Generando PDF...');
  });

  it('should show loading state when downloading Excel', () => {
    const mockBasicData: CalculationResult = {
      ambientes: [{ nombre: 'Sala', area_m2: 20, carga_va: 1000, fp: 0.9 }],
      totales: { carga_total_va: 1000, carga_diversificada_va: 800, corriente_total_a: 8.33, tension_v: 120, phases: 1 }
    };

    component.basicData.set(mockBasicData);
    component.downloadingExcel.set(true);
    
    fixture.detectChanges();

    const excelButton = fixture.nativeElement.querySelector('.btn-success');
    expect(excelButton.textContent).toContain('Generando Excel...');
  });

  it('should generate correct filename', () => {
    const filename = apiService.generateReportFilename('pdf', 'basic');
    expect(filename).toMatch(/calculadora_electrica_basico_\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}\.pdf/);
  });

  it('should show additional info for full calculation', () => {
    const mockFullData: FullCalculationResult = {
      roomsResult: {
        ambientes: [{ nombre: 'Sala', area_m2: 20, carga_va: 1000, fp: 0.9 }],
        totales: { carga_total_va: 1000, carga_diversificada_va: 800, corriente_total_a: 8.33, tension_v: 120, phases: 1 }
      },
      demandResult: {
        ambientes: [{ nombre: 'Sala', factor_demanda: 0.8, carga_diversificada_va: 800 }],
        totales: { carga_total_va: 1000, carga_diversificada_va: 800, factor_demanda_promedio: 0.8 }
      },
      circuitsResult: {
        circuitos: [{ nombre: 'C1', ambiente: 'Sala', carga_va: 1000, corriente_a: 8.33, conductor: '12 AWG', proteccion: '15A' }],
        totales: { total_circuitos: 1, carga_total_va: 1000, corriente_total_a: 8.33 }
      },
      feederResult: {
        alimentador: { carga_total_va: 1000, corriente_total_a: 8.33, conductor: '10 AWG', proteccion: '20A', caida_tension: 2.5 },
        totales: { potencia_instalada_kw: 1.0, potencia_diversificada_kw: 0.8, factor_demanda: 0.8 }
      },
      groundingResult: {
        puesta_tierra: { resistencia_maxima: 25, conductor: '6 AWG', electrodo: 'Varilla', longitud: 2.4 },
        totales: { corriente_falla: 100, tension_tierra: 50 }
      }
    };

    component.fullData.set(mockFullData);
    fixture.detectChanges();

    const additionalInfo = fixture.nativeElement.querySelector('.alert-info');
    expect(additionalInfo).toBeTruthy();
    expect(additionalInfo.textContent).toContain('Circuitos:');
    expect(additionalInfo.textContent).toContain('Potencia:');
    expect(additionalInfo.textContent).toContain('Resistencia:');
  });
});
