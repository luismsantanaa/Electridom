import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { DataGridComponent, DataGridColumn, DataGridAction } from '../../shared/components/data-grid/data-grid.component';
import { ProjectsService, Project } from '../../core/services/projects.service';

@Component({
  selector: 'app-proyectos-list',
  standalone: true,
  imports: [CommonModule, RouterModule, DataGridComponent],
  template: `
    <div class="proyectos-container">
      <!-- Header -->
      <div class="page-header">
        <div class="d-flex justify-content-between align-items-center">
          <div>
            <h1 class="page-title">
              <i class="fas fa-project-diagram me-2"></i>
              Proyectos
            </h1>
            <p class="page-subtitle">
              Gestiona todos tus proyectos eléctricos
            </p>
          </div>
          <div class="header-actions">
            <a routerLink="/proyectos/nuevo" class="btn btn-primary">
              <i class="fas fa-plus me-2"></i>
              Nuevo Proyecto
            </a>
          </div>
        </div>
      </div>

      <!-- DataGrid -->
      <div class="card">
        <div class="card-body p-0">
          <app-data-grid
            [columns]="columns"
            [dataSourceFn]="dataSourceFn"
            [actions]="actions"
            [pageSize]="25"
            [showSearch]="true"
            [showPagination]="true"
            (onView)="onViewProject($event)"
            (onEdit)="onEditProject($event)"
            (onDelete)="onDeleteProject($event)"
            (onAction)="onActionClick($event)"
          ></app-data-grid>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .proyectos-container {
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
      gap: 1rem;
    }

    .card {
      border: none;
      border-radius: 12px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }

    @media (max-width: 768px) {
      .proyectos-container {
        padding: 1rem;
      }

      .page-header .d-flex {
        flex-direction: column;
        align-items: flex-start !important;
        gap: 1rem;
      }

      .header-actions {
        width: 100%;
      }

      .header-actions .btn {
        width: 100%;
      }
    }
  `]
})
export class ProyectosListComponent implements OnInit {
  columns: DataGridColumn[] = [
    {
      key: 'name',
      label: 'Nombre',
      sortable: true,
      width: '30%'
    },
    {
      key: 'description',
      label: 'Descripción',
      sortable: false,
      width: '25%',
      formatter: (value: string) => value ? (value.length > 50 ? value.substring(0, 50) + '...' : value) : '-'
    },
    {
      key: 'status',
      label: 'Estado',
      sortable: true,
      width: '15%',
      formatter: (value: string) => this.formatStatus(value)
    },
    {
      key: 'createdAt',
      label: 'Fecha Creación',
      type: 'date',
      sortable: true,
      width: '20%'
    }
  ];

  actions: DataGridAction[] = [
    {
      label: 'Ver',
      icon: 'fas fa-eye',
      type: 'view',
      color: 'info'
    },
    {
      label: 'Resultados',
      icon: 'fas fa-chart-bar',
      type: 'custom',
      color: 'success'
    },
    {
      label: 'Editar',
      icon: 'fas fa-edit',
      type: 'edit',
      color: 'warning'
    },
    {
      label: 'Eliminar',
      icon: 'fas fa-trash',
      type: 'delete',
      color: 'danger',
      disabled: (item: Project) => item.status === 'ARCHIVED'
    }
  ];

  constructor(
    private projectsService: ProjectsService,
    private router: Router
  ) {}

  ngOnInit() {
    // El DataGrid se inicializa automáticamente
  }

  get dataSourceFn() {
    return this.projectsService.getDataGridDataSource();
  }

  onViewProject(project: Project) {
    console.log('Ver proyecto:', project);
    // Aquí iría la navegación al detalle del proyecto
    // this.router.navigate(['/proyectos', project.id]);
  }

  onActionClick(event: { action: string; item: Project }) {
    if (event.action === 'custom') {
      // Navegar a resultados
      this.router.navigate(['/proyectos', event.item.id, 'resultados']);
    }
  }

  onEditProject(project: Project) {
    console.log('Editar proyecto:', project);
    // Aquí iría la navegación a la edición del proyecto
    // this.router.navigate(['/proyectos', project.id, 'editar']);
  }

  onDeleteProject(project: Project) {
    console.log('Eliminar proyecto:', project);
    // Aquí iría la confirmación y eliminación del proyecto
    if (confirm(`¿Estás seguro de que quieres eliminar el proyecto "${project.name}"?`)) {
      this.projectsService.delete(project.id).subscribe({
        next: () => {
          console.log('Proyecto eliminado exitosamente');
          // Recargar el DataGrid
          // this.dataGrid?.loadData();
        },
        error: (error) => {
          console.error('Error al eliminar proyecto:', error);
          alert('Error al eliminar el proyecto');
        }
      });
    }
  }

  private formatStatus(status: string): string {
    switch (status) {
      case 'ACTIVE':
        return '<span class="badge bg-success">Activo</span>';
      case 'INACTIVE':
        return '<span class="badge bg-warning">Inactivo</span>';
      case 'ARCHIVED':
        return '<span class="badge bg-secondary">Archivado</span>';
      default:
        return '<span class="badge bg-info">Desconocido</span>';
    }
  }
}
