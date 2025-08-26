import { Component, signal, computed, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RoomsFormComponent } from '../components/rooms-form/rooms-form.component';
import { LoadsFormComponent } from '../components/loads-form/loads-form.component';
import { ResultsViewComponent } from '../components/results-view/results-view.component';
import { AiPanelComponent } from '../../ai/components/ai-panel/ai-panel.component';
import { ExcelUploadComponent } from '../../ai/components/excel-upload/excel-upload.component';
import { CalcApiService, Environment, Consumption, CalculationInput, CalculationResult, FullCalculationResult } from '../services/calc-api.service';

@Component({
  selector: 'app-calc-page',
  standalone: true,
  imports: [CommonModule, RoomsFormComponent, LoadsFormComponent, ResultsViewComponent, AiPanelComponent, ExcelUploadComponent],
  template: `
    <div class="container-fluid">
      <!-- Header -->
      <div class="row">
        <div class="col-12">
          <div class="page-title">
            <div class="row align-items-center">
              <div class="col-xl-4">
                <div class="page-title-content">
                  <h3>Calculadora Eléctrica RD</h3>
                  <p class="mb-2">Cálculo de cargas eléctricas residenciales, comerciales e industriales</p>
                </div>
              </div>
              <div class="col-xl-8">
                <div class="d-flex justify-content-end">
                  <div class="alert alert-info mb-0" *ngIf="apiService.loading()">
                    <i class="fas fa-spinner fa-spin me-2"></i>
                    {{ loadingMessage() }}
                  </div>
                  <div class="alert alert-danger mb-0" *ngIf="apiService.lastError()">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    {{ apiService.lastError() }}
                    <button 
                      type="button" 
                      class="btn-close ms-2" 
                      (click)="apiService.clearError()"
                    ></button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Contenido Principal -->
      <div class="row">
        <!-- Formularios -->
        <div class="col-xl-8" *ngIf="!showResults()">
          <div class="row">
            <!-- Formulario de Ambientes -->
            <div class="col-12 mb-4">
              <app-rooms-form 
                #roomsForm
                (roomsDataChange)="onRoomsDataChange($event)"
              />
            </div>

            <!-- Formulario de Consumos -->
            <div class="col-12 mb-4" *ngIf="roomsData()">
              <app-loads-form 
                #loadsForm
                [environments]="roomsData()?.superficies || []"
                (loadsDataChange)="onLoadsDataChange($event)"
              />
            </div>
          </div>
        </div>

        <!-- Resultados -->
        <div class="col-xl-12" *ngIf="showResults()">
          <app-results-view 
            [data]="apiService.lastResult()"
            [fullData]="apiService.lastFullResult()"
            [calculationInput]="getCurrentCalculationInput()"
          />
        </div>

        <!-- Panel Lateral -->
        <div class="col-xl-4" *ngIf="!showResults()">
          <div class="row">
            <!-- Resumen de Datos -->
            <div class="col-12 mb-4">
              <div class="card">
                <div class="card-header">
                  <h5 class="card-title mb-0">
                    <i class="fas fa-info-circle me-2"></i>
                    Resumen de Datos
                  </h5>
                </div>
                <div class="card-body">
                  <div class="mb-3">
                    <h6>Configuración del Sistema</h6>
                    <div *ngIf="roomsData()?.system; else noSystem">
                      <p class="mb-1">
                        <strong>Tensión:</strong> {{ roomsData()?.system.voltage }}V
                      </p>
                      <p class="mb-1">
                        <strong>Fases:</strong> {{ roomsData()?.system.phases === 1 ? 'Monofásico' : 'Trifásico' }}
                      </p>
                      <p class="mb-0">
                        <strong>Frecuencia:</strong> {{ roomsData()?.system.frequency }}Hz
                      </p>
                    </div>
                    <ng-template #noSystem>
                      <p class="text-muted mb-0">No configurado</p>
                    </ng-template>
                  </div>

                  <div class="mb-3">
                    <h6>Ambientes</h6>
                    <div *ngIf="roomsData()?.superficies?.length; else noRooms">
                      <p class="mb-1">
                        <strong>Total:</strong> {{ roomsData()?.superficies.length }} ambientes
                      </p>
                      <p class="mb-0">
                        <strong>Área total:</strong> {{ totalArea() | number:'1.2-2' }} m²
                      </p>
                    </div>
                    <ng-template #noRooms>
                      <p class="text-muted mb-0">No hay ambientes definidos</p>
                    </ng-template>
                  </div>

                  <div class="mb-3">
                    <h6>Consumos</h6>
                    <div *ngIf="loadsData()?.length; else noLoads">
                      <p class="mb-1">
                        <strong>Total:</strong> {{ loadsData()?.length }} consumos
                      </p>
                      <p class="mb-0">
                        <strong>Potencia total:</strong> {{ totalPower() | number:'1.0-0' }} W
                      </p>
                    </div>
                    <ng-template #noLoads>
                      <p class="text-muted mb-0">No hay consumos definidos</p>
                    </ng-template>
                  </div>
                </div>
              </div>
            </div>

            <!-- Botones de Cálculo -->
            <div class="col-12">
              <div class="card">
                <div class="card-body">
                  <div class="mb-3">
                    <button 
                      type="button" 
                      class="btn btn-primary w-100"
                      (click)="executeCalculation()"
                      [disabled]="!canCalculate() || apiService.loading()"
                    >
                      <i class="fas fa-calculator me-2"></i>
                      Cálculo Básico (CE-01)
                    </button>
                  </div>
                  
                  <div class="mb-3">
                    <button 
                      type="button" 
                      class="btn btn-success w-100"
                      (click)="executeFullCalculation()"
                      [disabled]="!canCalculate() || apiService.loading()"
                    >
                      <i class="fas fa-rocket me-2"></i>
                      Cálculo Completo (CE-01→CE-05)
                    </button>
                    <small class="text-muted d-block mt-1">
                      Incluye: Ambientes, Demanda, Circuitos, Alimentador y Puesta a Tierra
                    </small>
                  </div>
                  
                  <button 
                    type="button" 
                    class="btn btn-outline-secondary w-100"
                    (click)="resetCalculation()"
                    [disabled]="apiService.loading()"
                  >
                    <i class="fas fa-redo me-2"></i>
                    Reiniciar
                  </button>
                </div>
              </div>
            </div>

            <!-- Panel de IA -->
            <div class="col-12 mb-4" *ngIf="showResults()">
              <app-ai-panel 
                [inputData]="getCurrentCalculationInput()"
                [outputData]="apiService.lastFullResult() || apiService.lastResult()"
              />
            </div>

            <!-- Upload de Excel -->
            <div class="col-12 mb-4" *ngIf="!showResults()">
              <app-excel-upload 
                (dataLoaded)="onExcelDataLoaded($event)"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-title {
      margin-bottom: 30px;
    }
    .card {
      margin-bottom: 20px;
    }
    .alert {
      border-radius: 8px;
    }
    .btn-close {
      font-size: 0.8rem;
    }
  `]
})
export class CalcPage {
  // Inyección del servicio
  apiService = inject(CalcApiService);

  // Signals para estado local
  roomsData = signal<{
    system: { voltage: number; phases: number; frequency: number };
    superficies: Environment[];
  } | null>(null);

  loadsData = signal<Consumption[] | null>(null);

  // Computed properties
  showResults = computed(() => 
    this.apiService.lastResult() !== null || this.apiService.lastFullResult() !== null
  );
  
  totalArea = computed(() => {
    const superficies = this.roomsData()?.superficies;
    if (!superficies) return 0;
    return superficies.reduce((total, superficie) => total + superficie.area_m2, 0);
  });

  totalPower = computed(() => {
    const consumos = this.loadsData();
    if (!consumos) return 0;
    return consumos.reduce((total, consumo) => total + consumo.potencia_w, 0);
  });

  canCalculate = computed(() => {
    return this.roomsData() !== null && 
           this.loadsData() !== null && 
           this.roomsData()!.superficies.length > 0 && 
           this.loadsData()!.length > 0;
  });

  loadingMessage = computed(() => {
    if (this.apiService.lastFullResult()) {
      return 'Procesando cálculo completo...';
    }
    return 'Procesando cálculo...';
  });

  constructor() {
    // Effect para limpiar resultados cuando se reinicia
    effect(() => {
      if (!this.roomsData() && !this.loadsData()) {
        this.apiService.clearAllResults();
      }
    });
  }

  // Métodos de manejo de datos
  onRoomsDataChange(data: any): void {
    this.roomsData.set(data);
    // Limpiar consumos cuando cambian los ambientes
    this.loadsData.set(null);
  }

  onLoadsDataChange(data: any): void {
    if (Array.isArray(data)) {
      this.loadsData.set(data);
    }
  }

  // Métodos de acción
  executeCalculation(): void {
    if (!this.canCalculate()) return;

    const calculationInput: CalculationInput = {
      system: {
        ...this.roomsData()!.system,
        phases: this.roomsData()!.system.phases as 1 | 3
      },
      superficies: this.roomsData()!.superficies,
      consumos: this.loadsData()!
    };

    this.apiService.previewRooms(calculationInput).subscribe({
      next: (result: CalculationResult) => {
        console.log('Cálculo básico exitoso:', result);
      },
      error: (error) => {
        console.error('Error en el cálculo básico:', error);
      }
    });
  }

  executeFullCalculation(): void {
    if (!this.canCalculate()) return;

    const calculationInput: CalculationInput = {
      system: {
        ...this.roomsData()!.system,
        phases: this.roomsData()!.system.phases as 1 | 3
      },
      superficies: this.roomsData()!.superficies,
      consumos: this.loadsData()!
    };

    this.apiService.executeFullCalculation(calculationInput).subscribe({
      next: (result: FullCalculationResult) => {
        console.log('Cálculo completo exitoso:', result);
      },
      error: (error) => {
        console.error('Error en el cálculo completo:', error);
      }
    });
  }

  resetCalculation(): void {
    this.roomsData.set(null);
    this.loadsData.set(null);
    this.apiService.clearAllResults();
    this.apiService.clearError();
  }

  getCurrentCalculationInput(): CalculationInput | null {
    if (this.roomsData() && this.loadsData()) {
      return {
        system: {
          ...this.roomsData()!.system,
          phases: this.roomsData()!.system.phases as 1 | 3
        },
        superficies: this.roomsData()!.superficies,
        consumos: this.loadsData()!
      };
    }
    return null;
  }

  /**
   * Maneja los datos cargados desde Excel
   */
  onExcelDataLoaded(data: any): void {
    console.log('Datos cargados desde Excel:', data);
    
    // Convertir datos de Excel al formato esperado
    if (data.system && data.superficies && data.consumos) {
      // Actualizar datos de ambientes
      this.roomsData.set({
        system: data.system,
        superficies: data.superficies.map((s: any) => ({
          nombre: s.name,
          area_m2: s.area,
          tipo: s.type
        }))
      });

      // Actualizar datos de consumos
      this.loadsData.set(data.consumos.map((c: any) => ({
        nombre: c.name,
        potencia_w: c.power,
        cantidad: c.quantity,
        tipo: c.type
      })));
    }
  }
}

