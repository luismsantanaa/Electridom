import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DemandFactor } from '../entities/demand-factor.entity';
import { MetricsService } from '../../metrics/metrics.service';
import {
  CalcDemandRequestDto,
  CargaPorCategoriaDto,
} from '../dtos/calc-demand-request.dto';
import {
  CalcDemandResponseDto,
  CargaDiversificadaDto,
  TotalesDiversificadosDto,
} from '../dtos/calc-demand-response.dto';

interface FactorAplicado {
  categoria: string;
  carga_original: number;
  factor: number;
  carga_diversificada: number;
  rango: string;
  observaciones: string;
}

@Injectable()
export class DemandService {
  private readonly logger = new Logger(DemandService.name);

  constructor(
    @InjectRepository(DemandFactor)
    private readonly demandFactorRepository: Repository<DemandFactor>,
    private readonly metricsService: MetricsService,
  ) {}

  /**
   * Aplicar factores de demanda a cargas agregadas
   */
  async apply(request: CalcDemandRequestDto): Promise<CalcDemandResponseDto> {
    const startTime = Date.now();

    try {
      this.logger.log('Iniciando aplicación de factores de demanda');

      // Obtener factores de demanda de la base de datos
      const factores = await this.getDemandFactors();

      // Aplicar factores a cada categoría
      const factoresAplicados = await this.applyDemandFactors(
        request.cargas_por_categoria,
        factores,
      );

      // Calcular totales diversificados
      const totalesDiversificados = this.calculateDiversifiedTotals(
        factoresAplicados,
        request.totales,
      );

      // Generar observaciones
      const observacionesGenerales =
        this.generateObservations(factoresAplicados);

      // Registrar métricas
      const duration = Date.now() - startTime;
      this.recordMetrics(totalesDiversificados, duration);

      this.logger.log(`Aplicación de factores completada en ${duration}ms`);

      return {
        cargas_diversificadas: factoresAplicados.map((factor) => ({
          categoria: factor.categoria,
          carga_original_va: factor.carga_original,
          factor_demanda: factor.factor,
          carga_diversificada_va: factor.carga_diversificada,
          rango_aplicado: factor.rango,
          observaciones: factor.observaciones,
        })),
        totales_diversificados: totalesDiversificados,
        observaciones_generales: observacionesGenerales,
        metadata: {
          version: '1.0',
          timestamp: new Date().toISOString(),
          duracion_calculo_ms: duration,
        },
      };
    } catch (error) {
      this.logger.error('Error aplicando factores de demanda:', error.message);
      throw error;
    }
  }

  /**
   * Obtener factores de demanda activos de la base de datos
   */
  private async getDemandFactors(): Promise<DemandFactor[]> {
    return this.demandFactorRepository.find({
      where: { active: true },
      order: { category: 'ASC', rangeMin: 'ASC' },
    });
  }

  /**
   * Aplicar factores de demanda a cada categoría
   */
  private async applyDemandFactors(
    cargas: CargaPorCategoriaDto[],
    factores: DemandFactor[],
  ): Promise<FactorAplicado[]> {
    const factoresAplicados: FactorAplicado[] = [];

    for (const carga of cargas) {
      const factor = this.findApplicableFactor(
        carga.categoria,
        carga.carga_va,
        factores,
      );

      if (factor) {
        const cargaDiversificada = carga.carga_va * factor.factor;

        factoresAplicados.push({
          categoria: carga.categoria,
          carga_original: carga.carga_va,
          factor: factor.factor,
          carga_diversificada: Math.round(cargaDiversificada * 100) / 100,
          rango: `${factor.rangeMin}-${factor.rangeMax} VA`,
          observaciones: factor.notes || `Factor ${factor.factor} aplicado`,
        });
      } else {
        // Si no se encuentra factor, aplicar factor 1.0 (sin diversificación)
        this.logger.warn(
          `No se encontró factor de demanda para categoría '${carga.categoria}'`,
        );

        factoresAplicados.push({
          categoria: carga.categoria,
          carga_original: carga.carga_va,
          factor: 1.0,
          carga_diversificada: carga.carga_va,
          rango: 'Sin factor definido',
          observaciones:
            'Factor por defecto 1.0 aplicado - sin diversificación',
        });
      }
    }

    return factoresAplicados;
  }

  /**
   * Encontrar factor de demanda aplicable para una categoría y carga específica
   */
  private findApplicableFactor(
    categoria: string,
    carga: number,
    factores: DemandFactor[],
  ): DemandFactor | null {
    // Buscar factores que coincidan con la categoría y rango
    const factoresCategoria = factores.filter(
      (factor) =>
        factor.category === categoria &&
        carga >= factor.rangeMin &&
        carga <= factor.rangeMax,
    );

    if (factoresCategoria.length === 0) {
      // Si no hay coincidencia exacta, buscar factores genéricos para la categoría
      const factoresGenericos = factores.filter(
        (factor) => factor.category === categoria,
      );

      return factoresGenericos.length > 0 ? factoresGenericos[0] : null;
    }

    // Retornar el primer factor que coincida (el de menor rango por el ORDER BY)
    return factoresCategoria[0];
  }

  /**
   * Calcular totales diversificados
   */
  private calculateDiversifiedTotals(
    factoresAplicados: FactorAplicado[],
    totalesOriginales: any,
  ): TotalesDiversificadosDto {
    const cargaTotalOriginal = factoresAplicados.reduce(
      (sum, factor) => sum + factor.carga_original,
      0,
    );

    const cargaTotalDiversificada = factoresAplicados.reduce(
      (sum, factor) => sum + factor.carga_diversificada,
      0,
    );

    const factorDiversificacionEfectivo =
      cargaTotalOriginal > 0
        ? cargaTotalDiversificada / cargaTotalOriginal
        : 1.0;

    const corrienteTotalDiversificada =
      cargaTotalDiversificada / totalesOriginales.tension_v;
    const ahorroCarga = cargaTotalOriginal - cargaTotalDiversificada;
    const porcentajeAhorro =
      cargaTotalOriginal > 0 ? (ahorroCarga / cargaTotalOriginal) * 100 : 0;

    return {
      carga_total_original_va: Math.round(cargaTotalOriginal * 100) / 100,
      carga_total_diversificada_va:
        Math.round(cargaTotalDiversificada * 100) / 100,
      factor_diversificacion_efectivo:
        Math.round(factorDiversificacionEfectivo * 10000) / 10000,
      corriente_total_diversificada_a:
        Math.round(corrienteTotalDiversificada * 100) / 100,
      ahorro_carga_va: Math.round(ahorroCarga * 100) / 100,
      porcentaje_ahorro: Math.round(porcentajeAhorro * 100) / 100,
      tension_v: totalesOriginales.tension_v,
      phases: totalesOriginales.phases,
    };
  }

  /**
   * Generar observaciones generales
   */
  private generateObservations(factoresAplicados: FactorAplicado[]): string[] {
    const observaciones: string[] = [];

    // Resumen de factores aplicados
    const factoresUnicos = [...new Set(factoresAplicados.map((f) => f.factor))];
    observaciones.push(
      `Factores de demanda aplicados: ${factoresUnicos.join(', ')}`,
    );

    // Categorías con mayor diversificación
    const mayorDiversificacion = factoresAplicados
      .filter((f) => f.factor < 0.9)
      .map((f) => f.categoria);

    if (mayorDiversificacion.length > 0) {
      observaciones.push(
        `Categorías con mayor diversificación: ${mayorDiversificacion.join(', ')}`,
      );
    }

    // Categorías sin diversificación
    const sinDiversificacion = factoresAplicados
      .filter((f) => f.factor >= 1.0)
      .map((f) => f.categoria);

    if (sinDiversificacion.length > 0) {
      observaciones.push(
        `Categorías sin diversificación: ${sinDiversificacion.join(', ')}`,
      );
    }

    return observaciones;
  }

  /**
   * Registrar métricas Prometheus
   */
  private recordMetrics(
    totales: TotalesDiversificadosDto,
    duration: number,
  ): void {
    // Métrica específica de CE-02
    this.metricsService.incrementCalcRuns('demand', 'success');
    this.metricsService.observeCalcDuration('demand', duration / 1000);

    // Métrica específica calc_demand_va_total
    this.metricsService.incrementCalcRuns('demand_va_total', 'success');

    this.logger.debug(
      `Métricas registradas: carga_diversificada=${totales.carga_total_diversificada_va}VA, duration=${duration}ms`,
    );
  }
}
