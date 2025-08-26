import { Component, input, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CalcApiService, CalculationInput, CalculationResult, FullCalculationResult } from '../../services/calc-api.service';

@Component({
  selector: 'app-report-download',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="card">
      <div class="card-header">
        <h5 class="card-title mb-0">
          <i class="fas fa-file-download me-2"></i>
          Descarga de Reportes
        </h5>
      </div>
      <div class="card-body">
        <!-- Vista Previa de Datos Clave -->
        <div class="row mb-4" *ngIf="hasData()">
          <div class="col-12">
            <div class="card bg-light">
              <div class="card-header">
                <h6 class="card-title mb-0">
                  <i class="fas fa-eye me-2"></i>
                  Vista Previa - Datos Clave
                </h6>
              </div>
              <div class="card-body">
                <div class="row">
                  <div class="col-md-3">
                    <div class="text-center">
                      <h5 class="text-primary mb-1">{{ getTotalLoads() | number:'1.0-0' }}</h5>
                      <small class="text-muted">Carga Total (VA)</small>
                    </div>
                  </div>
                  <div class="col-md-3">
                    <div class="text-center">
                      <h5 class="text-success mb-1">{{ getTotalCurrent() | number:'1.2-2' }}</h5>
                      <small class="text-muted">Corriente Total (A)</small>
                    </div>
                  </div>
                  <div class="col-md-3">
                    <div class="text-center">
                      <h5 class="text-info mb-1">{{ getTotalEnvironments() }}</h5>
                      <small class="text-muted">Total Ambientes</small>
                    </div>
                  </div>
                  <div class="col-md-3">
                    <div class="text-center">
                      <h5 class="text-warning mb-1">{{ getCalculationType() }}</h5>
                      <small class="text-muted">Tipo de Cálculo</small>
                    </div>
                  </div>
                </div>
                
                <!-- Información adicional para cálculo completo -->
                <div class="row mt-3" *ngIf="isFullCalculation()">
                  <div class="col-12">
                    <div class="alert alert-info mb-0">
                      <div class="row">
                        <div class="col-md-4">
                          <strong>Circuitos:</strong> {{ getTotalCircuits() }}
                        </div>
                        <div class="col-md-4">
                          <strong>Potencia:</strong> {{ getTotalPower() | number:'1.2-2' }} kW
                        </div>
                        <div class="col-md-4">
                          <strong>Resistencia:</strong> {{ getGroundingResistance() | number:'1.2-2' }} Ω
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Botones de Descarga -->
        <div class="row">
          <div class="col-md-6 mb-3">
            <div class="card h-100">
              <div class="card-body text-center">
                <i class="fas fa-file-pdf fa-3x text-danger mb-3"></i>
                <h6 class="card-title">Reporte PDF</h6>
                <p class="card-text text-muted">
                  Documento completo con todos los cálculos y especificaciones técnicas
                </p>
                <button 
                  type="button" 
                  class="btn btn-danger w-100"
                  (click)="downloadPDF()"
                  [disabled]="!hasData() || apiService.loading()"
                >
                  <i class="fas fa-download me-2" *ngIf="!isDownloadingPDF()"></i>
                  <i class="fas fa-spinner fa-spin me-2" *ngIf="isDownloadingPDF()"></i>
                  {{ isDownloadingPDF() ? 'Generando PDF...' : 'Descargar PDF' }}
                </button>
              </div>
            </div>
          </div>
          
          <div class="col-md-6 mb-3">
            <div class="card h-100">
              <div class="card-body text-center">
                <i class="fas fa-file-excel fa-3x text-success mb-3"></i>
                <h6 class="card-title">Reporte Excel</h6>
                <p class="card-text text-muted">
                  Hoja de cálculo con datos tabulados y fórmulas de cálculo
                </p>
                <button 
                  type="button" 
                  class="btn btn-success w-100"
                  (click)="downloadExcel()"
                  [disabled]="!hasData() || apiService.loading()"
                >
                  <i class="fas fa-download me-2" *ngIf="!isDownloadingExcel()"></i>
                  <i class="fas fa-spinner fa-spin me-2" *ngIf="isDownloadingExcel()"></i>
                  {{ isDownloadingExcel() ? 'Generando Excel...' : 'Descargar Excel' }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Información del Reporte -->
        <div class="row" *ngIf="hasData()">
          <div class="col-12">
            <div class="alert alert-info">
              <h6 class="alert-heading">
                <i class="fas fa-info-circle me-2"></i>
                Información del Reporte
              </h6>
              <ul class="mb-0">
                <li><strong>Fecha de generación:</strong> {{ getCurrentDate() }}</li>
                <li><strong>Tipo de cálculo:</strong> {{ getCalculationType() }}</li>
                <li><strong>Ambientes incluidos:</strong> {{ getTotalEnvironments() }}</li>
                <li><strong>Consumos incluidos:</strong> {{ getTotalConsumptions() }}</li>
                <li *ngIf="isFullCalculation()"><strong>Circuitos derivados:</strong> {{ getTotalCircuits() }}</li>
                <li *ngIf="isFullCalculation()"><strong>Especificaciones técnicas:</strong> Alimentador y puesta a tierra</li>
              </ul>
            </div>
          </div>
        </div>

        <!-- Estado sin datos -->
        <div class="row" *ngIf="!hasData()">
          <div class="col-12">
            <div class="alert alert-warning text-center">
              <i class="fas fa-exclamation-triangle fa-2x mb-3"></i>
              <h6>Sin datos para generar reporte</h6>
              <p class="mb-0">
                Ejecuta un cálculo primero para poder generar y descargar reportes
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .card {
      transition: all 0.3s ease;
    }
    .card:hover {
      box-shadow: 0 4px 8px rgba(0,0,0,0.1);
    }
    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    .fa-3x {
      font-size: 3rem;
    }
    .alert ul {
      list-style: none;
      padding-left: 0;
    }
    .alert li {
      margin-bottom: 0.5rem;
    }
  `]
})
export class ReportDownloadComponent {
  // Inyección del servicio
  apiService = inject(CalcApiService);

  // Input signals
  basicData = input<CalculationResult | null>(null);
  fullData = input<FullCalculationResult | null>(null);
  calculationInput = input<CalculationInput | null>(null);

  // Signals para estados de descarga
  downloadingPDF = signal(false);
  downloadingExcel = signal(false);

  // Computed properties
  hasData = computed(() => this.basicData() !== null || this.fullData() !== null);
  
  isDownloadingPDF = computed(() => this.downloadingPDF());
  isDownloadingExcel = computed(() => this.downloadingExcel());
  
  isFullCalculation = computed(() => this.fullData() !== null);

  // Métodos para obtener datos de vista previa
  getTotalLoads(): number {
    if (this.fullData()) {
      return this.fullData()!.roomsResult.totales.carga_total_va;
    }
    if (this.basicData()) {
      return this.basicData()!.totales.carga_total_va;
    }
    return 0;
  }

  getTotalCurrent(): number {
    if (this.fullData()) {
      return this.fullData()!.feederResult.alimentador.corriente_total_a;
    }
    if (this.basicData()) {
      return this.basicData()!.totales.corriente_total_a;
    }
    return 0;
  }

  getTotalEnvironments(): number {
    if (this.fullData()) {
      return this.fullData()!.roomsResult.ambientes.length;
    }
    if (this.basicData()) {
      return this.basicData()!.ambientes.length;
    }
    return 0;
  }

  getCalculationType(): string {
    return this.isFullCalculation() ? 'Completo (CE-01→CE-05)' : 'Básico (CE-01)';
  }

  getTotalCircuits(): number {
    if (this.fullData()) {
      return this.fullData()!.circuitsResult.totales.total_circuitos;
    }
    return 0;
  }

  getTotalPower(): number {
    if (this.fullData()) {
      return this.fullData()!.feederResult.totales.potencia_diversificada_kw;
    }
    return 0;
  }

  getGroundingResistance(): number {
    if (this.fullData()) {
      return this.fullData()!.groundingResult.puesta_tierra.resistencia_maxima;
    }
    return 0;
  }

  getTotalConsumptions(): number {
    return this.calculationInput()?.consumos.length || 0;
  }

  getCurrentDate(): string {
    return new Date().toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Métodos de descarga
  downloadPDF(): void {
    if (!this.hasData() || !this.calculationInput()) return;

    this.downloadingPDF.set(true);
    
    this.apiService.getReport(this.calculationInput()!, 'pdf').subscribe({
      next: (blob: Blob) => {
        const filename = this.apiService.generateReportFilename('pdf', this.isFullCalculation() ? 'full' : 'basic');
        this.apiService.downloadReport(blob, filename);
        this.downloadingPDF.set(false);
      },
      error: (error) => {
        console.error('Error al generar PDF:', error);
        this.downloadingPDF.set(false);
      }
    });
  }

  downloadExcel(): void {
    if (!this.hasData() || !this.calculationInput()) return;

    this.downloadingExcel.set(true);
    
    this.apiService.getReport(this.calculationInput()!, 'xlsx').subscribe({
      next: (blob: Blob) => {
        const filename = this.apiService.generateReportFilename('xlsx', this.isFullCalculation() ? 'full' : 'basic');
        this.apiService.downloadReport(blob, filename);
        this.downloadingExcel.set(false);
      },
      error: (error) => {
        console.error('Error al generar Excel:', error);
        this.downloadingExcel.set(false);
      }
    });
  }
}
