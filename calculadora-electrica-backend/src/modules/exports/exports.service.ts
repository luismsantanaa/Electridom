import { Injectable, NotFoundException } from '@nestjs/common';
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

  async createExport(dto: CreateExportDto): Promise<void> {
    // TODO: Implementar lógica real de creación de exportación
    // Por ahora solo simulamos la creación
    console.log('Creando exportación:', dto);

    // Simular procesamiento asíncrono
    setTimeout(() => {
      console.log('Exportación completada para proyecto:', dto.projectId);
    }, 5000);
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
