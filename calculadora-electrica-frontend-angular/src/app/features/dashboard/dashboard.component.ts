import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ProjectsService } from '../../core/services/projects.service';

interface DashboardStats {
  totalProjects: number;
  activeProjects: number;
  totalCalculations: number;
  totalExports: number;
  // Métricas avanzadas para HU15.1
  totalPowerVA: number;
  totalCurrentA: number;
  averageCircuitCount: number;
  validationIssues: number;
  recentActivity: Array<{
    id: string;
    type: 'project' | 'calculation' | 'export' | 'validation';
    title: string;
    timestamp: string;
    status: string;
    details?: string;
  }>;
  // Gráficos y métricas
  projectsByType: Array<{type: string, count: number}>;
  powerDistribution: Array<{range: string, count: number}>;
  validationSummary: {
    valid: number;
    warnings: number;
    errors: number;
  };
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="dashboard-container">
      <!-- Header -->
      <div class="dashboard-header">
        <h1 class="dashboard-title">
          <i class="fas fa-tachometer-alt me-2"></i>
          Dashboard
        </h1>
        <p class="dashboard-subtitle">
          Resumen general de la aplicación
        </p>
      </div>

      <!-- Stats Cards -->
      <div class="row g-4 mb-4">
        <div class="col-xl-3 col-md-6">
          <div class="card stat-card stat-card-primary">
            <div class="card-body">
              <div class="d-flex align-items-center">
                <div class="stat-icon">
                  <i class="fas fa-project-diagram"></i>
                </div>
                <div class="stat-content">
                  <h3 class="stat-number">{{ stats().totalProjects }}</h3>
                  <p class="stat-label">Proyectos Totales</p>
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
                  <i class="fas fa-check-circle"></i>
                </div>
                <div class="stat-content">
                  <h3 class="stat-number">{{ stats().activeProjects }}</h3>
                  <p class="stat-label">Proyectos Activos</p>
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
                  <i class="fas fa-calculator"></i>
                </div>
                <div class="stat-content">
                  <h3 class="stat-number">{{ stats().totalCalculations }}</h3>
                  <p class="stat-label">Cálculos Realizados</p>
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
                  <i class="fas fa-file-export"></i>
                </div>
                <div class="stat-content">
                  <h3 class="stat-number">{{ stats().totalExports }}</h3>
                  <p class="stat-label">Exportaciones</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Métricas Avanzadas HU15.1 -->
      <div class="row g-4 mb-4">
        <div class="col-xl-3 col-md-6">
          <div class="card stat-card stat-card-info">
            <div class="card-body">
              <div class="d-flex align-items-center">
                <div class="stat-icon">
                  <i class="fas fa-bolt"></i>
                </div>
                <div class="stat-content">
                  <h3 class="stat-number">{{ stats().totalPowerVA | number:'1.0-0' }}</h3>
                  <p class="stat-label">Potencia Total (VA)</p>
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
                  <h3 class="stat-number">{{ stats().totalCurrentA | number:'1.1-1' }}</h3>
                  <p class="stat-label">Corriente Total (A)</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="col-xl-3 col-md-6">
          <div class="card stat-card stat-card-primary">
            <div class="card-body">
              <div class="d-flex align-items-center">
                <div class="stat-icon">
                  <i class="fas fa-sitemap"></i>
                </div>
                <div class="stat-content">
                  <h3 class="stat-number">{{ stats().averageCircuitCount | number:'1.1-1' }}</h3>
                  <p class="stat-label">Promedio Circuitos</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="col-xl-3 col-md-6">
          <div class="card stat-card stat-card-danger">
            <div class="card-body">
              <div class="d-flex align-items-center">
                <div class="stat-icon">
                  <i class="fas fa-exclamation-triangle"></i>
                </div>
                <div class="stat-content">
                  <h3 class="stat-number">{{ stats().validationIssues }}</h3>
                  <p class="stat-label">Problemas Validación</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Gráficos y Métricas Visuales -->
      <div class="row g-4 mb-4">
        <div class="col-lg-6">
          <div class="card">
            <div class="card-header">
              <h5 class="card-title mb-0">
                <i class="fas fa-chart-pie me-2"></i>
                Proyectos por Tipo
              </h5>
            </div>
            <div class="card-body">
              <div class="chart-container">
                <div class="chart-item" *ngFor="let item of stats().projectsByType">
                  <div class="chart-label">{{ item.type }}</div>
                  <div class="chart-bar">
                    <div class="chart-fill" [style.width.%]="getPercentage(item.count, stats().totalProjects)"></div>
                  </div>
                  <div class="chart-value">{{ item.count }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="col-lg-6">
          <div class="card">
            <div class="card-header">
              <h5 class="card-title mb-0">
                <i class="fas fa-chart-bar me-2"></i>
                Distribución de Potencia
              </h5>
            </div>
            <div class="card-body">
              <div class="chart-container">
                <div class="chart-item" *ngFor="let item of stats().powerDistribution">
                  <div class="chart-label">{{ item.range }}</div>
                  <div class="chart-bar">
                    <div class="chart-fill" [style.width.%]="getPercentage(item.count, stats().totalProjects)"></div>
                  </div>
                  <div class="chart-value">{{ item.count }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Resumen de Validaciones -->
      <div class="row g-4 mb-4">
        <div class="col-12">
          <div class="card">
            <div class="card-header">
              <h5 class="card-title mb-0">
                <i class="fas fa-shield-alt me-2"></i>
                Resumen de Validaciones
              </h5>
            </div>
            <div class="card-body">
              <div class="row">
                <div class="col-md-4">
                  <div class="validation-item validation-valid">
                    <div class="validation-icon">
                      <i class="fas fa-check-circle"></i>
                    </div>
                    <div class="validation-content">
                      <h4>{{ stats().validationSummary.valid }}</h4>
                      <p>Proyectos Válidos</p>
                    </div>
                  </div>
                </div>
                <div class="col-md-4">
                  <div class="validation-item validation-warning">
                    <div class="validation-icon">
                      <i class="fas fa-exclamation-triangle"></i>
                    </div>
                    <div class="validation-content">
                      <h4>{{ stats().validationSummary.warnings }}</h4>
                      <p>Con Advertencias</p>
                    </div>
                  </div>
                </div>
                <div class="col-md-4">
                  <div class="validation-item validation-error">
                    <div class="validation-icon">
                      <i class="fas fa-times-circle"></i>
                    </div>
                    <div class="validation-content">
                      <h4>{{ stats().validationSummary.errors }}</h4>
                      <p>Con Errores</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="row g-4 mb-4">
        <div class="col-12">
          <div class="card">
            <div class="card-header">
              <h5 class="card-title mb-0">
                <i class="fas fa-bolt me-2"></i>
                Acciones Rápidas
              </h5>
            </div>
            <div class="card-body">
              <div class="row g-3">
                <div class="col-md-3">
                  <a routerLink="/proyectos" class="btn btn-primary w-100">
                    <i class="fas fa-plus me-2"></i>
                    Nuevo Proyecto
                  </a>
                </div>
                <div class="col-md-3">
                  <a routerLink="/calculos" class="btn btn-info w-100">
                    <i class="fas fa-calculator me-2"></i>
                    Realizar Cálculo
                  </a>
                </div>
                <div class="col-md-3">
                  <a routerLink="/exportaciones" class="btn btn-success w-100">
                    <i class="fas fa-file-export me-2"></i>
                    Exportar Datos
                  </a>
                </div>
                <div class="col-md-3">
                  <a routerLink="/normativas" class="btn btn-warning w-100">
                    <i class="fas fa-book me-2"></i>
                    Ver Normativas
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Recent Activity -->
      <div class="row">
        <div class="col-12">
          <div class="card">
            <div class="card-header">
              <h5 class="card-title mb-0">
                <i class="fas fa-history me-2"></i>
                Actividad Reciente
              </h5>
            </div>
            <div class="card-body">
              <div class="activity-list" *ngIf="stats().recentActivity.length > 0; else noActivity">
                <div 
                  *ngFor="let activity of stats().recentActivity" 
                  class="activity-item"
                >
                  <div class="activity-icon">
                    <i 
                      class="fas"
                      [class.fa-project-diagram]="activity.type === 'project'"
                      [class.fa-calculator]="activity.type === 'calculation'"
                      [class.fa-file-export]="activity.type === 'export'"
                    ></i>
                  </div>
                  <div class="activity-content">
                    <h6 class="activity-title">{{ activity.title }}</h6>
                    <p class="activity-meta">
                      {{ activity.timestamp | date:'short' }} • 
                      <span class="badge" [class]="getStatusClass(activity.status)">
                        {{ activity.status }}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
              <ng-template #noActivity>
                <div class="text-center text-muted py-4">
                  <i class="fas fa-inbox fa-3x mb-3"></i>
                  <p>No hay actividad reciente</p>
                </div>
              </ng-template>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-container {
      padding: 2rem;
    }

    .dashboard-header {
      margin-bottom: 2rem;
    }

    .dashboard-title {
      color: #2c3e50;
      font-weight: 600;
      margin-bottom: 0.5rem;
    }

    .dashboard-subtitle {
      color: #7f8c8d;
      margin-bottom: 0;
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

    .activity-list {
      max-height: 400px;
      overflow-y: auto;
    }

    .activity-item {
      display: flex;
      align-items: center;
      padding: 1rem 0;
      border-bottom: 1px solid #e9ecef;
    }

    .activity-item:last-child {
      border-bottom: none;
    }

    .activity-icon {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: #f8f9fa;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 1rem;
      color: #6c757d;
    }

    .activity-content {
      flex: 1;
    }

    .activity-title {
      margin-bottom: 0.25rem;
      font-weight: 600;
    }

    .activity-meta {
      margin-bottom: 0;
      font-size: 0.875rem;
      color: #6c757d;
    }

    .badge {
      font-size: 0.75rem;
    }

    .badge-success {
      background-color: #28a745;
    }

    .badge-warning {
      background-color: #ffc107;
      color: #212529;
    }

    .badge-danger {
      background-color: #dc3545;
    }

    .badge-info {
      background-color: #17a2b8;
    }

    @media (max-width: 768px) {
      .dashboard-container {
        padding: 1rem;
      }

      .stat-number {
        font-size: 1.5rem;
      }

      .activity-item {
        flex-direction: column;
        align-items: flex-start;
      }

      .activity-icon {
        margin-bottom: 0.5rem;
        margin-right: 0;
      }
    }
  `]
})
export class DashboardComponent implements OnInit {
  stats = signal<DashboardStats>({
    totalProjects: 0,
    activeProjects: 0,
    totalCalculations: 0,
    totalExports: 0,
    // Métricas avanzadas HU15.1
    totalPowerVA: 0,
    totalCurrentA: 0,
    averageCircuitCount: 0,
    validationIssues: 0,
    // Gráficos y métricas
    projectsByType: [],
    powerDistribution: [],
    validationSummary: {
      valid: 0,
      warnings: 0,
      errors: 0
    },
    recentActivity: []
  });

  constructor(private projectsService: ProjectsService) {}

  ngOnInit() {
    this.loadDashboardStats();
  }

  getPercentage(value: number, total: number): number {
    if (total === 0) return 0;
    return Math.round((value / total) * 100);
  }

  private loadDashboardStats() {
    // Cargar estadísticas de proyectos
    this.projectsService.getStats().subscribe({
      next: (projectStats) => {
        this.stats.update(current => ({
          ...current,
          totalProjects: projectStats.total,
          activeProjects: projectStats.active
        }));
      },
      error: (error) => {
        console.error('Error loading project stats:', error);
      }
    });

    // Mock data para cálculos y exportaciones con métricas avanzadas HU15.1
    this.stats.update(current => ({
      ...current,
      totalCalculations: 156,
      totalExports: 23,
      // Métricas avanzadas
      totalPowerVA: 45600,
      totalCurrentA: 380.5,
      averageCircuitCount: 8.2,
      validationIssues: 7,
      // Gráficos y métricas
      projectsByType: [
        { type: 'Residencial', count: 12 },
        { type: 'Comercial', count: 8 },
        { type: 'Industrial', count: 3 },
        { type: 'Institucional', count: 2 }
      ],
      powerDistribution: [
        { range: '0-5kVA', count: 8 },
        { range: '5-15kVA', count: 10 },
        { range: '15-30kVA', count: 5 },
        { range: '30kVA+', count: 2 }
      ],
      validationSummary: {
        valid: 18,
        warnings: 5,
        errors: 2
      },
      recentActivity: [
        {
          id: '1',
          type: 'project',
          title: 'Proyecto Residencial San Juan',
          timestamp: new Date().toISOString(),
          status: 'Completado',
          details: 'Proyecto completado con 12 circuitos'
        },
        {
          id: '2',
          type: 'validation',
          title: 'Validación normativa completada',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          status: 'Advertencia',
          details: '3 advertencias detectadas'
        },
        {
          id: '3',
          type: 'export',
          title: 'Exportación PDF con unifilar',
          timestamp: new Date(Date.now() - 7200000).toISOString(),
          status: 'Completado',
          details: 'Reporte con diagrama SVG'
        }
      ]
    }));
  }

  getStatusClass(status: string): string {
    switch (status.toLowerCase()) {
      case 'completado':
        return 'badge-success';
      case 'en proceso':
        return 'badge-warning';
      case 'error':
        return 'badge-danger';
      default:
        return 'badge-info';
    }
  }
}
