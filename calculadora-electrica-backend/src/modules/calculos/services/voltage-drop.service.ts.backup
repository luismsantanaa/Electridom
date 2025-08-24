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
  AlimentadorDto,
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
   * Seleccionar alimentador considerando caída de tensión
   */
  async selectFeeder(
    request: CalcFeederRequestDto,
  ): Promise<CalcFeederResponseDto> {
    const startTime = Date.now();

    try {
      this.logger.log(
        'Iniciando selección de alimentador y análisis de caída de tensión',
      );

      // Obtener parámetros normativos
      const [limiteRamal, limiteTotal] = await Promise.all([
        this.getLimiteRamal(request.parametros.max_caida_ramal_pct),
        this.getLimiteTotal(request.parametros.max_caida_total_pct),
      ]);

      // Obtener resistividades disponibles
      const resistividades = await this.getResistivities(
        request.parametros.material_conductor || 'Cu',
      );

      // Analizar caída de tensión en circuitos ramales
      const circuitosAnalisis = await this.analizarCircuitosRamales(
        request.circuitos_ramales,
        request.sistema,
        limiteRamal,
        resistividades,
      );

      // Seleccionar y analizar alimentador principal
      const alimentador = await this.analizarAlimentadorPrincipal(
        request.sistema,
        request.parametros,
        resistividades,
        limiteTotal,
      );

      // Generar resumen
      const resumen = this.generarResumen(
        request.sistema,
        circuitosAnalisis,
        alimentador,
        limiteRamal,
        limiteTotal,
      );

      // Generar observaciones
      const observacionesGenerales = this.generarObservaciones(
        circuitosAnalisis,
        alimentador,
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
        alimentador,
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

    const limite = await this.normParamService.getParamAsNumber(
      'vd_branch_limit_pct',
    );
    return limite || 3; // 3% por defecto
  }

  /**
   * Obtener límite de caída de tensión total
   */
  private async getLimiteTotal(parametroUsuario?: number): Promise<number> {
    if (parametroUsuario) return parametroUsuario;

    const limite =
      await this.normParamService.getParamAsNumber('vd_total_limit_pct');
    return limite || 5; // 5% por defecto
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
   * Analizar caída de tensión en circuitos ramales
   */
  private async analizarCircuitosRamales(
    circuitos: CircuitoRamalInputDto[],
    sistema: any,
    limiteRamal: number,
    resistividades: Resistivity[],
  ): Promise<CaidaTensionCircuitoDto[]> {
    const analisis: CaidaTensionCircuitoDto[] = [];

    for (const circuito of circuitos) {
      const longitud = circuito.longitud_m || 20; // 20m por defecto

      // Calcular caída de tensión del ramal
      const caidaTensionRamal = this.calcularCaidaTension(
        circuito.corriente_total_a,
        longitud,
        sistema.tension_v,
        sistema.phases,
        resistividades[0]?.ohmKm || 7.41, // Resistividad por defecto
      );

      const caidaPorcentajeRamal =
        (caidaTensionRamal / sistema.tension_v) * 100;

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
        id_circuito: circuito.id_circuito,
        nombre: circuito.nombre,
        corriente_a: circuito.corriente_total_a,
        longitud_m: longitud,
        caida_tension_ramal_v: Math.round(caidaTensionRamal * 100) / 100,
        caida_tension_ramal_pct: Math.round(caidaPorcentajeRamal * 100) / 100,
        estado,
        observaciones: observaciones.length > 0 ? observaciones : undefined,
      });
    }

    return analisis;
  }

  /**
   * Analizar alimentador principal
   */
  private async analizarAlimentadorPrincipal(
    sistema: any,
    parametros: any,
    resistividades: Resistivity[],
    limiteTotal: number,
  ): Promise<AlimentadorDto> {
    const corrienteTotal = sistema.corriente_total_a;
    const longitud = parametros.longitud_alimentador_m;

    // Seleccionar sección mínima que cumpla con límites
    const seccionSeleccionada = this.seleccionarSeccionAlimentador(
      corrienteTotal,
      longitud,
      sistema.tension_v,
      sistema.phases,
      limiteTotal,
      resistividades,
    );

    const resistividadSeleccionada =
      resistividades.find((r) => r.seccionMm2 === seccionSeleccionada) ||
      resistividades[0] || {
        material: 'Cu',
        seccionMm2: 10,
        ohmKm: 1.83,
      };

    // Calcular caída de tensión del alimentador
    const caidaTensionAlimentador = this.calcularCaidaTension(
      corrienteTotal,
      longitud,
      sistema.tension_v,
      sistema.phases,
      resistividadSeleccionada.ohmKm,
    );

    const caidaPorcentajeAlimentador =
      (caidaTensionAlimentador / sistema.tension_v) * 100;

    // Calcular longitud crítica
    const longitudCritica = this.calcularLongitudCritica(
      corrienteTotal,
      sistema.tension_v,
      sistema.phases,
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
      longitud_m: longitud,
      material: resistividadSeleccionada.material,
      seccion_mm2: resistividadSeleccionada.seccionMm2,
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
   * Seleccionar sección del alimentador
   */
  private seleccionarSeccionAlimentador(
    corriente: number,
    longitud: number,
    tension: number,
    fases: number,
    limiteTotal: number,
    resistividades: Resistivity[],
  ): number {
    for (const resistividad of resistividades) {
      const caidaTension = this.calcularCaidaTension(
        corriente,
        longitud,
        tension,
        fases,
        resistividad.ohmKm,
      );

      const caidaPorcentaje = (caidaTension / tension) * 100;

      if (caidaPorcentaje <= limiteTotal) {
        return resistividad.seccionMm2;
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
    sistema: any,
    circuitosAnalisis: CaidaTensionCircuitoDto[],
    alimentador: AlimentadorDto,
    limiteRamal: number,
    limiteTotal: number,
  ): ResumenCaidaTensionDto {
    const circuitosFueraLimite = circuitosAnalisis.filter(
      (c) => c.estado === 'ERROR',
    ).length;

    const caidaTotalMaxima = Math.max(
      alimentador.caida_tension_alimentador_pct,
      ...circuitosAnalisis.map((c) => c.caida_tension_ramal_pct),
    );

    let estadoGeneral = 'OK';
    if (circuitosFueraLimite > 0 || alimentador.estado === 'ERROR') {
      estadoGeneral = 'ERROR';
    } else if (alimentador.estado === 'WARNING') {
      estadoGeneral = 'WARNING';
    }

    return {
      tension_nominal_v: sistema.tension_v,
      phases: sistema.phases,
      limite_caida_ramal_pct: limiteRamal,
      limite_caida_total_pct: limiteTotal,
      caida_total_maxima_pct: Math.round(caidaTotalMaxima * 100) / 100,
      circuitos_fuera_limite: circuitosFueraLimite,
      estado_general: estadoGeneral,
      calibre_minimo_recomendado_mm2: alimentador.seccion_mm2,
    };
  }

  /**
   * Generar observaciones generales
   */
  private generarObservaciones(
    circuitosAnalisis: CaidaTensionCircuitoDto[],
    alimentador: AlimentadorDto,
    resumen: ResumenCaidaTensionDto,
  ): string[] {
    const observaciones: string[] = [];

    observaciones.push(
      `Análisis de ${circuitosAnalisis.length} circuitos ramales`,
    );
    observaciones.push(
      `Alimentador: ${alimentador.material} ${alimentador.seccion_mm2}mm² para ${alimentador.longitud_m}m`,
    );

    if (resumen.circuitos_fuera_limite > 0) {
      observaciones.push(
        `⚠️ ${resumen.circuitos_fuera_limite} circuito(s) exceden límites`,
      );
    }

    if (alimentador.estado === 'ERROR') {
      observaciones.push(`⚠️ Alimentador excede límite de caída de tensión`);
    }

    if (resumen.estado_general === 'OK') {
      observaciones.push('✅ Todos los límites de caída de tensión se cumplen');
    }

    observaciones.push(
      `Longitud crítica máxima: ${alimentador.longitud_critica_m}m`,
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
