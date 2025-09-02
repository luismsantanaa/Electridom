import { Controller, Get, Param, ParseIntPipe, Query, Res, HttpStatus, HttpException, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { Response } from 'express';
import { UnifilarAdvancedExportService, ExportOptions } from '../services/unifilar-advanced-export.service';

@ApiTags('Exportación Avanzada de Diagramas Unifilares')
@Controller('api/export/unifilar/advanced')
export class UnifilarAdvancedExportController {
  constructor(
    private readonly unifilarAdvancedExportService: UnifilarAdvancedExportService,
  ) {}

  @Get(':projectId')
  @ApiOperation({ 
    summary: 'Exportar diagrama unifilar avanzado con balance de fases',
    description: 'Genera exportación avanzada del diagrama unifilar incluyendo balance de fases, distribución de paneles y opciones de formato PDF/JSON'
  })
  @ApiParam({ 
    name: 'projectId', 
    description: 'ID del proyecto', 
    type: 'number' 
  })
  @ApiQuery({ 
    name: 'format', 
    description: 'Formato de exportación', 
    enum: ['pdf', 'json'],
    required: false,
    example: 'json'
  })
  @ApiQuery({ 
    name: 'pageSize', 
    description: 'Tamaño de página para PDF', 
    enum: ['A3', 'A4', 'Letter'],
    required: false,
    example: 'A3'
  })
  @ApiQuery({ 
    name: 'orientation', 
    description: 'Orientación para PDF', 
    enum: ['vertical', 'horizontal'],
    required: false,
    example: 'vertical'
  })
  @ApiQuery({ 
    name: 'includeMetadata', 
    description: 'Incluir metadatos completos', 
    type: 'boolean',
    required: false,
    example: true
  })
  @ApiQuery({ 
    name: 'includeSymbols', 
    description: 'Incluir definiciones de símbolos', 
    type: 'boolean',
    required: false,
    example: true
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Diagrama unifilar avanzado exportado exitosamente',
    schema: {
      oneOf: [
        {
          type: 'object',
          description: 'Respuesta JSON con diagrama unifilar avanzado'
        },
        {
          type: 'string',
          format: 'binary',
          description: 'Archivo PDF del diagrama unifilar'
        }
      ]
    }
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Parámetros de exportación inválidos' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Proyecto no encontrado' 
  })
  @ApiResponse({ 
    status: 500, 
    description: 'Error interno del servidor' 
  })
  async exportAdvancedUnifilar(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Query('format') format: string = 'json',
    @Query('pageSize') pageSize: string = 'A3',
    @Query('orientation') orientation: string = 'vertical',
    @Query('includeMetadata') includeMetadata: string = 'true',
    @Query('includeSymbols') includeSymbols: string = 'true',
    @Res() res: Response
  ): Promise<void> {
    try {
      // Validar parámetros
      if (!['pdf', 'json'].includes(format)) {
        throw new HttpException('Formato inválido. Debe ser "pdf" o "json"', HttpStatus.BAD_REQUEST);
      }

      if (!['A3', 'A4', 'Letter'].includes(pageSize)) {
        throw new HttpException('Tamaño de página inválido', HttpStatus.BAD_REQUEST);
      }

      if (!['vertical', 'horizontal'].includes(orientation)) {
        throw new HttpException('Orientación inválida', HttpStatus.BAD_REQUEST);
      }

      // Configurar opciones de exportación
      const exportOptions: ExportOptions = {
        format: format as 'pdf' | 'json',
        includeMetadata: includeMetadata === 'true',
        includeSymbols: includeSymbols === 'true',
        pageSize: pageSize as 'A3' | 'A4' | 'Letter',
        orientation: orientation as 'vertical' | 'horizontal'
      };

      this.logger.log(`Exportando unifilar avanzado para proyecto ${projectId}, formato: ${format}`);

      // Generar exportación
      const result = await this.unifilarAdvancedExportService.generateAdvancedUnifilar(
        projectId,
        exportOptions
      );

      if (format === 'pdf') {
        // Configurar headers para descarga de PDF
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="unifilar-avanzado-proyecto-${projectId}.pdf"`);
        res.setHeader('Content-Length', (result as Buffer).length);
        
        // Enviar PDF
        res.status(HttpStatus.OK).send(result);
      } else {
        // Configurar headers para descarga de JSON
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="unifilar-avanzado-proyecto-${projectId}.json"`);
        
        // Enviar JSON
        res.status(HttpStatus.OK).json(result);
      }

      this.logger.log(`Exportación completada exitosamente para proyecto ${projectId}`);

    } catch (error) {
      this.logger.error(`Error en exportación avanzada: ${error.message}`, error.stack);

      if (error instanceof HttpException) {
        throw error;
      }

      if (error.message.includes('no encontrado')) {
        throw new HttpException('Proyecto no encontrado', HttpStatus.NOT_FOUND);
      }

      throw new HttpException(
        'Error interno del servidor durante la exportación',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get(':projectId/validate')
  @ApiOperation({ 
    summary: 'Validar diagrama unifilar avanzado',
    description: 'Valida la coherencia y balance de fases del diagrama unifilar avanzado'
  })
  @ApiParam({ 
    name: 'projectId', 
    description: 'ID del proyecto', 
    type: 'number' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Resultado de validación del diagrama unifilar avanzado',
    schema: {
      type: 'object',
      properties: {
        isValid: { type: 'boolean' },
        errors: { 
          type: 'array',
          items: { type: 'string' }
        }
      }
    }
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Proyecto no encontrado' 
  })
  async validateAdvancedUnifilar(
    @Param('projectId', ParseIntPipe) projectId: number
  ): Promise<{ isValid: boolean; errors: string[] }> {
    try {
      this.logger.log(`Validando unifilar avanzado para proyecto ${projectId}`);

      // Generar unifilar avanzado para validación
      const unifilar = await this.unifilarAdvancedExportService.generateAdvancedUnifilar(
        projectId,
        { format: 'json' }
      ) as any;

      // Validar
      const validation = this.unifilarAdvancedExportService.validateAdvancedUnifilar(unifilar);

      this.logger.log(`Validación completada para proyecto ${projectId}. Válido: ${validation.isValid}`);

      return validation;

    } catch (error) {
      this.logger.error(`Error en validación avanzada: ${error.message}`, error.stack);

      if (error.message.includes('no encontrado')) {
        throw new HttpException('Proyecto no encontrado', HttpStatus.NOT_FOUND);
      }

      throw new HttpException(
        'Error interno del servidor durante la validación',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get(':projectId/phase-balance')
  @ApiOperation({ 
    summary: 'Obtener balance de fases del diagrama unifilar',
    description: 'Retorna información detallada sobre el balance de fases del proyecto'
  })
  @ApiParam({ 
    name: 'projectId', 
    description: 'ID del proyecto', 
    type: 'number' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Información del balance de fases',
    schema: {
      type: 'object',
      properties: {
        totalLoad: {
          type: 'object',
          properties: {
            A: { type: 'number' },
            B: { type: 'number' },
            C: { type: 'number' }
          }
        },
        maxImbalance: { type: 'number' },
        isBalanced: { type: 'boolean' },
        recommendations: {
          type: 'array',
          items: { type: 'string' }
        }
      }
    }
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Proyecto no encontrado' 
  })
  async getPhaseBalance(
    @Param('projectId', ParseIntPipe) projectId: number
  ): Promise<any> {
    try {
      this.logger.log(`Obteniendo balance de fases para proyecto ${projectId}`);

      // Generar unifilar avanzado para obtener balance de fases
      const unifilar = await this.unifilarAdvancedExportService.generateAdvancedUnifilar(
        projectId,
        { format: 'json' }
      ) as any;

      const phaseBalance = unifilar.phaseBalance;

      this.logger.log(`Balance de fases obtenido para proyecto ${projectId}`);

      return phaseBalance;

    } catch (error) {
      this.logger.error(`Error obteniendo balance de fases: ${error.message}`, error.stack);

      if (error.message.includes('no encontrado')) {
        throw new HttpException('Proyecto no encontrado', HttpStatus.NOT_FOUND);
      }

      throw new HttpException(
        'Error interno del servidor al obtener balance de fases',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  private readonly logger = new Logger(UnifilarAdvancedExportController.name);
}
