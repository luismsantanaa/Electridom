import { Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  CalculationResult,
  FullCalculationResult,
  CalculationInput
} from '../../services/calc-api.service';
import { ReportDownloadComponent } from '../report-download/report-download.component';

@Component({
  selector: 'app-results-view',
  standalone: true,
  imports: [CommonModule, ReportDownloadComponent],
  template: `
    <!-- Resultados del Flujo Completo (CE-01 → CE-05) -->
    <div *ngIf="fullData()">
      <!-- Header con Progreso -->
      <div class="card mb-4">
        <div class="card-header">
          <h5 class="card-title mb-0">
            <i class="fas fa-chart-line me-2"></i>
            Resultados del Cálculo Completo
          </h5>
        </div>
        <div class="card-body">
          <div class="progress mb-3" style="height: 30px;">
            <div class="progress-bar bg-success" style="width: 100%">
              <strong>Flujo CE-01 → CE-05 Completado</strong>
            </div>
          </div>
          <div class="row text-center">
            <div class="col">
              <span class="badge bg-success">CE-01: Rooms</span>
            </div>
            <div class="col">
              <span class="badge bg-success">CE-02: Demand</span>
            </div>
            <div class="col">
              <span class="badge bg-success">CE-03: Circuits</span>
            </div>
            <div class="col">
              <span class="badge bg-success">CE-04: Feeder</span>
            </div>
            <div class="col">
              <span class="badge bg-success">CE-05: Grounding</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Resumen General -->
      <div class="row mb-4">
        <div class="col-12">
          <div class="card bg-primary text-white">
            <div class="card-body">
              <h6 class="card-title">Resumen General del Proyecto</h6>
              <div class="row">
                <div class="col-md-2">
                  <div class="text-center">
                    <h4 class="mb-0">{{ fullData()?.roomsResult.totales.carga_total_va | number:'1.0-0' }}</h4>
                    <small>Carga Total (VA)</small>
                  </div>
                </div>
                <div class="col-md-2">
                  <div class="text-center">
                    <h4 class="mb-0">{{ fullData()?.demandResult.totales.carga_diversificada_va | number:'1.0-0' }}</h4>
                    <small>Carga Diversificada (VA)</small>
                  </div>
                </div>
                <div class="col-md-2">
                  <div class="text-center">
                    <h4 class="mb-0">{{ fullData()?.feederResult.alimentador.corriente_total_a | number:'1.2-2' }}</h4>
                    <small>Corriente Alimentador (A)</small>
                  </div>
                </div>
                <div class="col-md-2">
                  <div class="text-center">
                    <h4 class="mb-0">{{ fullData()?.circuitsResult.totales.total_circuitos }}</h4>
                    <small>Total Circuitos</small>
                  </div>
                </div>
                <div class="col-md-2">
                  <div class="text-center">
                    <h4 class="mb-0">{{ fullData()?.feederResult.totales.potencia_diversificada_kw | number:'1.2-2' }}</h4>
                    <small>Potencia (kW)</small>
                  </div>
                </div>
                <div class="col-md-2">
                  <div class="text-center">
                    <h4 class="mb-0">{{ fullData()?.groundingResult.puesta_tierra.resistencia_maxima | number:'1.2-2' }}</h4>
                    <small>Resistencia (Ω)</small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Tabs para diferentes secciones -->
      <div class="row mb-4">
        <div class="col-12">
          <div class="card">
            <div class="card-header">
              <ul class="nav nav-tabs card-header-tabs" role="tablist">
                <li class="nav-item" role="presentation">
                  <button class="nav-link active" data-bs-toggle="tab" data-bs-target="#rooms" type="button" role="tab">
                    <i class="fas fa-home me-1"></i> Ambientes
                  </button>
                </li>
                <li class="nav-item" role="presentation">
                  <button class="nav-link" data-bs-toggle="tab" data-bs-target="#demand" type="button" role="tab">
                    <i class="fas fa-chart-pie me-1"></i> Demanda
                  </button>
                </li>
                <li class="nav-item" role="presentation">
                  <button class="nav-link" data-bs-toggle="tab" data-bs-target="#circuits" type="button" role="tab">
                    <i class="fas fa-plug me-1"></i> Circuitos
                  </button>
                </li>
                <li class="nav-item" role="presentation">
                  <button class="nav-link" data-bs-toggle="tab" data-bs-target="#feeder" type="button" role="tab">
                    <i class="fas fa-bolt me-1"></i> Alimentador
                  </button>
                </li>
                <li class="nav-item" role="presentation">
                  <button class="nav-link" data-bs-toggle="tab" data-bs-target="#grounding" type="button" role="tab">
                    <i class="fas fa-shield-alt me-1"></i> Puesta a Tierra
                  </button>
                </li>
              </ul>
            </div>
            <div class="card-body">
              <div class="tab-content">
                <!-- Tab Ambientes -->
                <div class="tab-pane fade show active" id="rooms" role="tabpanel">
                  <div class="table-responsive">
                    <table class="table table-striped table-hover">
                      <thead class="table-dark">
                        <tr>
                          <th>Ambiente</th>
                          <th>Área (m²)</th>
                          <th>Carga (VA)</th>
                          <th>Factor de Potencia</th>
                          <th>Observaciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr *ngFor="let ambiente of fullData()?.roomsResult.ambientes">
                          <td><strong>{{ ambiente.nombre }}</strong></td>
                          <td>{{ ambiente.area_m2 | number:'1.2-2' }}</td>
                          <td><span class="badge bg-success">{{ ambiente.carga_va | number:'1.0-0' }} VA</span></td>
                          <td><span class="badge" [ngClass]="getFPBadgeClass(ambiente.fp)">{{ ambiente.fp | number:'1.2-2' }}</span></td>
                          <td><small class="text-muted">{{ ambiente.observaciones || '-' }}</small></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <!-- Tab Demanda -->
                <div class="tab-pane fade" id="demand" role="tabpanel">
                  <div class="table-responsive">
                    <table class="table table-striped table-hover">
                      <thead class="table-dark">
                        <tr>
                          <th>Ambiente</th>
                          <th>Factor de Demanda</th>
                          <th>Carga Diversificada (VA)</th>
                          <th>Observaciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr *ngFor="let ambiente of fullData()?.demandResult.ambientes">
                          <td><strong>{{ ambiente.nombre }}</strong></td>
                          <td><span class="badge bg-info">{{ ambiente.factor_demanda | number:'1.2-2' }}</span></td>
                          <td><span class="badge bg-success">{{ ambiente.carga_diversificada_va | number:'1.0-0' }} VA</span></td>
                          <td><small class="text-muted">{{ ambiente.observaciones || '-' }}</small></td>
                        </tr>
                      </tbody>
                      <tfoot class="table-light">
                        <tr>
                          <td><strong>Promedio</strong></td>
                          <td><strong>{{ fullData()?.demandResult.totales.factor_demanda_promedio | number:'1.2-2' }}</strong></td>
                          <td><strong>{{ fullData()?.demandResult.totales.carga_diversificada_va | number:'1.0-0' }} VA</strong></td>
                          <td></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>

                <!-- Tab Circuitos -->
                <div class="tab-pane fade" id="circuits" role="tabpanel">
                  <div class="table-responsive">
                    <table class="table table-striped table-hover">
                      <thead class="table-dark">
                        <tr>
                          <th>Circuito</th>
                          <th>Ambiente</th>
                          <th>Carga (VA)</th>
                          <th>Corriente (A)</th>
                          <th>Conductor</th>
                          <th>Protección</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr *ngFor="let circuito of fullData()?.circuitsResult.circuitos">
                          <td><strong>{{ circuito.nombre }}</strong></td>
                          <td>{{ circuito.ambiente }}</td>
                          <td><span class="badge bg-success">{{ circuito.carga_va | number:'1.0-0' }} VA</span></td>
                          <td><span class="badge bg-warning">{{ circuito.corriente_a | number:'1.2-2' }} A</span></td>
                          <td><code>{{ circuito.conductor }}</code></td>
                          <td><code>{{ circuito.proteccion }}</code></td>
                        </tr>
                      </tbody>
                      <tfoot class="table-light">
                        <tr>
                          <td><strong>Total</strong></td>
                          <td><strong>{{ fullData()?.circuitsResult.totales.total_circuitos }} circuitos</strong></td>
                          <td><strong>{{ fullData()?.circuitsResult.totales.carga_total_va | number:'1.0-0' }} VA</strong></td>
                          <td><strong>{{ fullData()?.circuitsResult.totales.corriente_total_a | number:'1.2-2' }} A</strong></td>
                          <td></td>
                          <td></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>

                <!-- Tab Alimentador -->
                <div class="tab-pane fade" id="feeder" role="tabpanel">
                  <div class="row">
                    <div class="col-md-6">
                      <div class="card">
                        <div class="card-header">
                          <h6 class="card-title mb-0">Especificaciones del Alimentador</h6>
                        </div>
                        <div class="card-body">
                          <table class="table table-borderless">
                            <tr>
                              <td><strong>Carga Total:</strong></td>
                              <td>{{ fullData()?.feederResult.alimentador.carga_total_va | number:'1.0-0' }} VA</td>
                            </tr>
                            <tr>
                              <td><strong>Corriente Total:</strong></td>
                              <td>{{ fullData()?.feederResult.alimentador.corriente_total_a | number:'1.2-2' }} A</td>
                            </tr>
                            <tr>
                              <td><strong>Conductor:</strong></td>
                              <td><code>{{ fullData()?.feederResult.alimentador.conductor }}</code></td>
                            </tr>
                            <tr>
                              <td><strong>Protección:</strong></td>
                              <td><code>{{ fullData()?.feederResult.alimentador.proteccion }}</code></td>
                            </tr>
                            <tr>
                              <td><strong>Caída de Tensión:</strong></td>
                              <td>{{ fullData()?.feederResult.alimentador.caida_tension | number:'1.2-2' }}%</td>
                            </tr>
                          </table>
                        </div>
                      </div>
                    </div>
                    <div class="col-md-6">
                      <div class="card">
                        <div class="card-header">
                          <h6 class="card-title mb-0">Resumen de Potencias</h6>
                        </div>
                        <div class="card-body">
                          <table class="table table-borderless">
                            <tr>
                              <td><strong>Potencia Instalada:</strong></td>
                              <td>{{ fullData()?.feederResult.totales.potencia_instalada_kw | number:'1.2-2' }} kW</td>
                            </tr>
                            <tr>
                              <td><strong>Potencia Diversificada:</strong></td>
                              <td>{{ fullData()?.feederResult.totales.potencia_diversificada_kw | number:'1.2-2' }} kW</td>
                            </tr>
                            <tr>
                              <td><strong>Factor de Demanda:</strong></td>
                              <td>{{ fullData()?.feederResult.totales.factor_demanda | number:'1.2-2' }}</td>
                            </tr>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Tab Puesta a Tierra -->
                <div class="tab-pane fade" id="grounding" role="tabpanel">
                  <div class="row">
                    <div class="col-md-6">
                      <div class="card">
                        <div class="card-header">
                          <h6 class="card-title mb-0">Especificaciones de Puesta a Tierra</h6>
                        </div>
                        <div class="card-body">
                          <table class="table table-borderless">
                            <tr>
                              <td><strong>Resistencia Máxima:</strong></td>
                              <td>{{ fullData()?.groundingResult.puesta_tierra.resistencia_maxima | number:'1.2-2' }} Ω</td>
                            </tr>
                            <tr>
                              <td><strong>Conductor:</strong></td>
                              <td><code>{{ fullData()?.groundingResult.puesta_tierra.conductor }}</code></td>
                            </tr>
                            <tr>
                              <td><strong>Electrodo:</strong></td>
                              <td><code>{{ fullData()?.groundingResult.puesta_tierra.electrodo }}</code></td>
                            </tr>
                            <tr>
                              <td><strong>Longitud:</strong></td>
                              <td>{{ fullData()?.groundingResult.puesta_tierra.longitud | number:'1.2-2' }} m</td>
                            </tr>
                          </table>
                        </div>
                      </div>
                    </div>
                    <div class="col-md-6">
                      <div class="card">
                        <div class="card-header">
                          <h6 class="card-title mb-0">Parámetros de Seguridad</h6>
                        </div>
                        <div class="card-body">
                          <table class="table table-borderless">
                            <tr>
                              <td><strong>Corriente de Falla:</strong></td>
                              <td>{{ fullData()?.groundingResult.totales.corriente_falla | number:'1.2-2' }} A</td>
                            </tr>
                            <tr>
                              <td><strong>Tensión a Tierra:</strong></td>
                              <td>{{ fullData()?.groundingResult.totales.tension_tierra | number:'1.2-2' }} V</td>
                            </tr>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Componente de Descarga de Reportes -->
      <div class="row mb-4">
        <div class="col-12">
          <app-report-download
            [fullData]="fullData()"
            [calculationInput]="calculationInput()"
          />
        </div>
      </div>

      <!-- Botones de Acción -->
      <div class="row mt-4">
        <div class="col-12">
          <div class="d-flex justify-content-between">
            <button type="button" class="btn btn-outline-secondary" (click)="exportResults()">
              <i class="fas fa-download me-1"></i> Exportar Resultados
            </button>
            <button type="button" class="btn btn-primary" (click)="continueToNextStep()">
              <i class="fas fa-arrow-right me-1"></i> Continuar al Siguiente Paso
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Resultados Simples (Solo Rooms) -->
    <div class="card" *ngIf="data() && !fullData()">
      <div class="card-header">
        <h5 class="card-title mb-0">
          <i class="fas fa-chart-bar me-2"></i>
          Resultados del Cálculo
        </h5>
      </div>
      <div class="card-body">
        <!-- Contenido original para resultados simples -->
        <div class="row mb-4">
          <div class="col-12">
            <div class="card bg-primary text-white">
              <div class="card-body">
                <h6 class="card-title">Resumen General</h6>
                <div class="row">
                  <div class="col-md-3">
                    <div class="text-center">
                      <h4 class="mb-0">{{ data()?.totales.carga_total_va | number:'1.0-0' }}</h4>
                      <small>Carga Total (VA)</small>
                    </div>
                  </div>
                  <div class="col-md-3">
                    <div class="text-center">
                      <h4 class="mb-0">{{ data()?.totales.carga_diversificada_va | number:'1.0-0' }}</h4>
                      <small>Carga Diversificada (VA)</small>
                    </div>
                  </div>
                  <div class="col-md-3">
                    <div class="text-center">
                      <h4 class="mb-0">{{ data()?.totales.corriente_total_a | number:'1.2-2' }}</h4>
                      <small>Corriente Total (A)</small>
                    </div>
                  </div>
                  <div class="col-md-3">
                    <div class="text-center">
                      <h4 class="mb-0">{{ data()?.totales.tension_v }}V / {{ data()?.totales.phases }}Φ</h4>
                      <small>Sistema Eléctrico</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Tabla de Ambientes -->
        <div class="row mb-4">
          <div class="col-12">
            <div class="card">
              <div class="card-header">
                <h6 class="card-title mb-0">Cargas por Ambiente</h6>
              </div>
              <div class="card-body">
                <div class="table-responsive">
                  <table class="table table-striped table-hover">
                    <thead class="table-dark">
                      <tr>
                        <th>Ambiente</th>
                        <th>Área (m²)</th>
                        <th>Carga (VA)</th>
                        <th>Factor de Potencia</th>
                        <th>Observaciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr *ngFor="let ambiente of data()?.ambientes">
                        <td><strong>{{ ambiente.nombre }}</strong></td>
                        <td>{{ ambiente.area_m2 | number:'1.2-2' }}</td>
                        <td><span class="badge bg-success">{{ ambiente.carga_va | number:'1.0-0' }} VA</span></td>
                        <td><span class="badge" [ngClass]="getFPBadgeClass(ambiente.fp)">{{ ambiente.fp | number:'1.2-2' }}</span></td>
                        <td><small class="text-muted">{{ ambiente.observaciones || '-' }}</small></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Componente de Descarga de Reportes para resultados simples -->
        <div class="row mb-4">
          <div class="col-12">
            <app-report-download
              [basicData]="data()"
              [calculationInput]="calculationInput()"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Estado vacío -->
    <div class="card" *ngIf="!data() && !fullData()">
      <div class="card-body text-center">
        <i class="fas fa-chart-bar fa-3x text-muted mb-3"></i>
        <h5 class="text-muted">Sin Resultados</h5>
        <p class="text-muted">
          Ejecuta un cálculo para ver los resultados aquí
        </p>
      </div>
    </div>
  `,
  styles: [`
    .table th {
      font-weight: 600;
    }
    .progress {
      height: 25px;
    }
    .progress-bar {
      line-height: 25px;
      font-weight: 600;
    }
    .badge {
      font-size: 0.8rem;
    }
    .list-group-item {
      border: none;
      padding: 0.5rem 0;
    }
    .alert {
      margin-bottom: 0;
    }
    .nav-tabs .nav-link {
      color: #6c757d;
    }
    .nav-tabs .nav-link.active {
      color: #0d6efd;
      font-weight: 600;
    }
    code {
      background-color: #f8f9fa;
      padding: 0.2rem 0.4rem;
      border-radius: 0.25rem;
      font-size: 0.875rem;
    }
  `]
})
export class ResultsViewComponent {
  // Input signals
  data = input<CalculationResult | null>(null);
  fullData = input<FullCalculationResult | null>(null);
  calculationInput = input<CalculationInput | null>(null);

  // Computed properties para resultados simples
  totalArea = computed(() => {
    const ambientes = this.data()?.ambientes;
    if (!ambientes) return 0;
    return ambientes.reduce((total, ambiente) => total + ambiente.area_m2, 0);
  });

  averageFP = computed(() => {
    const ambientes = this.data()?.ambientes;
    if (!ambientes || ambientes.length === 0) return 0;
    const totalFP = ambientes.reduce((total, ambiente) => total + ambiente.fp, 0);
    return totalFP / ambientes.length;
  });

  diversificationPercentage = computed(() => {
    const data = this.data();
    if (!data || data.totales.carga_total_va === 0) return 0;
    return (data.totales.carga_diversificada_va / data.totales.carga_total_va) * 100;
  });

  recommendations = computed(() => {
    const data = this.data();
    if (!data) return [];

    const recommendations: string[] = [];

    // Análisis de factor de diversificación
    const diversification = this.diversificationPercentage();
    if (diversification < 50) {
      recommendations.push('Considera revisar la distribución de cargas para mejorar el factor de diversificación');
    }

    // Análisis de corriente
    const current = data.totales.corriente_total_a;
    if (current > 100) {
      recommendations.push('La corriente total es alta, considera dividir en circuitos separados');
    }

    // Análisis de factor de potencia
    const avgFP = this.averageFP();
    if (avgFP < 0.8) {
      recommendations.push('El factor de potencia promedio es bajo, considera corrección de FP');
    }

    // Recomendación general
    if (recommendations.length === 0) {
      recommendations.push('Los resultados están dentro de parámetros normales');
    }

    return recommendations;
  });

  // Métodos de utilidad
  getFPBadgeClass(fp: number): string {
    if (fp >= 0.9) return 'bg-success';
    if (fp >= 0.8) return 'bg-warning';
    return 'bg-danger';
  }

  getDiversificationClass(): string {
    const percentage = this.diversificationPercentage();
    if (percentage >= 70) return 'bg-success';
    if (percentage >= 50) return 'bg-warning';
    return 'bg-danger';
  }

  getCurrentAlertClass(): string {
    const current = this.data()?.totales.corriente_total_a || 0;
    if (current <= 50) return 'alert-success';
    if (current <= 100) return 'alert-warning';
    return 'alert-danger';
  }

  // Métodos de acción
  exportResults(): void {
    // TODO: Implementar exportación de resultados
    console.log('Exportar resultados:', this.fullData() || this.data());
  }

  continueToNextStep(): void {
    // TODO: Implementar navegación al siguiente paso
    console.log('Continuar al siguiente paso');
  }
}
