import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Resistivity } from '../entities/resistivity.entity';
import { MetricsService } from '../../metrics/metrics.service';
import { NormParamService } from './norm-param.service';
import {
  CalcFeederRequestDto,
  CircuitoRamalInputDto,
} from '../dtos/calc-feeder-request.dto';
import {
  CalcFeederResponseDto,
  CaidaTensionCircuitoDto,
  FeederDto,
  ResumenCaidaTensionDto,
} from '../dtos/calc-feeder-response.dto';

@Injectable()
export class VoltageDropService {
  private readonly logger = new Logger(VoltageDropService.name);

  constructor(
    @InjectRepository(Resistivity)
    private readonly resistivityRepository: Repository<Resistivity>,
    private readonly metricsService: MetricsService,
    private readonly normParamService: NormParamService,
  ) {}

  /**
   * Seleccionar feeder considerando caída de tensión
   */
  async selectFeeder(
    request: CalcFeederRequestDto,
  ): Promise<CalcFeederResponseDto> {
    const startTime = Date.now();

    try {
      this.logger.log(
        'Iniciando selección de feeder y análisis de caída de tensión',
      );

      // Obtener parámetros normativos
      const [limiteRamal, limiteTotal] = await Promise.all([
        this.getLimiteRamal(request.parameters.max_caida_ramal_pct),
        this.getLimiteTotal(request.parameters.max_caida_total_pct),
      ]);

      // Obtener resistividades disponibles
      const resistividades = await this.getResistivities(
        request.parameters.material_conductor || 'Cu',
      );

      // Analizar caída de tensión en circuits ramales
      const circuitosAnalisis = await this.analizarCircuitosRamales(
        request.circuitos_ramales,
        request.system,
        limiteRamal,
        resistividades,
      );

      // Seleccionar y analizar feeder principal
      const feeder = await this.analizarAlimentadorPrincipal(
        request.system,
        request.parameters,
        resistividades,
        limiteTotal,
      );

      // Generar resumen
      const resumen = this.generarResumen(
        request.system,
        circuitosAnalisis,
        feeder,
        limiteRamal,
        limiteTotal,
      );

      // Generar observaciones
      const observacionesGenerales = this.generarObservaciones(
        circuitosAnalisis,
        feeder,
        resumen,
      );

      // Registrar métricas
      const duration = Date.now() - startTime;
      this.recordMetrics(resumen, duration);

      this.logger.log(
        `Análisis de caída de tensión completado en ${duration}ms`,
      );

      return {
        circuitos_analisis: circuitosAnalisis,
        feeder,
        resumen,
        observaciones_generales: observacionesGenerales,
        metadata: {
          version: '1.0',
          timestamp: new Date().toISOString(),
          duracion_calculo_ms: duration,
          algoritmo_usado: 'voltage_drop_analysis_with_feeder_selection',
        },
      };
    } catch (error) {
      this.logger.error(
        'Error en análisis de caída de tensión:',
        error.message,
      );
      throw error;
    }
  }

  /**
   * Obtener límite de caída de tensión en ramal
   */
  private async getLimiteRamal(parametroUsuario?: number): Promise<number> {
    if (parametroUsuario) return parametroUsuario;

    const limit = await this.normParamService.getParamAsNumber(
      'vd_branch_limit_pct',
    );
    return limit || 3; // 3% por defecto
  }

  /**
   * Obtener límite de caída de tensión total
   */
  private async getLimiteTotal(parametroUsuario?: number): Promise<number> {
    if (parametroUsuario) return parametroUsuario;

    const limit =
      await this.normParamService.getParamAsNumber('vd_total_limit_pct');
    return limit || 5; // 5% por defecto
  }

  /**
   * Obtener resistividades de la base de datos
   */
  private async getResistivities(material: string): Promise<Resistivity[]> {
    return this.resistivityRepository.find({
      where: { material, active: true },
      order: { seccionMm2: 'ASC' },
    });
  }

  /**
   * Analizar caída de tensión en circuits ramales
   */
  private async analizarCircuitosRamales(
    circuits: CircuitoRamalInputDto[],
    system: any,
    limiteRamal: number,
    resistividades: Resistivity[],
  ): Promise<CaidaTensionCircuitoDto[]> {
    const analisis: CaidaTensionCircuitoDto[] = [];

    for (const circuit of circuits) {
      const longitud = circuit.length_m || 20; // 20m por defecto

      // Calcular caída de tensión del ramal
      const caidaTensionRamal = this.calcularCaidaTension(
        circuit.corriente_total_a,
        longitud,
        system.voltage_v,
        system.phases,
        resistividades[0]?.ohmKm || 7.41, // resistivity por defecto
      );

      const caidaPorcentajeRamal = (caidaTensionRamal / system.voltage_v) * 100;

      // Determinar estado
      let estado = 'OK';
      const observaciones: string[] = [];

      if (caidaPorcentajeRamal > limiteRamal) {
        estado = 'ERROR';
        observaciones.push(`Excede límite de ${limiteRamal}% en ramal`);
      } else if (caidaPorcentajeRamal > limiteRamal * 0.8) {
        estado = 'WARNING';
        observaciones.push(`Cerca del límite de ${limiteRamal}% en ramal`);
      }

      analisis.push({
        id_circuito: circuit.id_circuito,
        name: circuit.name,
        current_a: circuit.corriente_total_a,
        length_m: longitud,
        caida_tension_ramal_v: Math.round(caidaTensionRamal * 100) / 100,
        caida_tension_ramal_pct: Math.round(caidaPorcentajeRamal * 100) / 100,
        estado,
        observaciones: observaciones.length > 0 ? observaciones : undefined,
      });
    }

    return analisis;
  }

  /**
   * Analizar feeder principal
   */
  private async analizarAlimentadorPrincipal(
    system: any,
    parameters: any,
    resistividades: Resistivity[],
    limiteTotal: number,
  ): Promise<FeederDto> {
    const corrienteTotal = system.corriente_total_a;
    const longitud = parameters.longitud_alimentador_m;

    // Seleccionar sección mínima que cumpla con límites
    const seccionSeleccionada = this.seleccionarSeccionAlimentador(
      corrienteTotal,
      longitud,
      system.voltage_v,
      system.phases,
      limiteTotal,
      resistividades,
    );

    const resistividadSeleccionada = resistividades.find(
      (r) => r.seccionMm2 === seccionSeleccionada,
    ) ||
      resistividades[0] || {
        material: 'Cu',
        seccionMm2: 10,
        ohmKm: 1.83,
      };

    // Calcular caída de tensión del feeder
    const caidaTensionAlimentador = this.calcularCaidaTension(
      corrienteTotal,
      longitud,
      system.voltage_v,
      system.phases,
      resistividadSeleccionada.ohmKm,
    );

    const caidaPorcentajeAlimentador =
      (caidaTensionAlimentador / system.voltage_v) * 100;

    // Calcular longitud crítica
    const longitudCritica = this.calcularLongitudCritica(
      corrienteTotal,
      system.voltage_v,
      system.phases,
      limiteTotal,
      resistividadSeleccionada.ohmKm,
    );

    // Determinar estado
    let estado = 'OK';
    const observaciones: string[] = [];

    if (caidaPorcentajeAlimentador > limiteTotal) {
      estado = 'ERROR';
      observaciones.push(`Excede límite de ${limiteTotal}% total`);
    } else if (caidaPorcentajeAlimentador > limiteTotal * 0.8) {
      estado = 'WARNING';
      observaciones.push(`Cerca del límite de ${limiteTotal}% total`);
    }

    return {
      corriente_total_a: corrienteTotal,
      length_m: longitud,
      material: resistividadSeleccionada.material,
      section_mm2: resistividadSeleccionada.seccionMm2,
      resistencia_ohm_km: resistividadSeleccionada.ohmKm,
      caida_tension_alimentador_v:
        Math.round(caidaTensionAlimentador * 100) / 100,
      caida_tension_alimentador_pct:
        Math.round(caidaPorcentajeAlimentador * 100) / 100,
      caida_tension_total_max_pct:
        Math.round((caidaPorcentajeAlimentador + 3) * 100) / 100, // Estimado
      longitud_critica_m: Math.round(longitudCritica * 100) / 100,
      estado,
      observaciones: observaciones.length > 0 ? observaciones : undefined,
    };
  }

  /**
   * Calcular caída de tensión
   */
  private calcularCaidaTension(
    corriente: number,
    longitud: number,
    tension: number,
    fases: number,
    resistenciaOhmKm: number,
  ): number {
    // Fórmula: ΔV = I × R × L × factor
    // Para monofásico: factor = 2 (ida y vuelta)
    // Para trifásico: factor = √3
    const factor = fases === 3 ? Math.sqrt(3) : 2;
    const resistenciaTotal = (resistenciaOhmKm * longitud) / 1000; // Convertir a Ohm

    return corriente * resistenciaTotal * factor;
  }

  /**
   * Seleccionar sección del feeder
   */
  private seleccionarSeccionAlimentador(
    corriente: number,
    longitud: number,
    tension: number,
    fases: number,
    limiteTotal: number,
    resistividades: Resistivity[],
  ): number {
    for (const resistivity of resistividades) {
      const caidaTension = this.calcularCaidaTension(
        corriente,
        longitud,
        tension,
        fases,
        resistivity.ohmKm,
      );

      const caidaPorcentaje = (caidaTension / tension) * 100;

      if (caidaPorcentaje <= limiteTotal) {
        return resistivity.seccionMm2;
      }
    }

    // Si ninguna sección cumple, retornar la más grande disponible
    return resistividades[resistividades.length - 1]?.seccionMm2 || 10;
  }

  /**
   * Calcular longitud crítica
   */
  private calcularLongitudCritica(
    corriente: number,
    tension: number,
    fases: number,
    limiteTotal: number,
    resistenciaOhmKm: number,
  ): number {
    // Despejar L de la fórmula de caída de tensión
    // L = (ΔV × 1000) / (I × R × factor)
    const factor = fases === 3 ? Math.sqrt(3) : 2;
    const caidaMaxima = (tension * limiteTotal) / 100;

    return (caidaMaxima * 1000) / (corriente * resistenciaOhmKm * factor);
  }

  /**
   * Generar resumen
   */
  private generarResumen(
    system: any,
    circuitosAnalisis: CaidaTensionCircuitoDto[],
    feeder: FeederDto,
    limiteRamal: number,
    limiteTotal: number,
  ): ResumenCaidaTensionDto {
    const circuitosFueraLimite = circuitosAnalisis.filter(
      (c) => c.estado === 'ERROR',
    ).length;

    const caidaTotalMaxima = Math.max(
      feeder.caida_tension_alimentador_pct,
      ...circuitosAnalisis.map((c) => c.caida_tension_ramal_pct),
    );

    let estadoGeneral = 'OK';
    if (circuitosFueraLimite > 0 || feeder.estado === 'ERROR') {
      estadoGeneral = 'ERROR';
    } else if (feeder.estado === 'WARNING') {
      estadoGeneral = 'WARNING';
    }

    return {
      tension_nominal_v: system.voltage_v,
      phases: system.phases,
      limite_caida_ramal_pct: limiteRamal,
      limite_caida_total_pct: limiteTotal,
      caida_total_maxima_pct: Math.round(caidaTotalMaxima * 100) / 100,
      circuitos_fuera_limite: circuitosFueraLimite,
      estado_general: estadoGeneral,
      calibre_minimo_recomendado_mm2: feeder.section_mm2,
    };
  }

  /**
   * Generar observaciones generales
   */
  private generarObservaciones(
    circuitosAnalisis: CaidaTensionCircuitoDto[],
    feeder: FeederDto,
    resumen: ResumenCaidaTensionDto,
  ): string[] {
    const observaciones: string[] = [];

    observaciones.push(
      `Análisis de ${circuitosAnalisis.length} circuits ramales`,
    );
    observaciones.push(
      `feeder: ${feeder.material} ${feeder.section_mm2}mm² para ${feeder.length_m}m`,
    );

    if (resumen.circuitos_fuera_limite > 0) {
      observaciones.push(
        `⚠️ ${resumen.circuitos_fuera_limite} circuit(s) exceden límites`,
      );
    }

    if (feeder.estado === 'ERROR') {
      observaciones.push(`⚠️ feeder excede límite de caída de tensión`);
    }

    if (resumen.estado_general === 'OK') {
      observaciones.push('✅ Todos los límites de caída de tensión se cumplen');
    }

    observaciones.push(
      `Longitud crítica máxima: ${feeder.longitud_critica_m}m`,
    );

    return observaciones;
  }

  /**
   * Registrar métricas Prometheus
   */
  private recordMetrics(
    resumen: ResumenCaidaTensionDto,
    duration: number,
  ): void {
    this.metricsService.incrementCalcRuns('voltage_drop', 'success');
    this.metricsService.observeCalcDuration('voltage_drop', duration / 1000);

    this.logger.debug(
      `Métricas registradas: estado=${resumen.estado_general}, caida_maxima=${resumen.caida_total_maxima_pct}%, duration=${duration}ms`,
    );
  }
}
