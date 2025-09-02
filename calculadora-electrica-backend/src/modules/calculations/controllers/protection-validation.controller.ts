import { Controller, Get, Param, ParseIntPipe, Res, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { Response } from 'express';
import { ProtectionValidationService, ValidationResult } from '../services/protection-validation.service';
import { UnifilarExportService } from '../services/unifilar-export.service';

@ApiTags('Validación y Exportación de Protecciones')
@Controller('api')
export class ProtectionValidationController {
  constructor(
    private readonly protectionValidationService: ProtectionValidationService,
    private readonly unifilarExportService: UnifilarExportService,
  ) {}

  @Get('protections/validate/:projectId')
  @ApiOperation({ summary: 'Validar protecciones de un proyecto contra normativas' })
  @ApiParam({ name: 'projectId', description: 'ID del proyecto', type: 'number' })
  @ApiResponse({ 
    status: 200, 
    description: 'Resultado de validación de protecciones'
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Proyecto no encontrado' 
  })
  async validateProjectProtections(
    @Param('projectId', ParseIntPipe) projectId: number
  ): Promise<ValidationResult> {
    return this.protectionValidationService.validateProjectProtections(projectId);
  }

  @Get('export/unifilar/:projectId')
  @ApiOperation({ summary: 'Exportar diagrama unifilar en formato JSON' })
  @ApiParam({ name: 'projectId', description: 'ID del proyecto', type: 'number' })
  @ApiResponse({ 
    status: 200, 
    description: 'Diagrama unifilar en formato JSON' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Proyecto no encontrado' 
  })
  async exportUnifilar(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Res() res: Response
  ): Promise<void> {
    try {
      const unifilar = await this.unifilarExportService.generateUnifilar(projectId);
      
      // Configurar headers para descarga
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="unifilar-proyecto-${projectId}.json"`);
      
      // Enviar respuesta
      res.status(HttpStatus.OK).json(unifilar);
    } catch (error) {
      res.status(HttpStatus.NOT_FOUND).json({
        error: 'Proyecto no encontrado',
        message: error.message
      });
    }
  }

  @Get('export/unifilar/:projectId/simplified')
  @ApiOperation({ summary: 'Exportar diagrama unifilar simplificado para visualización' })
  @ApiParam({ name: 'projectId', description: 'ID del proyecto', type: 'number' })
  @ApiResponse({ 
    status: 200, 
    description: 'Diagrama unifilar simplificado' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Proyecto no encontrado' 
  })
  async exportSimplifiedUnifilar(
    @Param('projectId', ParseIntPipe) projectId: number
  ): Promise<any> {
    return this.unifilarExportService.generateSimplifiedUnifilar(projectId);
  }

  @Get('export/unifilar/:projectId/validate')
  @ApiOperation({ summary: 'Validar coherencia del diagrama unifilar' })
  @ApiParam({ name: 'projectId', description: 'ID del proyecto', type: 'number' })
  @ApiResponse({ 
    status: 200, 
    description: 'Resultado de validación del diagrama unifilar' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Proyecto no encontrado' 
  })
  async validateUnifilar(
    @Param('projectId', ParseIntPipe) projectId: number
  ): Promise<{ isValid: boolean; errors: string[] }> {
    const unifilar = await this.unifilarExportService.generateUnifilar(projectId);
    return this.unifilarExportService.validateUnifilar(unifilar);
  }

  @Get('export/symbols')
  @ApiOperation({ summary: 'Obtener símbolos IEC/UNE disponibles' })
  @ApiResponse({ 
    status: 200, 
    description: 'Lista de símbolos eléctricos disponibles' 
  })
  async getAvailableSymbols(): Promise<any> {
    return this.unifilarExportService.getAvailableSymbols();
  }

  @Get('validation/rules')
  @ApiOperation({ summary: 'Obtener reglas de validación aplicadas' })
  @ApiResponse({ 
    status: 200, 
    description: 'Reglas de validación y normativas' 
  })
  async getValidationRules(): Promise<any> {
    return this.protectionValidationService.getValidationRules();
  }
}
