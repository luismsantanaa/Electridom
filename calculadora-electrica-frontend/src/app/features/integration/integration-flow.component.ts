import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

import { IntegrationService, ProjectCreationData, IntegrationFlowResult } from '../../core/services/integration.service';
import { ExportService } from '../../core/services/export.service';

@Component({
  selector: 'app-integration-flow',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="integration-container">
      <!-- Header -->
      <div class="page-header">
        <h1 class="page-title">
          <i class="fas fa-cogs me-2"></i>
          Flujo de Integración End-to-End
        </h1>
        <p class="page-subtitle">Sprint 13 - Integración avanzada Backend + Frontend</p>
      </div>

      <!-- Status Check -->
      <div class="status-section mb-4" *ngIf="integrationStatus()">
        <div class="card">
          <div class="card-header">
            <h5 class="card-title mb-0">
              <i class="fas fa-heartbeat me-2"></i>
              Estado de Integración
            </h5>
          </div>
          <div class="card-body">
            <div class="row">
              <div class="col-md-4">
                <div
                  class="status-item"
                  [class.status-ok]="integrationStatus()?.backend"
                  [class.status-error]="!integrationStatus()?.backend"
                >
                  <i class="fas fa-server me-2"></i>
                  Backend: {{ integrationStatus()?.backend ? 'Conectado' : 'Desconectado' }}
                </div>
              </div>
              <div class="col-md-4">
                <div
                  class="status-item"
                  [class.status-ok]="integrationStatus()?.database"
                  [class.status-error]="!integrationStatus()?.database"
                >
                  <i class="fas fa-database me-2"></i>
                  Base de Datos: {{ integrationStatus()?.database ? 'Conectada' : 'Desconectada' }}
                </div>
              </div>
              <div class="col-md-4">
                <div class="status-item status-ok">
                  <i class="fas fa-list me-2"></i>
                  Servicios: {{ integrationStatus()?.services?.length || 0 }} activos
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Project Creation Form -->
      <div class="form-section mb-4" *ngIf="!currentProject()">
        <div class="card">
          <div class="card-header">
            <h5 class="card-title mb-0">
              <i class="fas fa-plus-circle me-2"></i>
              HU13.1 - Crear Proyecto End-to-End
            </h5>
          </div>
          <div class="card-body">
            <form [formGroup]="projectForm" (ngSubmit)="createProject()">
              <div class="row">
                <div class="col-md-6">
                  <div class="mb-3">
                    <label class="form-label">Nombre del Proyecto</label>
                    <input type="text" class="form-control" formControlName="projectName" placeholder="Ej: Residencia García" />
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="mb-3">
                    <label class="form-label">Descripción</label>
                    <input type="text" class="form-control" formControlName="description" placeholder="Ej: Unifamiliar 2 plantas" />
                  </div>
                </div>
              </div>

              <!-- Surfaces -->
              <div class="mb-3">
                <label class="form-label">Superficies</label>
                <div formArrayName="surfaces">
                  <div *ngFor="let surface of surfacesArray()?.controls; let i = index" [formGroupName]="i" class="row mb-2">
                    <div class="col-md-6">
                      <input type="text" class="form-control" formControlName="environment" placeholder="Ambiente" />
                    </div>
                    <div class="col-md-4">
                      <input type="number" class="form-control" formControlName="areaM2" placeholder="Área (m²)" />
                    </div>
                    <div class="col-md-2">
                      <button type="button" class="btn btn-danger btn-sm" (click)="removeSurface(i)">
                        <i class="fas fa-trash"></i>
                      </button>
                    </div>
                  </div>
                </div>
                <button type="button" class="btn btn-outline-primary btn-sm" (click)="addSurface()">
                  <i class="fas fa-plus me-1"></i>
                  Agregar Superficie
                </button>
              </div>

              <!-- Consumptions -->
              <div class="mb-3">
                <label class="form-label">Consumos</label>
                <div formArrayName="consumptions">
                  <div *ngFor="let consumption of consumptionsArray()?.controls; let i = index" [formGroupName]="i" class="row mb-2">
                    <div class="col-md-4">
                      <input type="text" class="form-control" formControlName="name" placeholder="Nombre" />
                    </div>
                    <div class="col-md-3">
                      <input type="text" class="form-control" formControlName="environment" placeholder="Ambiente" />
                    </div>
                    <div class="col-md-3">
                      <input type="number" class="form-control" formControlName="watts" placeholder="Watts" />
                    </div>
                    <div class="col-md-2">
                      <button type="button" class="btn btn-danger btn-sm" (click)="removeConsumption(i)">
                        <i class="fas fa-trash"></i>
                      </button>
                    </div>
                  </div>
                </div>
                <button type="button" class="btn btn-outline-primary btn-sm" (click)="addConsumption()">
                  <i class="fas fa-plus me-1"></i>
                  Agregar Consumo
                </button>
              </div>

              <!-- Options -->
              <div class="row">
                <div class="col-md-6">
                  <div class="mb-3">
                    <label class="form-label">Tensión (V)</label>
                    <select class="form-select" formControlName="tensionV">
                      <option value="120">120V</option>
                      <option value="240">240V</option>
                      <option value="480">480V</option>
                    </select>
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="mb-3">
                    <div class="form-check">
                      <input class="form-check-input" type="checkbox" formControlName="monofasico" id="monofasico" />
                      <label class="form-check-label" for="monofasico">Monofásico</label>
                    </div>
                  </div>
                </div>
              </div>

              <div class="mb-3">
                <div class="form-check">
                  <input class="form-check-input" type="checkbox" formControlName="computeNow" id="computeNow" />
                  <label class="form-check-label" for="computeNow">Ejecutar cálculo inmediatamente</label>
                </div>
              </div>

              <button type="submit" class="btn btn-primary" [disabled]="projectForm.invalid || creating()">
                <i class="fas fa-rocket me-2"></i>
                {{ creating() ? 'Creando...' : 'Crear Proyecto' }}
              </button>
            </form>
          </div>
        </div>
      </div>

      <!-- Project Results -->
      <div class="results-section" *ngIf="currentProject()">
        <div class="card">
          <div class="card-header">
            <h5 class="card-title mb-0">
              <i class="fas fa-check-circle me-2"></i>
              Proyecto Creado Exitosamente
            </h5>
          </div>
          <div class="card-body">
            <div class="row">
              <div class="col-md-6">
                <h6>Información del Proyecto</h6>
                <p>
                  <strong>ID:</strong>
                  {{ currentProject()?.projectId }}
                </p>
                <p>
                  <strong>Nombre:</strong>
                  {{ currentProject()?.projectName }}
                </p>
                <p>
                  <strong>Estado:</strong>
                  {{ currentProject()?.status }}
                </p>
              </div>
              <div class="col-md-6">
                <h6>Acciones</h6>
                <div class="d-grid gap-2">
                  <button class="btn btn-success" (click)="viewResults()" *ngIf="currentProject()?.results">
                    <i class="fas fa-chart-bar me-2"></i>
                    Ver Resultados
                  </button>
                  <button class="btn btn-primary" (click)="executeCalculation()" *ngIf="!currentProject()?.results">
                    <i class="fas fa-calculator me-2"></i>
                    Ejecutar Cálculo
                  </button>
                  <button class="btn btn-info" (click)="exportProject()" *ngIf="currentProject()?.results">
                    <i class="fas fa-download me-2"></i>
                    Exportar
                  </button>
                  <button class="btn btn-secondary" (click)="createNewProject()">
                    <i class="fas fa-plus me-2"></i>
                    Crear Nuevo Proyecto
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div class="loading-overlay" *ngIf="loading()">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Cargando...</span>
        </div>
        <p class="mt-3">{{ loadingMessage() }}</p>
      </div>
    </div>
  `,
  styleUrls: ['./integration-flow.component.css']
})
export class IntegrationFlowComponent implements OnInit {
  // Signals
  loading = signal<boolean>(false);
  loadingMessage = signal<string>('Cargando...');
  creating = signal<boolean>(false);
  currentProject = signal<IntegrationFlowResult | null>(null);
  integrationStatus = signal<any>(null);

  // Form
  projectForm: FormGroup;

  // Computed
  surfacesArray = computed(() => this.projectForm.get('surfaces') as any);
  consumptionsArray = computed(() => this.projectForm.get('consumptions') as any);

  constructor(
    private fb: FormBuilder,
    private integrationService: IntegrationService,
    private exportService: ExportService,
    private router: Router
  ) {
    this.projectForm = this.fb.group({
      projectName: ['', Validators.required],
      description: ['', Validators.required],
      surfaces: this.fb.array([]),
      consumptions: this.fb.array([]),
      opciones: this.fb.group({
        tensionV: [120, Validators.required],
        monofasico: [true]
      }),
      computeNow: [true]
    });
  }

  ngOnInit() {
    this.checkIntegrationStatus();
    this.initializeForm();
  }

  private checkIntegrationStatus() {
    this.loading.set(true);
    this.loadingMessage.set('Verificando estado de integración...');

    this.integrationService.checkIntegrationStatus().subscribe({
      next: (status) => {
        this.integrationStatus.set(status);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error al verificar estado:', error);
        this.loading.set(false);
      }
    });
  }

  private initializeForm() {
    // Agregar superficies por defecto
    this.addSurface();
    this.addSurface();

    // Agregar consumos por defecto
    this.addConsumption();
    this.addConsumption();
  }

  // Form Array Methods
  addSurface() {
    const surfaces = this.projectForm.get('surfaces') as any;
    surfaces.push(
      this.fb.group({
        environment: ['', Validators.required],
        areaM2: [0, [Validators.required, Validators.min(0.1)]]
      })
    );
  }

  removeSurface(index: number) {
    const surfaces = this.projectForm.get('surfaces') as any;
    if (surfaces.length > 1) {
      surfaces.removeAt(index);
    }
  }

  addConsumption() {
    const consumptions = this.projectForm.get('consumptions') as any;
    consumptions.push(
      this.fb.group({
        name: ['', Validators.required],
        environment: ['', Validators.required],
        watts: [0, [Validators.required, Validators.min(1)]]
      })
    );
  }

  removeConsumption(index: number) {
    const consumptions = this.projectForm.get('consumptions') as any;
    if (consumptions.length > 1) {
      consumptions.removeAt(index);
    }
  }

  // HU13.1 - Crear proyecto end-to-end
  createProject() {
    if (this.projectForm.invalid) return;

    this.creating.set(true);
    this.loadingMessage.set('Creando proyecto...');

    const formData = this.projectForm.value;
    const projectData: ProjectCreationData = {
      projectName: formData.projectName,
      description: formData.description,
      surfaces: formData.surfaces,
      consumptions: formData.consumptions,
      opciones: formData.opciones,
      computeNow: formData.computeNow
    };

    this.integrationService.createProjectEndToEnd(projectData).subscribe({
      next: (result) => {
        this.currentProject.set(result);
        this.creating.set(false);
        console.log('✅ Proyecto creado exitosamente:', result);
      },
      error: (error) => {
        console.error('❌ Error al crear proyecto:', error);
        this.creating.set(false);
        alert('Error al crear el proyecto: ' + error.message);
      }
    });
  }

  // HU13.2 - Flujo de cálculos
  executeCalculation() {
    if (!this.currentProject()) return;

    this.loading.set(true);
    this.loadingMessage.set('Ejecutando cálculos...');

    this.integrationService.executeCalculationFlow(this.currentProject()!.projectId).subscribe({
      next: (result) => {
        this.currentProject.set(result);
        this.loading.set(false);
        console.log('✅ Cálculos ejecutados exitosamente:', result);
      },
      error: (error) => {
        console.error('❌ Error al ejecutar cálculos:', error);
        this.loading.set(false);
        alert('Error al ejecutar cálculos: ' + error.message);
      }
    });
  }

  // HU13.3 - Visualización integrada
  viewResults() {
    if (!this.currentProject()?.projectId) return;

    this.router.navigate(['/proyectos', this.currentProject()!.projectId, 'resultados']);
  }

  // HU13.4 - Exportación real
  exportProject() {
    if (!this.currentProject()?.projectId) return;

    this.loading.set(true);
    this.loadingMessage.set('Preparando exportación...');

    this.integrationService.prepareExportData(this.currentProject()!.projectId).subscribe({
      next: (data) => {
        this.loading.set(false);

        // Convertir a formato de exportación
        const proyectoResultado = {
          id: data.project.id,
          nombre: data.project.name,
          circuitos: data.results.circuitos.map((c: any) => ({
            id: c.id,
            ambienteId: c.ambiente_id,
            ambienteNombre: c.ambiente_nombre,
            tipo: c.tipo,
            potenciaVA: c.potencia_va,
            corrienteA: c.corriente_a,
            proteccion: {
              tipo: c.proteccion.tipo,
              capacidadA: c.proteccion.capacidad_a,
              curva: c.proteccion.curva
            },
            conductor: {
              calibreAWG: c.conductor.calibre_awg,
              material: c.conductor.material,
              capacidadA: c.conductor.capacidad_a
            }
          }))
        };

        // Exportar PDF
        this.exportService.toPDF(proyectoResultado);
        console.log('✅ Exportación completada');
      },
      error: (error) => {
        console.error('❌ Error al exportar:', error);
        this.loading.set(false);
        alert('Error al exportar: ' + error.message);
      }
    });
  }

  createNewProject() {
    this.currentProject.set(null);
    this.projectForm.reset();
    this.initializeForm();
  }
}
