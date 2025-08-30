import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { ExportsService } from '../../../../core/services/exports/exports.service';
import { AppDataGridComponent, ColumnDef, ActionDef, GridParams, GridResponse } from '../../../../shared/ui/app-data-grid/app-data-grid.component';
import { Export, ExportStatus, ExportType } from '../../../../shared/types/export.types';
import { HasRoleDirective } from '../../../../shared/directives/has-role.directive';
import { UserRole } from '../../../../shared/types/user.types';

@Component({
  selector: 'app-export-list',
  standalone: true,
  imports: [CommonModule, AppDataGridComponent, HasRoleDirective],
  templateUrl: './export-list.page.html',
  styleUrls: ['./export-list.page.scss']
})
export class ExportListPage implements OnInit {

  columns: ColumnDef[] = [
    { key: 'id', header: 'ID', sortable: false },
    { key: 'projectName', header: 'Proyecto', sortable: true },
    { key: 'type', header: 'Tipo', sortable: true },
    { key: 'scope', header: 'Alcance', sortable: true },
    { key: 'status', header: 'Estado', sortable: true },
    { key: 'createdAt', header: 'Fecha', sortable: true }
  ];

  actions: ActionDef[] = [
    {
      label: 'Descargar',
      icon: 'download',
      onClick: (row: any) => this.downloadExport(row.id),
      disabled: (row: any) => row.status !== 'completed'
    },
    {
      label: 'Eliminar',
      icon: 'trash',
      onClick: (row: any) => this.deleteExport(row.id),
      confirm: true,
      disabled: (row: any) => row.status === 'processing'
    }
  ];

  constructor(private exportsService: ExportsService) {}

  ngOnInit(): void {
  }

  fetch(params: GridParams): Observable<GridResponse<Export>> {
    return this.exportsService.listExports(params);
  }

  downloadExport(exportItem: Export): void {
    this.exportsService.downloadExport(exportItem.id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = exportItem.filename || `export-${exportItem.id}.${exportItem.type.toLowerCase()}`;
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: (error) => {
        console.error('Error descargando exportación:', error);
        // Mostrar mensaje de error al usuario
      }
    });
  }

  deleteExport(exportItem: Export): void {
    if (confirm(`¿Está seguro de que desea eliminar la exportación "${exportItem.projectName}"?`)) {
      this.exportsService.deleteExport(exportItem.id).subscribe({
        next: () => {
          console.log('Exportación eliminada exitosamente');
          // El grid se recargará automáticamente
        },
        error: (error) => {
          console.error('Error eliminando exportación:', error);
          // Mostrar mensaje de error al usuario
        }
      });
    }
  }

  getStatusBadgeClass(status: ExportStatus): string {
    switch (status) {
      case ExportStatus.COMPLETED:
        return 'badge bg-success';
      case ExportStatus.PROCESSING:
        return 'badge bg-warning';
      case ExportStatus.PENDING:
        return 'badge bg-info';
      case ExportStatus.FAILED:
        return 'badge bg-danger';
      default:
        return 'badge bg-secondary';
    }
  }

  getTypeIcon(type: ExportType): string {
    switch (type) {
      case ExportType.PDF:
        return 'file-pdf';
      case ExportType.EXCEL:
        return 'file-excel';
      case ExportType.JSON:
        return 'file-code';
      default:
        return 'file';
    }
  }
}
