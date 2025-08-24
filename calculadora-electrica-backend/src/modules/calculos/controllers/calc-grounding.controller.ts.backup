import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  ValidationPipe,
  UsePipes,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBadRequestResponse,
  ApiInternalServerErrorResponse,
} from '@nestjs/swagger';
import { GroundingService } from '../services/grounding.service';
import { CalcGroundingRequestDto } from '../dtos/calc-grounding-request.dto';
import { CalcGroundingResponseDto } from '../dtos/calc-grounding-response.dto';

@ApiTags('Cálculos Eléctricos - Puesta a Tierra y Protección')
@Controller('calc')
export class CalcGroundingController {
  constructor(private readonly groundingService: GroundingService) {}

  @Post('grounding/preview')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true }))
  @ApiOperation({
    summary: 'Dimensionamiento de puesta a tierra y conductores de protección',
    description: `
      Dimensiona conductores de protección (EGC) y tierra (GEC) según el amperaje del breaker principal.
      
      **Funcionalidades:**
      - Dimensiona conductor de protección (EGC) según NEC 250.66
      - Dimensiona conductor de tierra (GEC) según normas aplicables
      - Configura sistema de puesta a tierra según tipo de instalación
      - Determina número y tipo de electrodos requeridos
      - Valida cumplimiento de normas de seguridad
      
      **Tipos de instalación soportados:**
      - Residencial (≤25Ω)
      - Comercial (≤5Ω)
      - Industrial (≤1Ω)
      
      **Sistemas de tierra soportados:**
      - TN-S (Tierra Neutral Separada)
      - TN-C-S (Tierra Neutral Combinada-Separada)
      - TT (Tierra-Tierra)
      - IT (Aislada-Tierra)
    `,
  })
  @ApiBody({
    type: CalcGroundingRequestDto,
    description: 'Datos del sistema eléctrico y parámetros de puesta a tierra',
    examples: {
      ejemplo1: {
        summary: 'Ejemplo residencial',
        description: 'Dimensionamiento para instalación residencial',
        value: {
          sistema: {
            tension_v: 120,
            phases: 1,
            corriente_total_a: 61.8,
            carga_total_va: 7416,
          },
          alimentador: {
            corriente_a: 61.8,
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
          observaciones: [
            'Instalación residencial monofásica',
            'Sistema TN-S estándar',
          ],
        },
      },
      ejemplo2: {
        summary: 'Ejemplo comercial',
        description: 'Dimensionamiento para instalación comercial',
        value: {
          sistema: {
            tension_v: 208,
            phases: 3,
            corriente_total_a: 150.0,
            carga_total_va: 54000,
          },
          alimentador: {
            corriente_a: 150.0,
            seccion_mm2: 25,
            material: 'Cu',
            longitud_m: 80,
          },
          parametros: {
            main_breaker_amp: 200,
            tipo_instalacion: 'comercial',
            tipo_sistema_tierra: 'TN-C-S',
            resistividad_suelo_ohm_m: 50,
          },
          observaciones: [
            'Instalación comercial trifásica',
            'Sistema TN-C-S con múltiples electrodos',
          ],
        },
      },
      ejemplo3: {
        summary: 'Ejemplo industrial',
        description: 'Dimensionamiento para instalación industrial',
        value: {
          sistema: {
            tension_v: 480,
            phases: 3,
            corriente_total_a: 500.0,
            carga_total_va: 240000,
          },
          alimentador: {
            corriente_a: 500.0,
            seccion_mm2: 95,
            material: 'Cu',
            longitud_m: 120,
          },
          parametros: {
            main_breaker_amp: 600,
            tipo_instalacion: 'industrial',
            tipo_sistema_tierra: 'TT',
            resistividad_suelo_ohm_m: 25,
          },
          observaciones: [
            'Instalación industrial de alta potencia',
            'Sistema TT con malla de tierra',
          ],
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Dimensionamiento de puesta a tierra completado exitosamente',
    type: CalcGroundingResponseDto,
    examples: {
      ejemploExitoso: {
        summary: 'Dimensionamiento exitoso',
        value: {
          conductor_proteccion: {
            tipo: 'EGC',
            seccion_mm2: 10,
            calibre_awg: '8',
            material: 'Cu',
            longitud_minima_m: 3,
            observaciones: [
              'Conductor de protección para breaker de 100A',
              'Sección mínima requerida: 10mm² (8 AWG)',
            ],
          },
          conductor_tierra: {
            tipo: 'GEC',
            seccion_mm2: 16,
            calibre_awg: '6',
            material: 'Cu',
            longitud_minima_m: 3,
            observaciones: [
              'Conductor de tierra para breaker de 100A',
              'Sección mínima requerida: 16mm² (6 AWG)',
            ],
          },
          sistema_tierra: {
            tipo_sistema: 'TN-S',
            resistencia_maxima_ohm: 25,
            numero_electrodos: 1,
            tipo_electrodo: 'Varilla de cobre',
            longitud_electrodo_m: 2.4,
            separacion_electrodos_m: 0,
            observaciones: [
              'Sistema TN-S para instalación residencial',
              'Resistencia máxima: 25Ω',
              '1 electrodo(s) de Varilla de cobre',
            ],
          },
          resumen: {
            main_breaker_amp: 100,
            tipo_instalacion: 'residencial',
            tipo_sistema_tierra: 'TN-S',
            egc_mm2: 10,
            gec_mm2: 16,
            resistencia_maxima_ohm: 25,
            estado: 'ESTÁNDAR',
            cumplimiento_normas: 'NEC 250.66',
          },
          observaciones_generales: [
            'Sistema de puesta a tierra para breaker de 100A',
            'EGC: 10mm² (8 AWG)',
            'GEC: 16mm² (6 AWG)',
            'Sistema TN-S con 1 electrodo(s)',
            'Resistencia máxima: 25Ω',
          ],
          metadata: {
            version: '1.0',
            timestamp: '2024-01-20T10:30:00.000Z',
            duracion_calculo_ms: 25,
            algoritmo_usado: 'grounding_sizing_with_normative_rules',
          },
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
            'main_breaker_amp must be a positive number',
            'tension_v must be a positive number',
          ],
        },
        error: { type: 'string', example: 'Bad Request' },
      },
    },
  })
  @ApiInternalServerErrorResponse({
    description: 'Error interno del servidor durante el cálculo',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 500 },
        message: { type: 'string', example: 'Error interno del servidor' },
        error: { type: 'string', example: 'Internal Server Error' },
      },
    },
  })
  async sizeGrounding(
    @Body() request: CalcGroundingRequestDto,
  ): Promise<CalcGroundingResponseDto> {
    return this.groundingService.size(request);
  }
}
