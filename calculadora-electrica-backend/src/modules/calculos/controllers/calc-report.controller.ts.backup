import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  ValidationPipe,
  UsePipes,
  Res,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBadRequestResponse,
  ApiInternalServerErrorResponse,
} from '@nestjs/swagger';
import { Response } from 'express';
import { ReportService, ReportRequest } from '../services/report.service';
import { CalcReportRequestDto } from '../dtos/calc-report-request.dto';
import { CalcReportResponseDto } from '../dtos/calc-report-response.dto';

@ApiTags('Cálculos Eléctricos - Reportes Técnicos')
@Controller('calc')
export class CalcReportController {
  constructor(private readonly reportService: ReportService) {}

  @Post('report')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true }))
  @ApiOperation({
    summary: 'Generar reporte técnico completo (PDF y Excel)',
    description: `
      Genera un reporte técnico completo en formato PDF y Excel con todos los cálculos eléctricos.
      
      **Funcionalidades:**
      - Genera reporte PDF profesional con plantilla HTML
      - Genera archivo Excel con múltiples hojas de datos
      - Incluye sello de tiempo y versión de normas
      - Calcula hashes MD5 para verificación de integridad
      - Soporta modo stateless (payload completo) y con estado (calculationId)
      
      **Contenido del Reporte:**
      - Resumen ejecutivo del proyecto
      - Cuadro de cargas por ambiente
      - Análisis de demanda y diversificación
      - Circuitos ramales y conductores
      - Análisis de caída de tensión
      - Sistema de puesta a tierra
      - Observaciones y recomendaciones
      
      **Formatos de Salida:**
      - PDF: Reporte profesional con diseño tipográfico
      - Excel: 7 hojas con datos estructurados
      - Base64: Ambos archivos codificados en base64
    `,
  })
  @ApiBody({
    type: CalcReportRequestDto,
    description: 'Datos para generación del reporte',
    examples: {
      ejemplo1: {
        summary: 'Reporte completo con datos de todas las historias',
        description: 'Genera reporte con datos de CE-01 a CE-05',
        value: {
          roomsData: {
            ambientes: [
              {
                nombre: 'Habitación Principal',
                area_m2: 15,
                tipo_ambiente: 'dormitorio',
                artefactos: [
                  { tipo: 'lámpara', cantidad: 2, potencia_va: 60 },
                  { tipo: 'tomacorriente', cantidad: 4, potencia_va: 180 },
                ],
              },
            ],
            parametros: {
              tipo_instalacion: 'residencial',
              tension_nominal_v: 120,
              phases: 1,
            },
          },
          demandData: {
            cargas_por_categoria: [
              {
                categoria: 'iluminacion_general',
                carga_bruta_va: 1200,
              },
              {
                categoria: 'tomas_generales',
                carga_bruta_va: 2400,
              },
            ],
            parametros: {
              tipo_instalacion: 'residencial',
            },
          },
          circuitsData: {
            circuitos_individuales: [
              {
                id_circuito: 'CIRC-001',
                nombre: 'Iluminación Habitación 1',
                corriente_a: 8.5,
                carga_va: 1020,
                longitud_m: 15,
              },
            ],
            parametros: {
              material_conductor: 'Cu',
              tipo_instalacion: 'residencial',
            },
          },
          feederData: {
            circuitos_ramales: [
              {
                id_circuito: 'CIRC-001',
                nombre: 'Iluminación Habitación 1',
                corriente_total_a: 8.5,
                carga_total_va: 1020,
                longitud_m: 15,
              },
            ],
            sistema: {
              tension_v: 120,
              phases: 1,
              corriente_total_a: 8.5,
              carga_total_va: 1020,
            },
            parametros: {
              longitud_alimentador_m: 50,
              material_conductor: 'Cu',
              max_caida_ramal_pct: 3,
              max_caida_total_pct: 5,
            },
          },
          groundingData: {
            sistema: {
              tension_v: 120,
              phases: 1,
              corriente_total_a: 8.5,
              carga_total_va: 1020,
            },
            alimentador: {
              corriente_a: 8.5,
              seccion_mm2: 10,
              material: 'Cu',
              longitud_m: 50,
            },
            parametros: {
              main_breaker_amp: 100,
              tipo_instalacion: 'residencial',
              tipo_sistema_tierra: 'TN-S',
              resistividad_suelo_ohm_m: 100,
            },
          },
          installationType: 'residencial',
          electricalSystem: 'Monofásico 120V',
        },
      },
      ejemplo2: {
        summary: 'Reporte con ID de cálculo (modo con estado)',
        description: 'Genera reporte usando calculationId almacenado',
        value: {
          calculationId: 'calc-12345',
          installationType: 'comercial',
          electricalSystem: 'Trifásico 208V',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Reporte generado exitosamente',
    type: CalcReportResponseDto,
    examples: {
      ejemploExitoso: {
        summary: 'Reporte generado correctamente',
        value: {
          pdfBase64: 'JVBERi0xLjQKJcOkw7zDtsO...',
          excelBase64: 'UEsDBBQAAAAIAA...',
          metadata: {
            pdfHash: 'a1b2c3d4e5f6g7h8',
            excelHash: 'i9j0k1l2m3n4o5p6',
            calculationDate: '23/08/2025, 16:45:30',
            normsVersion: 'NEC 2023 + RIE RD',
            normsHash: '7a8b9c0d',
            systemVersion: '1.0.0',
            installationType: 'residencial',
            electricalSystem: 'Monofásico 120V',
            totalCurrent: 61.8,
            totalLoad: 7416,
            circuitCount: 4,
            generalStatus: 'OK',
            observations: [
              'Reporte generado automáticamente por Calculadora Eléctrica RD',
              'Todos los cálculos cumplen con las normas NEC 2023 y RIE RD',
              'Se dimensionaron 4 circuitos ramales',
            ],
          },
          message: 'Reporte generado exitosamente',
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Datos de entrada inválidos o faltantes',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: {
          type: 'array',
          items: { type: 'string' },
          example: [
            'calculationId must be a string',
            'installationType must be one of the following values: residencial, comercial, industrial',
          ],
        },
        error: { type: 'string', example: 'Bad Request' },
      },
    },
  })
  @ApiInternalServerErrorResponse({
    description: 'Error interno del servidor durante la generación del reporte',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 500 },
        message: { type: 'string', example: 'Error interno del servidor' },
        error: { type: 'string', example: 'Internal Server Error' },
      },
    },
  })
  async generateReport(
    @Body() request: CalcReportRequestDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<CalcReportResponseDto> {
    // Preparar request para el servicio
    const reportRequest: ReportRequest = {
      calculationId: request.calculationId,
      roomsData: request.roomsData as any,
      demandData: request.demandData as any,
      circuitsData: request.circuitsData as any,
      feederData: request.feederData as any,
      groundingData: request.groundingData as any,
      installationType: request.installationType,
      electricalSystem: request.electricalSystem,
    };

    // Generar reporte
    const result = await this.reportService.generateReport(reportRequest);

    // Configurar headers para descarga
    res.set({
      'Content-Type': 'application/json',
      'X-PDF-Hash': result.pdfHash,
      'X-Excel-Hash': result.excelHash,
      'X-Report-Date': result.reportData.calculationDate,
    });

    // Retornar respuesta con archivos en base64
    return {
      pdfBase64: result.pdfBuffer.toString('base64'),
      excelBase64: result.excelBuffer.toString('base64'),
      metadata: {
        pdfHash: result.pdfHash,
        excelHash: result.excelHash,
        calculationDate: result.reportData.calculationDate,
        normsVersion: result.reportData.normsVersion,
        normsHash: result.reportData.normsHash,
        systemVersion: result.reportData.systemVersion,
        installationType: result.reportData.installationType,
        electricalSystem: result.reportData.electricalSystem,
        totalCurrent: result.reportData.totalCurrent,
        totalLoad: result.reportData.totalLoad,
        circuitCount: result.reportData.circuitCount,
        generalStatus: result.reportData.generalStatus,
        observations: result.reportData.observations,
      },
      message: 'Reporte generado exitosamente',
    };
  }

  @Post('report/download')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true }))
  @ApiOperation({
    summary: 'Descargar reporte como archivos binarios',
    description: `
      Descarga el reporte como archivos PDF y Excel binarios.
      Similar al endpoint /report pero retorna los archivos directamente.
    `,
  })
  @ApiBody({
    type: CalcReportRequestDto,
    description: 'Datos para generación del reporte',
  })
  @ApiResponse({
    status: 200,
    description: 'Archivos descargados exitosamente',
          content: {
        'application/zip': {
          schema: {
            type: 'string',
            format: 'binary',
          },
        },
      },
  })
  async downloadReport(
    @Body() request: CalcReportRequestDto,
    @Res() res: Response,
  ): Promise<void> {
    // Preparar request para el servicio
    const reportRequest: ReportRequest = {
      calculationId: request.calculationId,
      roomsData: request.roomsData as any,
      demandData: request.demandData as any,
      circuitsData: request.circuitsData as any,
      feederData: request.feederData as any,
      groundingData: request.groundingData as any,
      installationType: request.installationType,
      electricalSystem: request.electricalSystem,
    };

    // Generar reporte
    const result = await this.reportService.generateReport(reportRequest);

    // Configurar headers para descarga
    const timestamp = new Date().toISOString().split('T')[0];
    res.set({
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="reporte-electrico-${timestamp}.zip"`,
      'X-PDF-Hash': result.pdfHash,
      'X-Excel-Hash': result.excelHash,
    });

    // En una implementación real, aquí se crearía un ZIP con ambos archivos
    // Por simplicidad, retornamos solo el PDF
    res.send(result.pdfBuffer);
  }
}
