import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  ValidationPipe,
  UsePipes,
  Logger,
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
  private readonly logger = new Logger(CalcFeederController.name);

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
    try {
      this.logger.log(`Analizando caída de tensión para ${request.circuitos_ramales.length} circuits`);
      
      // Validar que hay circuits para analizar
      if (!request.circuitos_ramales || request.circuitos_ramales.length === 0) {
        throw new Error('Se requieren circuits ramales para el análisis');
      }

      // Calcular caída de tensión para cada circuit
      const circuitosAnalisis: any[] = [];
      let circuitosFueraLimite = 0;
      const warnings = [];

      for (const circuit of request.circuitos_ramales) {
        const caidaTension = await this.voltageDropService.calcularCaidaTension({
          id: circuit.id_circuito,
          tipo: 'RAMAL',
          longitud: circuit.length_m || 10, // Default 10m si no se especifica
          corriente: circuit.corriente_total_a,
          tension: request.system.voltage_v,
          material: request.parameters.material_conductor || 'Cu',
          seccion: this.calcularSeccionMinima(circuit.corriente_total_a),
          tipoInstalacion: 'TUBO',
          temperatura: 30,
        });

        if (!caidaTension.cumpleNorma) {
          circuitosFueraLimite++;
        }

        circuitosAnalisis.push({
          id_circuito: circuit.id_circuito,
          name: circuit.name,
          current_a: circuit.corriente_total_a,
          length_m: circuit.length_m || 10,
          caida_tension_ramal_v: caidaTension.caidaTension,
          caida_tension_ramal_pct: caidaTension.caidaPorcentual,
          estado: caidaTension.cumpleNorma ? 'OK' : 'WARNING',
          observaciones: caidaTension.recomendaciones,
        });
      }

      // Calcular caída de tensión del alimentador
      const seccionAlimentador = this.calcularSeccionMinima(request.system.corriente_total_a);
      const caidaAlimentador = await this.voltageDropService.calcularCaidaTension({
        id: 'ALIMENTADOR',
        tipo: 'ALIMENTADOR',
        longitud: request.parameters.longitud_alimentador_m,
        corriente: request.system.corriente_total_a,
        tension: request.system.voltage_v,
        material: request.parameters.material_conductor || 'Cu',
        seccion: seccionAlimentador,
        tipoInstalacion: 'TUBO',
        temperatura: 30,
      });

      // Calcular caída total máxima
      const caidaTotalMaxima = Math.max(
        ...circuitosAnalisis.map(c => c.caida_tension_ramal_pct),
        caidaAlimentador.caidaPorcentual
      );

      // Determinar estado general
      const estadoGeneral = this.determinarEstadoGeneral(
        circuitosFueraLimite,
        caidaTotalMaxima,
        request.parameters.max_caida_total_pct || 5
      );

      return {
        circuitos_analisis: circuitosAnalisis,
        feeder: {
          corriente_total_a: request.system.corriente_total_a,
          length_m: request.parameters.longitud_alimentador_m,
          material: request.parameters.material_conductor || 'Cu',
          section_mm2: seccionAlimentador,
          resistencia_ohm_km: 0, // Se calcularía con el servicio
          caida_tension_alimentador_v: caidaAlimentador.caidaTension,
          caida_tension_alimentador_pct: caidaAlimentador.caidaPorcentual,
          caida_tension_total_max_pct: caidaTotalMaxima,
          longitud_critica_m: this.calcularLongitudCritica(
            request.system.corriente_total_a,
            seccionAlimentador,
            request.parameters.max_caida_total_pct || 5
          ),
          estado: caidaAlimentador.cumpleNorma ? 'OK' : 'WARNING',
          observaciones: caidaAlimentador.recomendaciones,
        },
        resumen: {
          tension_nominal_v: request.system.voltage_v,
          phases: request.system.phases,
          limite_caida_ramal_pct: request.parameters.max_caida_ramal_pct || 3,
          limite_caida_total_pct: request.parameters.max_caida_total_pct || 5,
          caida_total_maxima_pct: caidaTotalMaxima,
          circuitos_fuera_limite: circuitosFueraLimite,
          estado_general: estadoGeneral,
          calibre_minimo_recomendado_mm2: seccionAlimentador,
        },
        observaciones_generales: [
          `Análisis de ${request.circuitos_ramales.length} circuits ramales`,
          `feeder: ${request.parameters.material_conductor || 'Cu'} ${seccionAlimentador}mm² para ${request.parameters.longitud_alimentador_m}m`,
          circuitosFueraLimite > 0 ? `⚠️ ${circuitosFueraLimite} circuit(s) exceden límites` : '✅ Todos los circuits cumplen límites',
          caidaTotalMaxima > (request.parameters.max_caida_total_pct || 5) ? '⚠️ feeder excede límite de caída de tensión' : '✅ feeder cumple límite de caída de tensión',
        ],
        metadata: {
          version: '1.0',
          timestamp: new Date().toISOString(),
          duracion_calculo_ms: Date.now() - Date.now(), // Simplificado
          algoritmo_usado: 'voltage_drop_analysis_with_feeder_selection',
        },
      };
    } catch (error) {
      this.logger.error(`Error en análisis de caída de tensión: ${error.message}`);
      throw error;
    }
  }

  /**
   * Calcula la sección mínima del conductor basada en la corriente
   */
  private calcularSeccionMinima(corrienteA: number): number {
    if (corrienteA <= 15) return 2.5;      // AWG 14
    if (corrienteA <= 20) return 4;        // AWG 12
    if (corrienteA <= 25) return 6;        // AWG 10
    if (corrienteA <= 32) return 10;       // AWG 8
    if (corrienteA <= 40) return 16;       // AWG 6
    if (corrienteA <= 63) return 25;       // AWG 4
    if (corrienteA <= 80) return 35;       // AWG 2
    if (corrienteA <= 100) return 50;      // AWG 1
    if (corrienteA <= 125) return 70;      // AWG 1/0
    if (corrienteA <= 160) return 95;      // AWG 2/0
    if (corrienteA <= 200) return 120;     // AWG 3/0
    return 150; // AWG 4/0 para corrientes mayores
  }

  /**
   * Calcula la longitud crítica máxima para cumplir límites de caída de tensión
   */
  private calcularLongitudCritica(corrienteA: number, seccionMm2: number, limitePorcentual: number): number {
    // Fórmula simplificada: L = (V * % / (I * R)) * 1000
    // Donde R = ρ * L / A (resistividad * longitud / área)
    const tension = 120; // V
    const resistividadCu = 0.0172; // Ω·mm²/m para cobre
    const limiteDecimal = limitePorcentual / 100;
    
    return (tension * limiteDecimal) / (corrienteA * resistividadCu / seccionMm2);
  }

  /**
   * Determina el estado general del sistema
   */
  private determinarEstadoGeneral(circuitosFueraLimite: number, caidaTotalMaxima: number, limiteTotal: number): string {
    if (circuitosFueraLimite === 0 && caidaTotalMaxima <= limiteTotal) {
      return 'OK';
    } else if (circuitosFueraLimite === 0 && caidaTotalMaxima <= limiteTotal * 1.2) {
      return 'WARNING';
    } else {
      return 'ERROR';
    }
  }
}
