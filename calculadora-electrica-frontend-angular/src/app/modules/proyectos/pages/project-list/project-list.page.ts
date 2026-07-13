import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { AppDataGridComponent, ColumnDef, ActionDef, GridParams, GridResponse } from '../../../../shared/ui/app-data-grid/app-data-grid.component';
import { ProjectsService } from '../../../../core/services/projects/projects.service';
import { Project } from '../../../../shared/types/project.types';

@Component({
  selector: 'app-project-list',
  templateUrl: './project-list.page.html',
  styleUrls: ['./project-list.page.scss'],
  imports: [CommonModule, AppDataGridComponent],
  standalone: true
})
export class ProjectListPage implements OnInit {
  columns: ColumnDef[] = [
    { key: 'name', header: 'Nombre', sortable: true },
    { key: 'owner', header: 'Propietario', sortable: true },
    { key: 'apparentPowerKVA', header: 'kVA', sortable: true },
    { key: 'circuits', header: 'Circuitos', sortable: true },
    { 
      key: 'updatedAt', 
      header: 'Actualizado', 
      sortable: true,
      cell: (row: Project) => new Date(row.updatedAt).toLocaleDateString('es-ES')
    },
  ];

  actions: ActionDef[] = [
    { 
      label: 'Ver', 
      icon: 'eye', 
      onClick: (row: Project) => this.router.navigate(['/proyectos/detail', row.id]) 
    },
    { 
      label: 'Editar', 
      icon: 'edit', 
      onClick: (row: Project) => this.router.navigate(['/proyectos/edit', row.id]) 
    },
    { 
      label: 'Eliminar', 
      icon: 'trash', 
      confirm: true, 
      onClick: (row: Project) => this.deleteProject(row.id) 
    },
  ];

  constructor(
    private projectsService: ProjectsService,
    private router: Router
  ) { }

  ngOnInit(): void {
  }

  fetch(params: GridParams): Observable<GridResponse<Project>> {
    return this.projectsService.list(params);
  }

  onRowClick(project: Project): void {
    this.router.navigate(['/proyectos/detail', project.id]);
  }

  onNewProject(): void {
    this.router.navigate(['/proyectos/new']);
  }

  private deleteProject(id: string): void {
    this.projectsService.delete(id).subscribe({
      next: () => {
        // El grid se recargará automáticamente
        console.log('Proyecto eliminado exitosamente');
      },
      error: (error) => {
        console.error('Error al eliminar proyecto:', error);
        // Aquí podrías mostrar un toast o notificación de error
      }
    });
  }
}
