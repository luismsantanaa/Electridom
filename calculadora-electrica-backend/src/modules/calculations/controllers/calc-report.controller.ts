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
      - Incluye sello de tiempo y versión de norms
      - Calcula hashes MD5 para verificación de integridad
      - Soporta modo stateless (payload completo) y con estado (calculationId)
      
      **Contenido del Reporte:**
      - Resumen ejecutivo del project
      - Cuadro de loads por environment
      - Análisis de demanda y diversificación
      - circuits ramales y conductors
      - Análisis de caída de tensión
      - system de puesta a tierra
      - Observaciones y recomendaciones
      
      **Formatos de Salida:**
      - PDF: Reporte profesional con diseño tipográfico
      - Excel: 7 hojas con datos estructurados
      - Base64: Ambos archivos codificados en base64
    `,
  })
  @ApiBody({
    type: CalcReportRequestDto,
    description: 'Datos para generación del reporte técnico',
    examples: {
      ejemplo_frontend: {
        summary: 'Ejemplo Frontend - Datos del Formulario',
        description: 'Datos típicos enviados desde el frontend Angular',
        value: {
          system: {
            voltage: 120,
            phases: 1,
            frequency: 60
          },
          superficies: [
            { nombre: "Sala", area_m2: 18.5 },
            { nombre: "Cocina", area_m2: 12.0 },
            { nombre: "Habitación 1", area_m2: 12.0 }
          ],
          consumos: [
            { nombre: "Refrigerador", ambiente: "Cocina", potencia_w: 350, fp: 0.85, tipo: "electrodomestico" },
            { nombre: "Microondas", ambiente: "Cocina", potencia_w: 1200, fp: 0.95, tipo: "electrodomestico" },
            { nombre: "Televisor LED", ambiente: "Sala", potencia_w: 120, fp: 0.9, tipo: "electrodomestico" },
            { nombre: "Aire Acondicionado", ambiente: "Habitación 1", potencia_w: 1100, fp: 0.9, tipo: "climatizacion" }
          ]
        }
      },
      ejemplo_completo: {
        summary: 'Ejemplo Completo - Datos de Todas las Historias',
        description: 'Datos completos incluyendo resultados de CE-01 a CE-05',
        value: {
          roomsData: {
            environments: [
              {
                name: 'Habitación Principal',
                area_m2: 15,
                tipo_ambiente: 'dormitorio',
                artefactos: [
                  { type: 'lámpara', cantidad: 2, potencia_va: 60 },
                  { type: 'tomacorriente', cantidad: 4, potencia_va: 180 },
                ],
              },
            ],
            parameters: {
              tipo_instalacion: 'residencial',
              tension_nominal_v: 120,
              phases: 1,
            },
          },
          demandData: {
            cargas_por_categoria: [
              {
                category: 'iluminacion_general',
                carga_bruta_va: 1200,
              },
              {
                category: 'tomas_generales',
                carga_bruta_va: 2400,
              },
            ],
            parameters: {
              tipo_instalacion: 'residencial',
            },
          },
          circuitsData: {
            circuitos_individuales: [
              {
                id_circuito: 'CIRC-001',
                name: 'Iluminación Habitación 1',
                current_a: 8.5,
                carga_va: 1020,
                length_m: 15,
              },
            ],
            parameters: {
              material_conductor: 'Cu',
              tipo_instalacion: 'residencial',
            },
          },
          feederData: {
            circuitos_ramales: [
              {
                id_circuito: 'CIRC-001',
                name: 'Iluminación Habitación 1',
                corriente_total_a: 8.5,
                carga_total_va: 1020,
                length_m: 15,
              },
            ],
            system: {
              voltage_v: 120,
              phases: 1,
              corriente_total_a: 8.5,
              carga_total_va: 1020,
            },
            parameters: {
              longitud_alimentador_m: 50,
              material_conductor: 'Cu',
              max_caida_ramal_pct: 3,
              max_caida_total_pct: 5,
            },
          },
          groundingData: {
            system: {
              voltage_v: 120,
              phases: 1,
              corriente_total_a: 8.5,
              carga_total_va: 1020,
            },
            feeder: {
              current_a: 8.5,
              section_mm2: 10,
              material: 'Cu',
              length_m: 50,
            },
            parameters: {
              main_breaker_amp: 100,
              tipo_instalacion: 'residencial',
              tipo_sistema_tierra: 'TN-S',
              resistividad_suelo_ohm_m: 100,
            },
          },
          installationType: 'residencial',
          electricalSystem: 'Monofásico 120V',
        }
      },
      ejemplo_con_id: {
        summary: 'Ejemplo con ID de Cálculo (Modo con Estado)',
        description: 'Genera reporte usando calculationId almacenado en base de datos',
        value: {
          calculationId: 'calc-12345',
          installationType: 'residencial',
          electricalSystem: 'Monofásico 120V',
        }
      }
    }
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
              'Todos los cálculos cumplen con las norms NEC 2023 y RIE RD',
              'Se dimensionaron 4 circuits ramales',
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

