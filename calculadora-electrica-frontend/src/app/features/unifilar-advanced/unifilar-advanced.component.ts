import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { 
  UnifilarAdvancedService, 
  UnifilarAdvancedExport, 
  ExportOptions, 
  PhaseBalance, 
  ValidationResult 
} from './unifilar-advanced.service';

@Component({
  selector: 'app-unifilar-advanced',
  templateUrl: './unifilar-advanced.component.html',
  styleUrls: ['./unifilar-advanced.component.scss']
})
export class UnifilarAdvancedComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Formularios
  exportForm: FormGroup;
  projectForm: FormGroup;

  // Estados
  loading = false;
  error: string | null = null;
  showPreview = false;
  showResults = false;
  activeTab: 'preview' | 'export' | 'validation' = 'preview';

  // Datos
  unifilarData: UnifilarAdvancedExport | null = null;
  phaseBalance: PhaseBalance | null = null;
  validationResult: ValidationResult | null = null;
  phaseBalanceStats: any = null;

  // Opciones de exportación
  exportFormats = [
    { value: 'json', label: 'JSON', icon: 'fas fa-code' },
    { value: 'pdf', label: 'PDF', icon: 'fas fa-file-pdf' }
  ];

  pageSizes = [
    { value: 'A3', label: 'A3 (297 x 420 mm)' },
    { value: 'A4', label: 'A4 (210 x 297 mm)' },
    { value: 'Letter', label: 'Letter (8.5 x 11 in)' }
  ];

  orientations = [
    { value: 'vertical', label: 'Vertical', icon: 'fas fa-arrows-alt-v' },
    { value: 'horizontal', label: 'Horizontal', icon: 'fas fa-arrows-alt-h' }
  ];

  symbolStandards = [
    { value: 'IEC', label: 'IEC 60617', icon: 'fas fa-globe-europe' },
    { value: 'UNE', label: 'UNE-EN 60617', icon: 'fas fa-flag' },
    { value: 'NEMA', label: 'NEMA Y32.2', icon: 'fas fa-flag-usa' }
  ];

  constructor(
    private formBuilder: FormBuilder,
    private unifilarService: UnifilarAdvancedService
  ) {
    this.exportForm = this.formBuilder.group({
      format: ['json', Validators.required],
      pageSize: ['A3', Validators.required],
      orientation: ['vertical', Validators.required],
      includeMetadata: [true],
      includeSymbols: [true],
      symbolStandard: ['IEC', Validators.required]
    });

    this.projectForm = this.formBuilder.group({
      projectId: ['', [Validators.required, Validators.min(1)]]
    });
  }

  ngOnInit(): void {
    this.subscribeToService();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private subscribeToService(): void {
    this.unifilarService.loading$.pipe(takeUntil(this.destroy$)).subscribe(loading => {
      this.loading = loading;
    });

    this.unifilarService.error$.pipe(takeUntil(this.destroy$)).subscribe(error => {
      this.error = error;
    });

    this.unifilarService.lastExport$.pipe(takeUntil(this.destroy$)).subscribe(exportData => {
      this.unifilarData = exportData;
      if (exportData) {
        this.showResults = true;
        this.activeTab = 'preview';
        this.calculatePhaseBalanceStats();
      }
    });
  }

  /**
   * Genera la vista previa del unifilar
   */
  generatePreview(): void {
    if (this.projectForm.invalid) {
      this.error = 'Por favor, ingrese un ID de proyecto válido';
      return;
    }

    const projectId = this.projectForm.value.projectId;
    const options: ExportOptions = {
      format: 'json',
      includeMetadata: true,
      includeSymbols: true
    };

    this.unifilarService.exportAdvancedUnifilar(projectId, options).subscribe({
      next: (response: UnifilarAdvancedExport) => {
        this.unifilarData = response;
        this.showPreview = true;
        this.activeTab = 'preview';
        this.calculatePhaseBalanceStats();
        this.loadPhaseBalance(projectId);
        this.validateUnifilar(projectId);
      },
      error: (error) => {
        console.error('Error generando vista previa:', error);
      }
    });
  }

  /**
   * Exporta el unifilar
   */
  exportUnifilar(): void {
    if (this.projectForm.invalid || this.exportForm.invalid) {
      this.error = 'Por favor, complete todos los campos requeridos';
      return;
    }

    const projectId = this.projectForm.value.projectId;
    const options: ExportOptions = {
      format: this.exportForm.value.format,
      includeMetadata: this.exportForm.value.includeMetadata,
      includeSymbols: this.exportForm.value.includeSymbols,
      pageSize: this.exportForm.value.pageSize,
      orientation: this.exportForm.value.orientation
    };

    this.unifilarService.exportAdvancedUnifilar(projectId, options).subscribe({
      next: (response: any) => {
        if (options.format === 'pdf') {
          this.unifilarService.downloadPDF(response, projectId);
        } else {
          this.unifilarService.downloadJSON(response, projectId);
        }
      },
      error: (error) => {
        console.error('Error en exportación:', error);
      }
    });
  }

  /**
   * Carga el balance de fases
   */
  private loadPhaseBalance(projectId: number): void {
    this.unifilarService.getPhaseBalance(projectId).subscribe({
      next: (response) => {
        this.phaseBalance = response;
      },
      error: (error) => {
        console.error('Error cargando balance de fases:', error);
      }
    });
  }

  /**
   * Valida el unifilar
   */
  private validateUnifilar(projectId: number): void {
    this.unifilarService.validateAdvancedUnifilar(projectId).subscribe({
      next: (response) => {
        this.validationResult = response;
      },
      error: (error) => {
        console.error('Error validando unifilar:', error);
      }
    });
  }

  /**
   * Calcula estadísticas del balance de fases
   */
  private calculatePhaseBalanceStats(): void {
    if (this.unifilarData?.phaseBalance) {
      this.phaseBalanceStats = this.unifilarService.calculatePhaseBalanceStats(
        this.unifilarData.phaseBalance
      );
    }
  }

  /**
   * Cambia la pestaña activa
   */
  setActiveTab(tab: 'preview' | 'export' | 'validation'): void {
    this.activeTab = tab;
  }

  /**
   * Limpia el error
   */
  clearError(): void {
    this.error = null;
  }

  /**
   * Limpia los formularios
   */
  clearForms(): void {
    this.projectForm.reset();
    this.exportForm.reset();
    this.unifilarService.clearLastExport();
    this.showPreview = false;
    this.showResults = false;
    this.activeTab = 'preview';
    this.unifilarData = null;
    this.phaseBalance = null;
    this.validationResult = null;
    this.phaseBalanceStats = null;
  }

  /**
   * Obtiene el color del estado del balance
   */
  getPhaseBalanceColor(status: string): string {
    return this.unifilarService.getPhaseBalanceColor(status as any);
  }

  /**
   * Obtiene el icono del estado del balance
   */
  getPhaseBalanceIcon(status: string): string {
    switch (status) {
      case 'balanced':
        return 'fas fa-check-circle';
      case 'warning':
        return 'fas fa-exclamation-triangle';
      case 'critical':
        return 'fas fa-times-circle';
      default:
        return 'fas fa-question-circle';
    }
  }

  /**
   * Obtiene circuitos por fase
   */
  getCircuitsByPhase(phase: string): any[] {
    if (!this.unifilarData?.panels) return [];
    
    const allCircuits: any[] = [];
    this.unifilarData.panels.forEach(panel => {
      panel.circuits.forEach(circuit => {
        if (circuit.phase === phase) {
          allCircuits.push({ ...circuit, panelName: panel.name });
        }
      });
    });
    
    return allCircuits;
  }

  /**
   * Obtiene el total de circuitos por fase
   */
  getTotalCircuitsByPhase(phase: string): number {
    return this.getCircuitsByPhase(phase).length;
  }

  /**
   * Obtiene la carga total por fase
   */
  getTotalLoadByPhase(phase: string): number {
    return this.getCircuitsByPhase(phase).reduce((sum, circuit) => sum + circuit.loadVA, 0);
  }

  /**
   * Track by functions para ngFor
   */
  trackByCircuit(index: number, circuit: any): number {
    return circuit.id;
  }

  trackByPanel(index: number, panel: any): number {
    return panel.id;
  }
}
