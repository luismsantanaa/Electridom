import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Logger,
  UseInterceptors,
  UploadedFile,
  BadRequestException
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Express } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AiService } from './ai.service';
import { ExcelIngestService } from './services/excel-ingest.service';
import { AnalyzeRequestDto } from './dto/analyze-request.dto';
import { AnalyzeResponseDto } from './dto/analyze-response.dto';
import { IngestExcelResponseDto } from './dto/ingest-excel-response.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('AI - Asistente Inteligente')
@Controller('ai')
export class AiController {
  private readonly logger = new Logger(AiController.name);

  constructor(
    private readonly aiService: AiService,
    private readonly excelIngestService: ExcelIngestService
  ) {}

  @Post('analyze')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Analizar resultados de cálculo con IA',
    description:
      'Utiliza OpenAI para analizar los resultados de un cálculo eléctrico y proporcionar recomendaciones basadas en normativas dominicanas.',
  })
  @ApiBody({
    type: AnalyzeRequestDto,
    description: 'Datos del cálculo a analizar',
    examples: {
      ejemplo_basico: {
        summary: 'Análisis básico',
        value: {
          input: {
            system: { voltage: 120, phases: 1, frequency: 60 },
            superficies: [{ name: 'Sala', area: 25, type: 'residencial' }],
            consumos: [
              { name: 'TV', power: 100, quantity: 1, type: 'iluminacion' },
            ],
          },
          output: {
            rooms: { totalArea: 25, totalLoads: 1 },
            demand: { totalDemand: 100, demandFactor: 1.0 },
            circuits: { totalCircuits: 1, maxLoadPerCircuit: 100 },
          },
        },
      },
      ejemplo_con_pregunta: {
        summary: 'Análisis con pregunta específica',
        value: {
          input: {
            system: { voltage: 120, phases: 1, frequency: 60 },
            superficies: [{ name: 'Cocina', area: 15, type: 'residencial' }],
            consumos: [
              {
                name: 'Refrigerador',
                power: 800,
                quantity: 1,
                type: 'electrodomestico',
              },
            ],
          },
          output: {
            rooms: { totalArea: 15, totalLoads: 1 },
            demand: { totalDemand: 800, demandFactor: 1.0 },
            circuits: { totalCircuits: 1, maxLoadPerCircuit: 800 },
          },
          question: '¿Es adecuado el calibre del conductor para esta carga?',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Análisis completado exitosamente',
    type: AnalyzeResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Datos de entrada inválidos',
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado',
  })
  @ApiResponse({
    status: 429,
    description: 'Demasiadas solicitudes',
  })
  @ApiResponse({
    status: 500,
    description: 'Error interno del servidor',
  })
  async analyze(
    @Body() payload: AnalyzeRequestDto,
  ): Promise<AnalyzeResponseDto> {
    this.logger.log('Solicitud de análisis de IA recibida');

    try {
      const result = await this.aiService.analyze(payload);
      this.logger.log('Análisis de IA completado exitosamente');
      return result;
    } catch (error) {
      this.logger.error(`Error en análisis de IA: ${error.message}`);
      throw error;
    }
  }

  @Post('ingest/excel')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({
    summary: 'Ingestar archivo Excel y normalizar a JSON',
    description: 'Sube un archivo Excel con datos de cálculo eléctrico y lo convierte al formato JSON requerido por el sistema.'
  })
  @ApiResponse({
    status: 200,
    description: 'Archivo procesado exitosamente',
    type: IngestExcelResponseDto
  })
  @ApiResponse({
    status: 400,
    description: 'Archivo inválido o formato incorrecto'
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado'
  })
  @ApiResponse({
    status: 500,
    description: 'Error interno del servidor'
  })
  async ingestExcel(@UploadedFile() file: Express.Multer.File): Promise<IngestExcelResponseDto> {
    this.logger.log('Solicitud de ingesta de Excel recibida');

    if (!file) {
      throw new BadRequestException('No se proporcionó ningún archivo');
    }

    // Validar tipo de archivo
    const allowedMimeTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'application/octet-stream' // Para algunos navegadores
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('Solo se permiten archivos Excel (.xlsx, .xls)');
    }

    // Validar tamaño del archivo (máximo 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new BadRequestException('El archivo es demasiado grande. Máximo 5MB');
    }

    try {
      // Guardar archivo temporalmente
      const tempPath = `./temp_${Date.now()}_${file.originalname}`;
      require('fs').writeFileSync(tempPath, file.buffer);

      // Procesar archivo
      const result = await this.excelIngestService.processExcelFile(tempPath);

      this.logger.log(`Ingesta de Excel completada: ${result.message}`);

      return {
        success: result.success,
        data: result.data,
        message: result.message,
        errors: result.errors,
        rowsProcessed: result.rowsProcessed,
        rowsWithErrors: result.rowsWithErrors
      };

    } catch (error) {
      this.logger.error(`Error en ingesta de Excel: ${error.message}`);
      throw error;
    }
  }
}
