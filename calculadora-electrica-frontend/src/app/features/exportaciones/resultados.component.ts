import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

import { DataGridComponent, DataGridColumn, DataGridAction } from '../../shared/components/data-grid/data-grid.component';
import { ResultadosService, ResultadoModelado } from '../../core/services/resultados.service';
import { ExportService, CircuitoResultado } from '../../core/services/export.service';
import { UnifilarService } from '../../core/services/unifilar.service';

@Component({
  selector: 'app-resultados',
  standalone: true,
  imports: [CommonModule, DataGridComponent],
  template: `
    <div class="resultados-container">
      <!-- Header -->
      <div class="page-header">
        <div class="d-flex justify-content-between align-items-center">
          <div>
            <h1 class="page-title">
              <i class="fas fa-chart-bar me-2"></i>
              Resultados del Proyecto
            </h1>
            <p class="page-subtitle" *ngIf="resultado()">
              {{ resultado()?.proyecto.nombre }} - {{ resultado()?.proyecto.tipo_instalacion }}
            </p>
          </div>
          <div class="header-actions">
            <button 
              class="btn btn-success me-2" 
              (click)="exportarPDF()"
              [disabled]="!resultado() || exportando()"
            >
              <i class="fas fa-file-pdf me-2"></i>
              Exportar PDF
            </button>
            <button 
              class="btn btn-primary me-2" 
              (click)="exportarExcel()"
              [disabled]="!resultado() || exportando()"
            >
              <i class="fas fa-file-excel me-2"></i>
              Exportar Excel
            </button>
            <button 
              class="btn btn-info" 
              (click)="exportarUnifilar()"
              [disabled]="!resultado() || !unifilarSvg() || exportando()"
            >
              <i class="fas fa-download me-2"></i>
              Descargar Unifilar
            </button>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div class="loading-container" *ngIf="loading()">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Cargando...</span>
        </div>
        <p class="mt-3">Cargando resultados del proyecto...</p>
      </div>

      <!-- Error State -->
      <div class="error-container" *ngIf="error()">
        <div class="alert alert-danger">
          <i class="fas fa-exclamation-triangle me-2"></i>
          {{ error() }}
        </div>
        <button class="btn btn-primary" (click)="cargarResultados()">
          <i class="fas fa-redo me-2"></i>
          Reintentar
        </button>
      </div>

      <!-- Content -->
      <div class="resultados-content" *ngIf="resultado() && !loading()">
        <!-- Resumen Cards -->
        <div class="row g-4 mb-4">
          <div class="col-xl-3 col-md-6">
            <div class="card stat-card stat-card-primary">
              <div class="card-body">
                <div class="d-flex align-items-center">
                  <div class="stat-icon">
                    <i class="fas fa-bolt"></i>
                  </div>
                  <div class="stat-content">
                    <h3 class="stat-number">{{ estadisticas().totalCircuitos }}</h3>
                    <p class="stat-label">Circuitos Totales</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="col-xl-3 col-md-6">
            <div class="card stat-card stat-card-success">
              <div class="card-body">
                <div class="d-flex align-items-center">
                  <div class="stat-icon">
                    <i class="fas fa-plug"></i>
                  </div>
                  <div class="stat-content">
                    <h3 class="stat-number">{{ estadisticas().potenciaTotal.toLocaleString() }}</h3>
                    <p class="stat-label">Potencia Total (VA)</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="col-xl-3 col-md-6">
            <div class="card stat-card stat-card-info">
              <div class="card-body">
                <div class="d-flex align-items-center">
                  <div class="stat-icon">
                    <i class="fas fa-tachometer-alt"></i>
                  </div>
                  <div class="stat-content">
                    <h3 class="stat-number">{{ estadisticas().corrienteTotal.toFixed(1) }}</h3>
                    <p class="stat-label">Corriente Total (A)</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="col-xl-3 col-md-6">
            <div class="card stat-card stat-card-warning">
              <div class="card-body">
                <div class="d-flex align-items-center">
                  <div class="stat-icon">
                    <i class="fas fa-building"></i>
                  </div>
                  <div class="stat-content">
                    <h3 class="stat-number">{{ estadisticas().ambientesCount }}</h3>
                    <p class="stat-label">Ambientes</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Gráficos (temporalmente deshabilitados) -->
        <div class="row g-4 mb-4">
          <div class="col-12">
            <div class="card">
              <div class="card-header">
                <h5 class="card-title mb-0">
                  <i class="fas fa-chart-bar me-2"></i>
                  Gráficos de Análisis
                </h5>
              </div>
              <div class="card-body">
                <p class="text-muted">Los gráficos estarán disponibles en la próxima versión.</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Unifilar -->
        <div class="row g-4 mb-4" *ngIf="unifilarSvg()">
          <div class="col-12">
            <div class="card">
              <div class="card-header">
                <h5 class="card-title mb-0">
                  <i class="fas fa-project-diagram me-2"></i>
                  Diagrama Unifilar
                </h5>
              </div>
              <div class="card-body">
                <div class="unifilar-container" [innerHTML]="unifilarSvg()"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Tabla de Circuitos -->
        <div class="row">
          <div class="col-12">
            <div class="card">
              <div class="card-header">
                <h5 class="card-title mb-0">
                  <i class="fas fa-table me-2"></i>
                  Detalle de Circuitos
                </h5>
              </div>
              <div class="card-body p-0">
                <app-data-grid
                  [columns]="circuitosColumns"
                  [dataSourceFn]="circuitosDataSource"
                  [pageSize]="10"
                  [showSearch]="true"
                  [showPagination]="true"
                ></app-data-grid>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .resultados-container {
      padding: 2rem;
    }

    .page-header {
      margin-bottom: 2rem;
    }

    .page-title {
      color: #2c3e50;
      font-weight: 600;
      margin-bottom: 0.5rem;
    }

    .page-subtitle {
      color: #7f8c8d;
      margin-bottom: 0;
    }

    .header-actions {
      display: flex;
      gap: 0.5rem;
    }

    .loading-container,
    .error-container {
      text-align: center;
      padding: 3rem;
    }

    .stat-card {
      border: none;
      border-radius: 12px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      transition: transform 0.2s ease-in-out;
    }

    .stat-card:hover {
      transform: translateY(-2px);
    }

    .stat-card-primary {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .stat-card-success {
      background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
      color: white;
    }

    .stat-card-info {
      background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
      color: white;
    }

    .stat-card-warning {
      background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
      color: white;
    }

    .stat-icon {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 1rem;
    }

    .stat-icon i {
      font-size: 1.5rem;
    }

    .stat-content {
      flex: 1;
    }

    .stat-number {
      font-size: 2rem;
      font-weight: 700;
      margin-bottom: 0.25rem;
    }

    .stat-label {
      margin-bottom: 0;
      opacity: 0.9;
      font-size: 0.9rem;
    }

    .unifilar-container {
      text-align: center;
      overflow-x: auto;
    }

    .unifilar-container svg {
      max-width: 100%;
      height: auto;
    }

    @media (max-width: 768px) {
      .resultados-container {
        padding: 1rem;
      }

      .page-header .d-flex {
        flex-direction: column;
        align-items: flex-start !important;
        gap: 1rem;
      }

      .header-actions {
        width: 100%;
        flex-wrap: wrap;
      }

      .header-actions .btn {
        flex: 1;
        min-width: 120px;
      }

      .stat-number {
        font-size: 1.5rem;
      }
    }
  `]
})
export class ResultadosComponent implements OnInit {
  // Signals
  loading = signal(false);
  error = signal<string | null>(null);
  resultado = signal<ResultadoModelado | null>(null);
  exportando = signal(false);
  unifilarSvg = signal<string | null>(null);

  // Computed
  estadisticas = computed(() => {
    const res = this.resultado();
    if (!res) return {
      totalCircuitos: 0,
      potenciaTotal: 0,
      corrienteTotal: 0,
      ambientesCount: 0
    };
    
    return {
      totalCircuitos: res.resumen.total_circuitos,
      potenciaTotal: res.resumen.potencia_total_va,
      corrienteTotal: res.resumen.corriente_total_a,
      ambientesCount: res.resumen.ambientes_count
    };
  });



  // DataGrid columns
  circuitosColumns: DataGridColumn[] = [
    {
      key: 'ambiente_nombre',
      label: 'Ambiente',
      sortable: true,
      width: '20%'
    },
    {
      key: 'tipo',
      label: 'Tipo',
      sortable: true,
      width: '15%'
    },
    {
      key: 'potencia_va',
      label: 'Potencia (VA)',
      sortable: true,
      width: '15%',
      formatter: (value: number) => value.toLocaleString()
    },
    {
      key: 'corriente_a',
      label: 'Corriente (A)',
      sortable: true,
      width: '15%',
      formatter: (value: number) => value.toFixed(1)
    },
    {
      key: 'proteccion',
      label: 'Protección',
      sortable: false,
      width: '20%',
      formatter: (value: any) => `${value.tipo} ${value.capacidad_a}A ${value.curva}`
    },
    {
      key: 'conductor',
      label: 'Conductor',
      sortable: false,
      width: '15%',
      formatter: (value: any) => `${value.calibre_awg} ${value.material}`
    }
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private resultadosService: ResultadosService,
    private exportService: ExportService,
    private unifilarService: UnifilarService
  ) {}

  ngOnInit() {
    this.cargarResultados();
  }

  async cargarResultados() {
    const proyectoId = this.route.snapshot.paramMap.get('id');
    if (!proyectoId) {
      this.error.set('ID de proyecto no válido');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    try {
      const resultado = await this.resultadosService.getResultados(Number(proyectoId)).toPromise();
      if (!resultado) {
        throw new Error('No se pudieron cargar los resultados');
      }

      // Validar resultados
      const validacion = this.resultadosService.validarResultados(resultado);
      if (!validacion.valido) {
        throw new Error(`Errores en los resultados: ${validacion.errores.join(', ')}`);
      }

      this.resultado.set(resultado);
      this.generarUnifilar(resultado);
    } catch (err: any) {
      this.error.set(err.message || 'Error al cargar los resultados');
    } finally {
      this.loading.set(false);
    }
  }



  private generarUnifilar(resultado: ResultadoModelado) {
    try {
      const proyectoResultado = this.resultadosService.convertToProyectoResultado(resultado);
      const svg = this.unifilarService.generateUnifilar(proyectoResultado);
      this.unifilarSvg.set(svg);
    } catch (error) {
      console.error('Error al generar unifilar:', error);
    }
  }

  // DataGrid data source
  get circuitosDataSource() {
    return async (query: any) => {
      const resultado = this.resultado();
      if (!resultado) {
        return { data: [], total: 0, page: 1, pageSize: 10, totalPages: 0 };
      }

      let circuitos = [...resultado.circuitos];

      // Aplicar búsqueda
      if (query.search) {
        const search = query.search.toLowerCase();
        circuitos = circuitos.filter(c => 
          c.ambiente_nombre.toLowerCase().includes(search) ||
          c.tipo.toLowerCase().includes(search)
        );
      }

      // Aplicar ordenamiento
      if (query.sortBy) {
        circuitos.sort((a, b) => {
          const aVal = a[query.sortBy as keyof typeof a];
          const bVal = b[query.sortBy as keyof typeof b];
          
          if (typeof aVal === 'string' && typeof bVal === 'string') {
            return query.sortOrder === 'desc' ? 
              bVal.localeCompare(aVal) : 
              aVal.localeCompare(bVal);
          }
          
          return query.sortOrder === 'desc' ? 
            Number(bVal) - Number(aVal) : 
            Number(aVal) - Number(bVal);
        });
      }

      // Aplicar paginación
      const start = (query.page - 1) * query.pageSize;
      const end = start + query.pageSize;
      const data = circuitos.slice(start, end);

      return {
        data,
        total: circuitos.length,
        page: query.page,
        pageSize: query.pageSize,
        totalPages: Math.ceil(circuitos.length / query.pageSize)
      };
    };
  }

  async exportarPDF() {
    if (!this.resultado()) return;

    this.exportando.set(true);
    try {
      const proyectoResultado = this.resultadosService.convertToProyectoResultado(this.resultado()!);
      proyectoResultado.unifilarSvg = this.unifilarSvg() || undefined;
      await this.exportService.toPDF(proyectoResultado);
    } catch (error) {
      console.error('Error al exportar PDF:', error);
      alert('Error al exportar PDF');
    } finally {
      this.exportando.set(false);
    }
  }

  exportarExcel() {
    if (!this.resultado()) return;

    this.exportando.set(true);
    try {
      const proyectoResultado = this.resultadosService.convertToProyectoResultado(this.resultado()!);
      this.exportService.toExcel(proyectoResultado);
    } catch (error) {
      console.error('Error al exportar Excel:', error);
      alert('Error al exportar Excel');
    } finally {
      this.exportando.set(false);
    }
  }

  async exportarUnifilar() {
    if (!this.unifilarSvg()) return;

    this.exportando.set(true);
    try {
      const filename = `unifilar-proyecto-${this.resultado()?.proyecto.id}-${new Date().toISOString().split('T')[0]}.png`;
      await this.exportService.exportUnifilarAsImage(this.unifilarSvg()!, filename);
    } catch (error) {
      console.error('Error al exportar unifilar:', error);
      alert('Error al exportar diagrama unifilar');
    } finally {
      this.exportando.set(false);
    }
  }
}
