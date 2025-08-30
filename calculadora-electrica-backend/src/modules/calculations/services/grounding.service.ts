import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GroundingRules } from '../entities/grounding-rules.entity';
import { MetricsService } from '../../metrics/metrics.service';
import { NormParamService } from './norm-param.service';
import { CalcGroundingRequestDto } from '../dtos/calc-grounding-request.dto';
import {
  CalcGroundingResponseDto,
  ConductorProteccionDto,
  SistemaTierraDto,
  ResumenGroundingDto,
} from '../dtos/calc-grounding-response.dto';

@Injectable()
export class GroundingService {
  private readonly logger = new Logger(GroundingService.name);

  constructor(
    @InjectRepository(GroundingRules)
    private readonly groundingRulesRepository: Repository<GroundingRules>,
    private readonly metricsService: MetricsService,
    private readonly normParamService: NormParamService,
  ) {}

  /**
   * Dimensionar conductors de protección y system de tierra
   */
  async size(
    request: CalcGroundingRequestDto,
  ): Promise<CalcGroundingResponseDto> {
    const startTime = Date.now();

    try {
      this.logger.log('Iniciando dimensionamiento de puesta a tierra');

      // Obtener rules de puesta a tierra
      const groundingRules = await this.getGroundingRules();

      // Dimensionar conductor de protección (EGC)
      const conductorProteccion = this.dimensionarConductorProteccion(
        request.parameters.main_breaker_amp,
        groundingRules,
      );

      // Dimensionar conductor de tierra (GEC)
      const conductorTierra = this.dimensionarConductorTierra(
        request.parameters.main_breaker_amp,
        groundingRules,
      );

      // Configurar system de tierra
      const sistemaTierra = this.configurarSistemaTierra(
        request.parameters,
        request.system,
      );

      // Generar resumen
      const resumen = this.generarResumen(
        request.parameters,
        conductorProteccion,
        conductorTierra,
        sistemaTierra,
      );

      // Generar observaciones
      const observacionesGenerales = this.generarObservaciones(
        request.parameters,
        conductorProteccion,
        conductorTierra,
        sistemaTierra,
      );

      // Registrar métricas
      const duration = Date.now() - startTime;
      this.recordMetrics(resumen, duration);

      this.logger.log(
        `Dimensionamiento de puesta a tierra completado en ${duration}ms`,
      );

      return {
        conductor_proteccion: conductorProteccion,
        conductor_tierra: conductorTierra,
        sistema_tierra: sistemaTierra,
        resumen,
        observaciones_generales: observacionesGenerales,
        metadata: {
          version: '1.0',
          timestamp: new Date().toISOString(),
          duracion_calculo_ms: duration,
          algoritmo_usado: 'grounding_sizing_with_normative_rules',
        },
      };
    } catch (error) {
      this.logger.error(
        'Error en dimensionamiento de puesta a tierra:',
        error.message,
      );
      throw error;
    }
  }

  /**
   * Obtener rules de puesta a tierra desde la base de datos
   */
  private async getGroundingRules(): Promise<GroundingRules[]> {
    return this.groundingRulesRepository.find({
      where: { active: true },
      order: { mainBreakerAmp: 'ASC' },
    });
  }

  /**
   * Dimensionar conductor de protección (EGC)
   */
  private dimensionarConductorProteccion(
    mainBreakerAmp: number,
    groundingRules: GroundingRules[],
  ): ConductorProteccionDto {
    // Buscar la rule apropiada basada en el amperaje del breaker
    const rule = this.encontrarReglaApropiada(mainBreakerAmp, groundingRules);

    const seccionMm2 =
      rule?.egcMm2 || this.calcularSeccionMinima(mainBreakerAmp);
    const calibreAwg = this.convertirMm2ToAwg(seccionMm2);

    return {
      type: 'EGC',
      section_mm2: seccionMm2,
      calibre_awg: calibreAwg,
      material: 'Cu',
      longitud_minima_m: this.calcularLongitudMinima(mainBreakerAmp),
      observaciones: [
        `conductor de protección para breaker de ${mainBreakerAmp}A`,
        `Sección mínima requerida: ${seccionMm2}mm² (${calibreAwg})`,
      ],
    };
  }

  /**
   * Dimensionar conductor de tierra (GEC)
   */
  private dimensionarConductorTierra(
    mainBreakerAmp: number,
    groundingRules: GroundingRules[],
  ): ConductorProteccionDto {
    // Buscar la rule apropiada basada en el amperaje del breaker
    const rule = this.encontrarReglaApropiada(mainBreakerAmp, groundingRules);

    const seccionMm2 =
      rule?.gecMm2 || this.calcularSeccionMinima(mainBreakerAmp);
    const calibreAwg = this.convertirMm2ToAwg(seccionMm2);

    return {
      type: 'GEC',
      section_mm2: seccionMm2,
      calibre_awg: calibreAwg,
      material: 'Cu',
      longitud_minima_m: this.calcularLongitudMinima(mainBreakerAmp),
      observaciones: [
        `conductor de tierra para breaker de ${mainBreakerAmp}A`,
        `Sección mínima requerida: ${seccionMm2}mm² (${calibreAwg})`,
      ],
    };
  }

  /**
   * Configurar system de tierra
   */
  private configurarSistemaTierra(
    parameters: any,
    system: any,
  ): SistemaTierraDto {
    const tipoSistema = parameters.tipo_sistema_tierra || 'TN-S';
    const tipoInstalacion = parameters.tipo_instalacion || 'residencial';

    // Determinar resistencia máxima según type de instalación
    const resistenciaMaxima = this.determinarResistenciaMaxima(tipoInstalacion);

    // Determinar número de electrodos según type de system
    const numeroElectrodos = this.determinarNumeroElectrodos(
      tipoSistema,
      tipoInstalacion,
    );

    // Determinar type de electrodo
    const tipoElectrodo = this.determinarTipoElectrodo(tipoInstalacion);

    // Calcular longitudes y separaciones
    const longitudElectrodo = this.calcularLongitudElectrodo(tipoInstalacion);
    const separacionElectrodos =
      this.calcularSeparacionElectrodos(numeroElectrodos);

    return {
      tipo_sistema: tipoSistema,
      resistencia_maxima_ohm: resistenciaMaxima,
      numero_electrodos: numeroElectrodos,
      tipo_electrodo: tipoElectrodo,
      longitud_electrodo_m: longitudElectrodo,
      separacion_electrodos_m: separacionElectrodos,
      observaciones: [
        `system ${tipoSistema} para instalación ${tipoInstalacion}`,
        `Resistencia máxima: ${resistenciaMaxima}Ω`,
        `${numeroElectrodos} electrodo(s) de ${tipoElectrodo}`,
      ],
    };
  }

  /**
   * Encontrar rule apropiada basada en amperaje
   */
  private encontrarReglaApropiada(
    mainBreakerAmp: number,
    groundingRules: GroundingRules[],
  ): GroundingRules | null {
    // Buscar la rule que coincida exactamente o la más cercana mayor
    const reglaExacta = groundingRules.find(
      (r) => r.mainBreakerAmp === mainBreakerAmp,
    );
    if (reglaExacta) return reglaExacta;

    // Buscar la rule con amperaje mayor más cercano
    const reglaMayor = groundingRules.find(
      (r) => r.mainBreakerAmp > mainBreakerAmp,
    );
    if (reglaMayor) return reglaMayor;

    // Si no hay rule mayor, usar la más grande disponible
    return groundingRules.length > 0
      ? groundingRules[groundingRules.length - 1]
      : null;
  }

  /**
   * Calcular sección mínima basada en amperaje
   */
  private calcularSeccionMinima(mainBreakerAmp: number): number {
    // rules básicas de dimensionamiento
    if (mainBreakerAmp <= 100) return 10;
    if (mainBreakerAmp <= 200) return 16;
    if (mainBreakerAmp <= 400) return 25;
    if (mainBreakerAmp <= 600) return 35;
    if (mainBreakerAmp <= 800) return 50;
    if (mainBreakerAmp <= 1000) return 70;
    return 95; // Para amperajes mayores
  }

  /**
   * Convertir mm² a calibre AWG
   */
  private convertirMm2ToAwg(seccionMm2: number): string {
    const conversionTable = {
      2.5: '14',
      4: '12',
      6: '10',
      10: '8',
      16: '6',
      25: '4',
      35: '2',
      50: '1/0',
      70: '2/0',
      95: '3/0',
      120: '4/0',
      150: '250',
      185: '300',
      240: '400',
      300: '500',
      400: '600',
      500: '750',
      630: '1000',
    };

    return conversionTable[seccionMm2] || 'N/A';
  }

  /**
   * Calcular longitud mínima del conductor
   */
  private calcularLongitudMinima(mainBreakerAmp: number): number {
    // Longitud mínima basada en el amperaje
    if (mainBreakerAmp <= 100) return 3;
    if (mainBreakerAmp <= 200) return 5;
    if (mainBreakerAmp <= 400) return 8;
    if (mainBreakerAmp <= 600) return 10;
    return 15; // Para amperajes mayores
  }

  /**
   * Determinar resistencia máxima según type de instalación
   */
  private determinarResistenciaMaxima(tipoInstalacion: string): number {
    switch (tipoInstalacion) {
      case 'residencial':
        return 25;
      case 'comercial':
        return 5;
      case 'industrial':
        return 1;
      default:
        return 25;
    }
  }

  /**
   * Determinar número de electrodos según type de system
   */
  private determinarNumeroElectrodos(
    tipoSistema: string,
    tipoInstalacion: string,
  ): number {
    if (tipoSistema === 'TT' || tipoSistema === 'IT') {
      return tipoInstalacion === 'industrial' ? 3 : 2;
    }
    return tipoInstalacion === 'industrial' ? 2 : 1;
  }

  /**
   * Determinar type de electrodo
   */
  private determinarTipoElectrodo(tipoInstalacion: string): string {
    switch (tipoInstalacion) {
      case 'residencial':
        return 'Varilla de cobre';
      case 'comercial':
        return 'Placa de cobre';
      case 'industrial':
        return 'Malla de tierra';
      default:
        return 'Varilla de cobre';
    }
  }

  /**
   * Calcular longitud del electrodo
   */
  private calcularLongitudElectrodo(tipoInstalacion: string): number {
    switch (tipoInstalacion) {
      case 'residencial':
        return 2.4;
      case 'comercial':
        return 3.0;
      case 'industrial':
        return 3.0;
      default:
        return 2.4;
    }
  }

  /**
   * Calcular separación entre electrodos
   */
  private calcularSeparacionElectrodos(numeroElectrodos: number): number {
    if (numeroElectrodos <= 1) return 0;
    return numeroElectrodos === 2 ? 3.0 : 6.0;
  }

  /**
   * Generar resumen
   */
  private generarResumen(
    parameters: any,
    conductorProteccion: ConductorProteccionDto,
    conductorTierra: ConductorProteccionDto,
    sistemaTierra: SistemaTierraDto,
  ): ResumenGroundingDto {
    const estado = this.determinarEstado(sistemaTierra.resistencia_maxima_ohm);
    const cumplimiento = this.determinarCumplimiento(
      parameters.tipo_instalacion,
    );

    return {
      main_breaker_amp: parameters.main_breaker_amp,
      tipo_instalacion: parameters.tipo_instalacion || 'residencial',
      tipo_sistema_tierra: parameters.tipo_sistema_tierra || 'TN-S',
      egc_mm2: conductorProteccion.section_mm2,
      gec_mm2: conductorTierra.section_mm2,
      resistencia_maxima_ohm: sistemaTierra.resistencia_maxima_ohm,
      estado,
      cumplimiento_normas: cumplimiento,
    };
  }

  /**
   * Determinar estado del system
   */
  private determinarEstado(resistenciaMaxima: number): string {
    if (resistenciaMaxima <= 1) return 'CRÍTICO';
    if (resistenciaMaxima <= 5) return 'ESTRICTO';
    if (resistenciaMaxima <= 25) return 'ESTÁNDAR';
    return 'BÁSICO';
  }

  /**
   * Determinar cumplimiento de norms
   */
  private determinarCumplimiento(tipoInstalacion: string): string {
    switch (tipoInstalacion) {
      case 'residencial':
        return 'NEC 250.66';
      case 'comercial':
        return 'NEC 250.66 + 250.52';
      case 'industrial':
        return 'NEC 250.66 + 250.52 + 250.53';
      default:
        return 'NEC 250.66';
    }
  }

  /**
   * Generar observaciones generales
   */
  private generarObservaciones(
    parameters: any,
    conductorProteccion: ConductorProteccionDto,
    conductorTierra: ConductorProteccionDto,
    sistemaTierra: SistemaTierraDto,
  ): string[] {
    const observaciones: string[] = [];

    observaciones.push(
      `system de puesta a tierra para breaker de ${parameters.main_breaker_amp}A`,
    );
    observaciones.push(
      `EGC: ${conductorProteccion.section_mm2}mm² (${conductorProteccion.calibre_awg})`,
    );
    observaciones.push(
      `GEC: ${conductorTierra.section_mm2}mm² (${conductorTierra.calibre_awg})`,
    );
    observaciones.push(
      `system ${sistemaTierra.tipo_sistema} con ${sistemaTierra.numero_electrodos} electrodo(s)`,
    );
    observaciones.push(
      `Resistencia máxima: ${sistemaTierra.resistencia_maxima_ohm}Ω`,
    );

    if (sistemaTierra.numero_electrodos > 1) {
      observaciones.push(
        `Separación mínima entre electrodos: ${sistemaTierra.separacion_electrodos_m}m`,
      );
    }

    return observaciones;
  }

  /**
   * Registrar métricas Prometheus
   */
  private recordMetrics(resumen: ResumenGroundingDto, duration: number): void {
    this.metricsService.incrementCalcRuns('grounding', 'success');
    this.metricsService.observeCalcDuration('grounding', duration / 1000);

    this.logger.debug(
      `Métricas registradas: estado=${resumen.estado}, egc=${resumen.egc_mm2}mm², gec=${resumen.gec_mm2}mm², duration=${duration}ms`,
    );
  }
}
