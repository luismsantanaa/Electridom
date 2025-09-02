import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { Response } from 'express';
import {
  ListExportsQueryDto,
  ExportListResponseDto,
  ExportResponseDto,
  CreateExportDto,
  ExportType,
  ExportStatus,
} from './dtos/export.dto';

@Injectable()
export class ExportsService {
  private readonly logger = new Logger(ExportsService.name);

  // Datos mock para Sprint 9 - en producción vendría de una base de datos
  private readonly mockExports: ExportResponseDto[] = [
    {
      id: '1',
      projectId: 'uuid-1',
      projectName: 'Residencia García',
      type: ExportType.PDF,
      scope: 'Cálculo completo con planos',
      status: ExportStatus.COMPLETED,
      createdAt: '2025-01-15T10:30:00Z',
      completedAt: '2025-01-15T10:35:00Z',
      filename: 'residencia-garcia-calculo.pdf',
      fileSize: 1024000,
    },
    {
      id: '2',
      projectId: 'uuid-2',
      projectName: 'Oficina Central',
      type: ExportType.EXCEL,
      scope: 'Memoria de cálculo',
      status: ExportStatus.COMPLETED,
      createdAt: '2025-01-14T15:20:00Z',
      completedAt: '2025-01-14T15:25:00Z',
      filename: 'oficina-central-memoria.xlsx',
      fileSize: 512000,
    },
    {
      id: '3',
      projectId: 'uuid-3',
      projectName: 'Centro Comercial Plaza',
      type: ExportType.PDF,
      scope: 'Planos técnicos',
      status: ExportStatus.PROCESSING,
      createdAt: '2025-01-15T11:00:00Z',
      filename: undefined,
      fileSize: undefined,
    },
    {
      id: '4',
      projectId: 'uuid-1',
      projectName: 'Residencia García',
      type: ExportType.JSON,
      scope: 'Datos completos del proyecto',
      status: ExportStatus.COMPLETED,
      createdAt: '2025-01-13T09:15:00Z',
      completedAt: '2025-01-13T09:16:00Z',
      filename: 'residencia-garcia-data.json',
      fileSize: 256000,
    },
    {
      id: '5',
      projectId: 'uuid-4',
      projectName: 'Hospital Regional',
      type: ExportType.PDF,
      scope: 'Especificaciones técnicas',
      status: ExportStatus.FAILED,
      createdAt: '2025-01-12T14:30:00Z',
      filename: undefined,
      fileSize: undefined,
    },
  ];

  async listExports(
    query: ListExportsQueryDto,
  ): Promise<ExportListResponseDto> {
    const { page = 1, pageSize = 10 } = query;

    // Calcular paginación
    const total = this.mockExports.length;
    const totalPages = Math.ceil(total / pageSize);
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const data = this.mockExports.slice(startIndex, endIndex);

    return {
      data,
      total,
      page,
      pageSize,
      totalPages,
    };
  }

  async createExport(dto: CreateExportDto): Promise<ExportResponseDto> {
    try {
      // Generar ID único para la exportación
      const exportId = this.generateExportId();
      
      // Crear objeto de exportación
      const newExport: ExportResponseDto = {
        id: exportId,
        projectId: dto.projectId,
        projectName: dto.projectName || `Proyecto ${dto.projectId}`,
        type: dto.type,
        scope: dto.scope || 'Exportación completa',
        status: ExportStatus.PENDING,
        createdAt: new Date().toISOString(),
        filename: undefined,
        fileSize: undefined,
      };
      
      // Agregar a la lista de exportaciones
      this.mockExports.push(newExport);
      
      // Simular procesamiento asíncrono
      this.processExportAsync(exportId, dto);
      
      return newExport;
    } catch (error) {
      this.logger.error(`Error creando exportación: ${error.message}`);
      throw new Error(`Error creando exportación: ${error.message}`);
    }
  }

  /**
   * Procesa la exportación de forma asíncrona
   */
  private async processExportAsync(exportId: string, dto: CreateExportDto): Promise<void> {
    try {
      // Simular tiempo de procesamiento
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Actualizar estado a PROCESSING
      const exportItem = this.mockExports.find(e => e.id === exportId);
      if (exportItem) {
        exportItem.status = ExportStatus.PROCESSING;
      }
      
      // Simular más tiempo de procesamiento
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Completar la exportación
      if (exportItem) {
        exportItem.status = ExportStatus.COMPLETED;
        exportItem.completedAt = new Date().toISOString();
        exportItem.filename = this.generateFilename(dto.projectName || `Proyecto ${dto.projectId}`, dto.type);
        exportItem.fileSize = this.generateFileSize(dto.type);
      }
      
      this.logger.log(`Exportación ${exportId} completada exitosamente`);
    } catch (error) {
      // Marcar como fallida si hay error
      const exportItem = this.mockExports.find(e => e.id === exportId);
      if (exportItem) {
        exportItem.status = ExportStatus.FAILED;
      }
      
      this.logger.error(`Error procesando exportación ${exportId}: ${error.message}`);
    }
  }

  /**
   * Genera un ID único para la exportación
   */
  private generateExportId(): string {
    return `export-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Genera un nombre de archivo para la exportación
   */
  private generateFilename(projectName: string, type: ExportType): string {
    const timestamp = new Date().toISOString().split('T')[0];
    const sanitizedName = projectName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
    
    switch (type) {
      case ExportType.PDF:
        return `${sanitizedName}-${timestamp}.pdf`;
      case ExportType.EXCEL:
        return `${sanitizedName}-${timestamp}.xlsx`;
      case ExportType.JSON:
        return `${sanitizedName}-${timestamp}.json`;
      default:
        return `${sanitizedName}-${timestamp}.txt`;
    }
  }

  /**
   * Genera un tamaño de archivo simulado
   */
  private generateFileSize(type: ExportType): number {
    switch (type) {
      case ExportType.PDF:
        return Math.floor(Math.random() * 5000000) + 1000000; // 1-6 MB
      case ExportType.EXCEL:
        return Math.floor(Math.random() * 2000000) + 500000;  // 0.5-2.5 MB
      case ExportType.JSON:
        return Math.floor(Math.random() * 1000000) + 100000;  // 0.1-1.1 MB
      default:
        return Math.floor(Math.random() * 1000000) + 100000;  // 0.1-1.1 MB
    }
  }

  async downloadExport(id: string, res: Response): Promise<void> {
    const exportItem = this.mockExports.find((e) => e.id === id);

    if (!exportItem) {
      throw new NotFoundException(`Exportación con ID "${id}" no encontrada`);
    }

    if (exportItem.status !== ExportStatus.COMPLETED) {
      throw new NotFoundException('La exportación no está completada');
    }

    // Simular descarga de archivo
    res.setHeader('Content-Type', this.getContentType(exportItem.type));
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${exportItem.filename}"`,
    );
    res.setHeader('Content-Length', exportItem.fileSize?.toString() || '0');

    // Enviar contenido mock
    res.send('Contenido del archivo de exportación (mock)');
  }

  async deleteExport(id: string): Promise<void> {
    const exportIndex = this.mockExports.findIndex((e) => e.id === id);

    if (exportIndex === -1) {
      throw new NotFoundException(`Exportación con ID "${id}" no encontrada`);
    }

    // Simular eliminación
    this.mockExports.splice(exportIndex, 1);
  }

  private getContentType(type: ExportType): string {
    switch (type) {
      case ExportType.PDF:
        return 'application/pdf';
      case ExportType.EXCEL:
        return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      case ExportType.JSON:
        return 'application/json';
      default:
        return 'application/octet-stream';
    }
  }
}
