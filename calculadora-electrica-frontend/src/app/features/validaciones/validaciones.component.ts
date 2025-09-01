import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';

import { ValidacionesService, ValidacionResult, ValidacionTomas, ValidacionLuminarias, ValidacionCaidaTension, ValidacionSimultaneidad } from '../../core/services/validaciones.service';
import { ResultadosService } from '../../core/services/resultados.service';

@Component({
  selector: 'app-validaciones',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="validaciones-container">
      <!-- Header -->
      <div class="page-header">
        <h1 class="page-title">
          <i class="fas fa-shield-alt me-2"></i>
          Validaciones Normativas
        </h1>
        <p class="page-subtitle">
          Sprint 14 - Validaciones y Optimización
        </p>
      </div>

      <!-- Loading State -->
      <div class="loading-container" *ngIf="loading()">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Cargando...</span>
        </div>
        <p class="mt-3">Analizando validaciones normativas...</p>
      </div>

      <!-- Error State -->
      <div class="error-container" *ngIf="error()">
        <div class="alert alert-danger">
          <i class="fas fa-exclamation-triangle me-2"></i>
          {{ error() }}
        </div>
        <button class="btn btn-primary" (click)="cargarValidaciones()">
          <i class="fas fa-redo me-2"></i>
          Reintentar
        </button>
      </div>

      <!-- Content -->
      <div class="validaciones-content" *ngIf="validacionResult() && !loading()">
        <!-- Summary Card -->
        <div class="row mb-4">
          <div class="col-12">
            <div class="card summary-card" [class.card-success]="validacionResult()?.isValid" [class.card-warning]="!validacionResult()?.isValid">
              <div class="card-body">
                <div class="d-flex align-items-center">
                  <div class="summary-icon">
                    <i class="fas" [class.fa-check-circle]="validacionResult()?.isValid" [class.fa-exclamation-triangle]="!validacionResult()?.isValid"></i>
                  </div>
                  <div class="summary-content">
                    <h4 class="summary-title">
                      {{ validacionResult()?.isValid ? 'Proyecto Válido' : 'Proyecto con Problemas' }}
                    </h4>
                    <p class="summary-description">
                      {{ validacionResult()?.isValid ? 'El proyecto cumple con todas las normativas' : 'Se encontraron problemas que requieren atención' }}
                    </p>
                  </div>
                  <div class="summary-stats">
                    <div class="stat-item">
                      <span class="stat-number">{{ validacionResult()?.errors?.length || 0 }}</span>
                      <span class="stat-label">Errores</span>
                    </div>
                    <div class="stat-item">
                      <span class="stat-number">{{ validacionResult()?.warnings?.length || 0 }}</span>
                      <span class="stat-label">Advertencias</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Validation Sections -->
        <div class="row">
          <!-- HU14.1 - Validación de Tomas -->
          <div class="col-lg-6 mb-4">
            <div class="card">
              <div class="card-header">
                <h5 class="card-title mb-0">
                  <i class="fas fa-plug me-2"></i>
                  HU14.1 - Validación de Tomas
                </h5>
              </div>
              <div class="card-body">
                <div class="table-responsive">
                  <table class="table table-sm">
                    <thead>
                      <tr>
                        <th>Ambiente</th>
                        <th>Área (m²)</th>
                        <th>Tomas</th>
                        <th>Máximo</th>
                        <th>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr *ngFor="let toma of validacionTomas()" [class.table-warning]="toma.exceso > 0">
                        <td>{{ toma.ambiente }}</td>
                        <td>{{ toma.areaM2 }}</td>
                        <td>{{ toma.tomasCalculadas }}</td>
                        <td>{{ toma.tomasMaximas }}</td>
                        <td>
                          <span class="badge" [class.badge-success]="toma.exceso === 0" [class.badge-warning]="toma.exceso > 0">
                            {{ toma.exceso === 0 ? 'OK' : '+' + toma.exceso }}
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          <!-- HU14.2 - Validación de Luminarias -->
          <div class="col-lg-6 mb-4">
            <div class="card">
              <div class="card-header">
                <h5 class="card-title mb-0">
                  <i class="fas fa-lightbulb me-2"></i>
                  HU14.2 - Validación de Luminarias
                </h5>
              </div>
              <div class="card-body">
                <div class="table-responsive">
                  <table class="table table-sm">
                    <thead>
                      <tr>
                        <th>Ambiente</th>
                        <th>Área (m²)</th>
                        <th>Luminarias</th>
                        <th>Máximo</th>
                        <th>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr *ngFor="let luminaria of validacionLuminarias()" [class.table-warning]="luminaria.exceso > 0">
                        <td>{{ luminaria.ambiente }}</td>
                        <td>{{ luminaria.areaM2 }}</td>
                        <td>{{ luminaria.luminariasCalculadas }}</td>
                        <td>{{ luminaria.luminariasMaximas }}</td>
                        <td>
                          <span class="badge" [class.badge-success]="luminaria.exceso === 0" [class.badge-warning]="luminaria.exceso > 0">
                            {{ luminaria.exceso === 0 ? 'OK' : '+' + luminaria.exceso }}
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          <!-- HU14.3 - Validación de Caída de Tensión -->
          <div class="col-lg-6 mb-4">
            <div class="card">
              <div class="card-header">
                <h5 class="card-title mb-0">
                  <i class="fas fa-bolt me-2"></i>
                  HU14.3 - Caída de Tensión
                </h5>
              </div>
              <div class="card-body">
                <div class="table-responsive">
                  <table class="table table-sm">
                    <thead>
                      <tr>
                        <th>Circuito</th>
                        <th>Longitud (m)</th>
                        <th>Corriente (A)</th>
                        <th>Caída (%)</th>
                        <th>Máximo (%)</th>
                        <th>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr *ngFor="let caida of validacionCaidaTension()" [class.table-danger]="caida.caidaCalculada > caida.caidaMaxima">
                        <td>{{ caida.circuito }}</td>
                        <td>{{ caida.longitud }}</td>
                        <td>{{ caida.corriente }}</td>
                        <td>{{ caida.caidaCalculada.toFixed(2) }}%</td>
                        <td>{{ caida.caidaMaxima }}%</td>
                        <td>
                          <span class="badge" [class.badge-success]="caida.caidaCalculada <= caida.caidaMaxima" [class.badge-danger]="caida.caidaCalculada > caida.caidaMaxima">
                            {{ caida.caidaCalculada <= caida.caidaMaxima ? 'OK' : 'EXCESO' }}
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          <!-- HU14.4 - Validación de Simultaneidad -->
          <div class="col-lg-6 mb-4">
            <div class="card">
              <div class="card-header">
                <h5 class="card-title mb-0">
                  <i class="fas fa-calculator me-2"></i>
                  HU14.4 - Simultaneidad
                </h5>
              </div>
              <div class="card-body">
                <div class="table-responsive">
                  <table class="table table-sm">
                    <thead>
                      <tr>
                        <th>Equipo</th>
                        <th>Cantidad</th>
                        <th>Factor</th>
                        <th>Total (W)</th>
                        <th>Simultáneo (W)</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr *ngFor="let sim of validacionSimultaneidad()">
                        <td>{{ sim.tipo }}</td>
                        <td>{{ sim.cantidad }}</td>
                        <td>{{ (sim.factorSimultaneidad * 100).toFixed(0) }}%</td>
                        <td>{{ sim.potenciaTotal.toFixed(0) }}</td>
                        <td>{{ sim.potenciaSimultanea.toFixed(0) }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Recommendations -->
        <div class="row" *ngIf="recomendaciones().length > 0">
          <div class="col-12">
            <div class="card">
              <div class="card-header">
                <h5 class="card-title mb-0">
                  <i class="fas fa-lightbulb me-2"></i>
                  Recomendaciones
                </h5>
              </div>
              <div class="card-body">
                <div class="recommendations-list">
                  <div *ngFor="let rec of recomendaciones()" class="recommendation-item">
                    {{ rec }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./validaciones.component.css']
})
export class ValidacionesComponent implements OnInit {
  // Signals
  loading = signal<boolean>(false);
  error = signal<string | null>(null);
  validacionResult = signal<ValidacionResult | null>(null);
  validacionTomas = signal<ValidacionTomas[]>([]);
  validacionLuminarias = signal<ValidacionLuminarias[]>([]);
  validacionCaidaTension = signal<ValidacionCaidaTension[]>([]);
  validacionSimultaneidad = signal<ValidacionSimultaneidad[]>([]);
  recomendaciones = signal<string[]>([]);

  constructor(
    private route: ActivatedRoute,
    private validacionesService: ValidacionesService,
    private resultadosService: ResultadosService
  ) {}

  ngOnInit() {
    this.cargarValidaciones();
  }

  cargarValidaciones() {
    const projectId = this.route.snapshot.paramMap.get('id');
    if (!projectId) {
      this.error.set('ID de proyecto no válido');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.resultadosService.getResultados(parseInt(projectId)).subscribe({
      next: (resultados) => {
        // Preparar datos para validación
        const proyecto = this.prepararDatosParaValidacion(resultados);
        
        // Ejecutar validaciones
        const validacion = this.validacionesService.validarProyectoCompleto(proyecto);
        this.validacionResult.set(validacion);

        // Obtener validaciones específicas
        this.validacionTomas.set(this.validacionesService.validarTomas(proyecto.ambientes || []));
        this.validacionLuminarias.set(this.validacionesService.validarLuminarias(proyecto.ambientes || []));
        this.validacionCaidaTension.set(this.validacionesService.validarCaidaTension(proyecto.circuitos || []));
        this.validacionSimultaneidad.set(this.validacionesService.validarSimultaneidad(proyecto.equipos || []));

        // Obtener recomendaciones
        this.recomendaciones.set(this.validacionesService.getRecomendacionesEspecificas(validacion));

        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Error al cargar validaciones: ' + err.message);
        this.loading.set(false);
      }
    });
  }

  private prepararDatosParaValidacion(resultados: any): any {
    // Convertir datos del backend al formato esperado por las validaciones
    const proyecto = {
      ambientes: [],
      circuitos: [],
      equipos: []
    };

    // Preparar ambientes
    if (resultados.ambientes) {
      proyecto.ambientes = resultados.ambientes.map((amb: any) => ({
        nombre: amb.nombre,
        areaM2: amb.area_m2,
        tomas: amb.tomas || Math.ceil(amb.area_m2 / 12), // Estimación si no hay datos
        luminarias: amb.luminarias || Math.ceil(amb.area_m2 / 15) // Estimación si no hay datos
      }));
    }

    // Preparar circuitos
    if (resultados.circuitos) {
      proyecto.circuitos = resultados.circuitos.map((circ: any) => ({
        nombre: circ.nombre || `Circuito ${circ.id}`,
        tipo: circ.tipo || 'Mixto',
        longitud: circ.longitud || 30, // Estimación si no hay datos
        corriente: circ.corriente_a,
        calibre: circ.conductor?.calibre_awg || '14',
        material: circ.conductor?.material || 'Cobre'
      }));
    }

    // Preparar equipos (extraer de consumos)
    if (resultados.consumos) {
      const equiposPorTipo = new Map<string, { cantidad: number, potenciaUnitaria: number }>();
      
      resultados.consumos.forEach((consumo: any) => {
        const tipo = consumo.tipo || 'default';
        if (equiposPorTipo.has(tipo)) {
          equiposPorTipo.get(tipo)!.cantidad++;
        } else {
          equiposPorTipo.set(tipo, { cantidad: 1, potenciaUnitaria: consumo.potencia_w });
        }
      });

      proyecto.equipos = Array.from(equiposPorTipo.entries()).map(([tipo, datos]) => ({
        tipo,
        cantidad: datos.cantidad,
        potenciaUnitaria: datos.potenciaUnitaria
      }));
    }

    return proyecto;
  }
}
