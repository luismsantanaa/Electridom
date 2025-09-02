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
import { VoltageDropService } from '../services/voltage-drop.service';
import { CalcFeederRequestDto } from '../dtos/calc-feeder-request.dto';
import { CalcFeederResponseDto } from '../dtos/calc-feeder-response.dto';

@ApiTags('Cálculos Eléctricos - feeder y Caída de Tensión')
@Controller('calc')
export class CalcFeederController {
  constructor(private readonly voltageDropService: VoltageDropService) {}

  @Post('feeder/preview')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true }))
  @ApiOperation({
    summary: 'Análisis de caída de tensión y selección de feeder',
    description: `
      Analiza la caída de tensión en circuits ramales y feeder principal.

      **Funcionalidades:**
      - Calcula caída de tensión en cada circuit ramal
      - Selecciona calibre del feeder considerando límites
      - Determina longitud crítica máxima
      - Valida cumplimiento de límites (3% ramal, 5% total por defecto)

      **Parámetros configurables:**
      - Límites de caída de tensión desde norm_const
      - material del conductor (Cu, Al)
      - Longitudes de circuits y feeder
    `,
  })
  @ApiBody({
    type: CalcFeederRequestDto,
    description: 'Datos de circuits ramales y parámetros de instalación',
    examples: {
      ejemplo1: {
        summary: 'Ejemplo con circuits residenciales',
        description:
          'Análisis de caída de tensión para instalación residencial',
        value: {
          circuitos_ramales: [
            {
              id_circuito: 'CIRC-001',
              name: 'Iluminación Habitación 1',
              corriente_total_a: 8.5,
              carga_total_va: 1020,
              length_m: 15,
            },
            {
              id_circuito: 'CIRC-002',
              name: 'Enchufes Habitación 1',
              corriente_total_a: 12.3,
              carga_total_va: 1476,
              length_m: 18,
            },
            {
              id_circuito: 'CIRC-003',
              name: 'Cocina',
              corriente_total_a: 25.8,
              carga_total_va: 3096,
              length_m: 25,
            },
            {
              id_circuito: 'CIRC-004',
              name: 'Aire Acondicionado',
              corriente_total_a: 15.2,
              carga_total_va: 1824,
              length_m: 30,
            },
          ],
          system: {
            voltage_v: 120,
            phases: 1,
            corriente_total_a: 61.8,
            carga_total_va: 7416,
          },
          parameters: {
            longitud_alimentador_m: 50,
            material_conductor: 'Cu',
            max_caida_ramal_pct: 3,
            max_caida_total_pct: 5,
          },
          observaciones: [
            'Instalación residencial monofásica',
            'feeder desde medidor hasta panel principal',
          ],
        },
      },
      ejemplo2: {
        summary: 'Ejemplo con longitudes grandes',
        description: 'Análisis con circuits de longitud crítica',
        value: {
          circuitos_ramales: [
            {
              id_circuito: 'CIRC-001',
              name: 'Iluminación Exterior',
              corriente_total_a: 5.2,
              carga_total_va: 624,
              length_m: 80,
            },
            {
              id_circuito: 'CIRC-002',
              name: 'Bomba de Agua',
              corriente_total_a: 18.5,
              carga_total_va: 2220,
              length_m: 120,
            },
          ],
          system: {
            voltage_v: 240,
            phases: 1,
            corriente_total_a: 23.7,
            carga_total_va: 2844,
          },
          parameters: {
            longitud_alimentador_m: 200,
            material_conductor: 'Cu',
            max_caida_ramal_pct: 2.5,
            max_caida_total_pct: 4,
          },
          observaciones: [
            'Instalación rural con longitudes críticas',
            'Requerimientos estrictos de caída de tensión',
          ],
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Análisis de caída de tensión completado exitosamente',
    type: CalcFeederResponseDto,
    examples: {
      ejemploExitoso: {
        summary: 'Análisis exitoso',
        value: {
          circuitos_analisis: [
            {
              id_circuito: 'CIRC-001',
              name: 'Iluminación Habitación 1',
              current_a: 8.5,
              length_m: 15,
              caida_tension_ramal_v: 1.89,
              caida_tension_ramal_pct: 1.58,
              estado: 'OK',
            },
            {
              id_circuito: 'CIRC-002',
              name: 'Enchufes Habitación 1',
              current_a: 12.3,
              length_m: 18,
              caida_tension_ramal_v: 4.11,
              caida_tension_ramal_pct: 3.43,
              estado: 'WARNING',
              observaciones: ['Cerca del límite de 3% en ramal'],
            },
          ],
          feeder: {
            corriente_total_a: 61.8,
            length_m: 50,
            material: 'Cu',
            section_mm2: 10,
            resistencia_ohm_km: 1.83,
            caida_tension_alimentador_v: 5.66,
            caida_tension_alimentador_pct: 4.72,
            caida_tension_total_max_pct: 7.72,
            longitud_critica_m: 63.7,
            estado: 'WARNING',
            observaciones: ['Cerca del límite de 5% total'],
          },
          resumen: {
            tension_nominal_v: 120,
            phases: 1,
            limite_caida_ramal_pct: 3,
            limite_caida_total_pct: 5,
            caida_total_maxima_pct: 7.72,
            circuitos_fuera_limite: 0,
            estado_general: 'WARNING',
            calibre_minimo_recomendado_mm2: 10,
          },
          observaciones_generales: [
            'Análisis de 4 circuits ramales',
            'feeder: Cu 10mm² para 50m',
            '⚠️ 1 circuit(s) exceden límites',
            '⚠️ feeder excede límite de caída de tensión',
            'Longitud crítica máxima: 63.7m',
          ],
          metadata: {
            version: '1.0',
            timestamp: '2024-01-20T10:30:00.000Z',
            duracion_calculo_ms: 45,
            algoritmo_usado: 'voltage_drop_analysis_with_feeder_selection',
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
            'corriente_total_a must be a positive number',
            'longitud_alimentador_m must be a positive number',
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
  async analyzeVoltageDrop(
    @Body() request: CalcFeederRequestDto,
  ): Promise<CalcFeederResponseDto> {
    // TODO: Implementar análisis de caída de tensión con el nuevo VoltageDropService
    throw new Error('Método no implementado en la nueva versión del servicio');
  }
}
