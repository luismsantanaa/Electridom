import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ampacity } from '../entities/ampacity.entity';
import { BreakerCurve } from '../entities/breaker-curve.entity';
import { MetricsService } from '../../metrics/metrics.service';
import { NormParamService } from './norm-param.service';
import {
  CalcCircuitsRequestDto,
  CargaDiversificadaInputDto,
} from '../dtos/calc-circuits-request.dto';
import {
  CalcCircuitsResponseDto,
  CircuitoRamalDto,
  CargaEnCircuitoDto,
  BreakerDto,
  ConductorDto,
  ResumenCircuitosDto,
} from '../dtos/calc-circuits-response.dto';

interface CircuitoTemporal {
  id: string;
  nombre: string;
  cargas: CargaEnCircuitoDto[];
  cargaTotalVa: number;
  corrienteTotalA: number;
  categoria: string;
  ambiente?: string;
}

@Injectable()
export class CircuitService {
  private readonly logger = new Logger(CircuitService.name);

  constructor(
    @InjectRepository(Ampacity)
    private readonly ampacityRepository: Repository<Ampacity>,
    @InjectRepository(BreakerCurve)
    private readonly breakerRepository: Repository<BreakerCurve>,
    private readonly metricsService: MetricsService,
    private readonly normParamService: NormParamService,
  ) {}

  /**
   * Agrupar cargas en circuitos ramales y seleccionar conductores
   */
  async groupIntoCircuits(
    request: CalcCircuitsRequestDto,
  ): Promise<CalcCircuitsResponseDto> {
    const startTime = Date.now();

    try {
      this.logger.log('Iniciando agrupación de circuitos ramales');

      // Obtener parámetros normativos
      const maxUtilizacion = await this.getMaxUtilization();

      // Obtener datos de ampacity y breakers
      const [ampacities, breakers] = await Promise.all([
        this.getAmpacities(),
        this.getBreakers(),
      ]);

      // Agrupar cargas en circuitos temporales
      const circuitosTemporales = await this.agruparCargas(
        request.cargas_diversificadas,
        request.sistema,
        maxUtilizacion,
      );

      // Seleccionar breakers y conductores para cada circuito
      const circuitosCompletos = await this.seleccionarComponentes(
        circuitosTemporales,
        breakers,
        ampacities,
        request.sistema,
      );

      // Generar resumen
      const resumen = this.generarResumen(circuitosCompletos);

      // Generar observaciones
      const observacionesGenerales = this.generarObservaciones(
        circuitosCompletos,
        resumen,
      );

      // Registrar métricas
      const duration = Date.now() - startTime;
      this.recordMetrics(resumen, duration);

      this.logger.log(`Agrupación completada en ${duration}ms`);

      return {
        circuitos_ramales: circuitosCompletos,
        resumen,
        observaciones_generales: observacionesGenerales,
        metadata: {
          version: '1.0',
          timestamp: new Date().toISOString(),
          duracion_calculo_ms: duration,
          algoritmo_usado: 'grouping_by_category_with_80pct_rule',
        },
      };
    } catch (error) {
      this.logger.error('Error agrupando circuitos:', error.message);
      throw error;
    }
  }

  /**
   * Obtener máxima utilización permitida
   */
  private async getMaxUtilization(): Promise<number> {
    const maxUtil = await this.normParamService.getParamAsNumber(
      'circuit_max_utilization',
    );
    return maxUtil || 0.8; // 80% por defecto
  }

  /**
   * Obtener ampacities activas
   */
  private async getAmpacities(): Promise<Ampacity[]> {
    return this.ampacityRepository.find({
      where: { active: true },
      order: { amp: 'ASC' },
    });
  }

  /**
   * Obtener breakers activos
   */
  private async getBreakers(): Promise<BreakerCurve[]> {
    return this.breakerRepository.find({
      where: { active: true },
      order: { amp: 'ASC', poles: 'ASC' },
    });
  }

  /**
   * Agrupar cargas en circuitos respetando límites
   */
  private async agruparCargas(
    cargas: CargaDiversificadaInputDto[],
    sistema: any,
    maxUtilizacion: number,
  ): Promise<CircuitoTemporal[]> {
    const circuitos: CircuitoTemporal[] = [];
    let contadorCircuito = 1;

    // Agrupar por categoría para mejorar organización
    const cargasPorCategoria = this.agruparPorCategoria(cargas, sistema);

    for (const [categoria, cargasCategoria] of cargasPorCategoria.entries()) {
      let circuitoActual: CircuitoTemporal | null = null;

      for (const carga of cargasCategoria) {
        const cargaCircuito: CargaEnCircuitoDto = {
          categoria: carga.categoria,
          carga_va: carga.carga_diversificada_va,
          corriente_a:
            carga.carga_diversificada_va /
            (sistema.tension_v * (sistema.phases === 3 ? Math.sqrt(3) : 1)),
          descripcion: carga.descripcion,
          ambiente: carga.ambiente,
        };

        // Verificar si la carga cabe en el circuito actual
        if (
          circuitoActual &&
          this.cargaCabeEnCircuito(
            circuitoActual,
            cargaCircuito,
            maxUtilizacion,
          )
        ) {
          // Agregar al circuito existente
          circuitoActual.cargas.push(cargaCircuito);
          circuitoActual.cargaTotalVa += cargaCircuito.carga_va;
          circuitoActual.corrienteTotalA += cargaCircuito.corriente_a;
        } else {
          // Crear nuevo circuito
          circuitoActual = {
            id: `C${contadorCircuito.toString().padStart(3, '0')}`,
            nombre: `Circuito ${contadorCircuito} - ${categoria}`,
            cargas: [cargaCircuito],
            cargaTotalVa: cargaCircuito.carga_va,
            corrienteTotalA: cargaCircuito.corriente_a,
            categoria,
            ambiente: carga.ambiente,
          };
          circuitos.push(circuitoActual);
          contadorCircuito++;
        }
      }
    }

    return circuitos;
  }

  /**
   * Agrupar cargas por categoría
   */
  private agruparPorCategoria(
    cargas: CargaDiversificadaInputDto[],
    sistema: any,
  ): Map<string, CargaDiversificadaInputDto[]> {
    const grupos = new Map<string, CargaDiversificadaInputDto[]>();

    for (const carga of cargas) {
      if (!grupos.has(carga.categoria)) {
        grupos.set(carga.categoria, []);
      }
      grupos.get(carga.categoria)!.push(carga);
    }

    return grupos;
  }

  /**
   * Verificar si una carga cabe en un circuito
   */
  private cargaCabeEnCircuito(
    circuito: CircuitoTemporal,
    nuevaCarga: CargaEnCircuitoDto,
    maxUtilizacion: number,
  ): boolean {
    const corrienteTotal = circuito.corrienteTotalA + nuevaCarga.corriente_a;

    // Estimar breaker mínimo necesario (redondeamos hacia arriba a valores estándar)
    const breakerEstimado = this.estimarBreakerMinimo(corrienteTotal);

    // Verificar que no exceda el 80% del breaker estimado
    const limiteCorriente = breakerEstimado * maxUtilizacion;

    return corrienteTotal <= limiteCorriente;
  }

  /**
   * Estimar breaker mínimo necesario
   */
  private estimarBreakerMinimo(corriente: number): number {
    const breakersEstandar = [15, 20, 25, 30, 40, 50, 60, 80, 100];

    for (const breaker of breakersEstandar) {
      if (corriente <= breaker * 0.8) {
        return breaker;
      }
    }

    return 100; // Valor por defecto para cargas muy altas
  }

  /**
   * Seleccionar breakers y conductores para circuitos
   */
  private async seleccionarComponentes(
    circuitos: CircuitoTemporal[],
    breakers: BreakerCurve[],
    ampacities: Ampacity[],
    sistema: any,
  ): Promise<CircuitoRamalDto[]> {
    const circuitosCompletos: CircuitoRamalDto[] = [];

    for (const circuito of circuitos) {
      // Seleccionar breaker
      const breaker = this.seleccionarBreaker(
        circuito,
        breakers,
        sistema.phases,
      );

      // Calcular corriente de diseño con margen 125% si aplica
      const corrienteDiseno = this.calcularCorrienteDiseno(circuito);

      // Seleccionar conductor
      const conductor = this.seleccionarConductor(corrienteDiseno, ampacities);

      // Calcular utilización
      const utilizacion = (circuito.corrienteTotalA / breaker.amp) * 100;

      circuitosCompletos.push({
        id_circuito: circuito.id,
        nombre: circuito.nombre,
        cargas: circuito.cargas,
        carga_total_va: Math.round(circuito.cargaTotalVa * 100) / 100,
        corriente_total_a: Math.round(circuito.corrienteTotalA * 100) / 100,
        breaker: {
          amp: breaker.amp,
          poles: breaker.poles,
          curve: breaker.curve,
          use_case: breaker.useCase,
          notes: breaker.notes,
        },
        conductor: {
          calibre_awg: conductor.calibreAwg,
          seccion_mm2: conductor.seccionMm2,
          material: conductor.material,
          insulation: conductor.insulation,
          ampacity: conductor.amp,
          temp_c: conductor.tempC,
        },
        utilizacion_pct: Math.round(utilizacion * 100) / 100,
        margen_seguridad_pct:
          corrienteDiseno > circuito.corrienteTotalA ? 125 : 100,
        tension_v: sistema.tension_v,
        phases: sistema.phases,
        observaciones: this.generarObservacionesCircuito(
          circuito,
          breaker,
          conductor,
        ),
      });
    }

    return circuitosCompletos;
  }

  /**
   * Seleccionar breaker apropiado
   */
  private seleccionarBreaker(
    circuito: CircuitoTemporal,
    breakers: BreakerCurve[],
    systemPhases: number,
  ): BreakerCurve {
    // Filtrar breakers según fases del sistema
    const breakersCompatibles = breakers.filter((b) => b.poles <= systemPhases);

    // Buscar el breaker más pequeño que soporte la corriente
    for (const breaker of breakersCompatibles) {
      if (circuito.corrienteTotalA <= breaker.amp * 0.8) {
        return breaker;
      }
    }

    // Si no se encuentra, usar el más grande disponible
    return breakersCompatibles[breakersCompatibles.length - 1] || breakers[0];
  }

  /**
   * Calcular corriente de diseño con margen 125%
   */
  private calcularCorrienteDiseno(circuito: CircuitoTemporal): number {
    // Aplicar 125% para cargas continuas (simplificado)
    const esCargaContinua =
      circuito.categoria.includes('iluminacion') ||
      circuito.categoria.includes('climatizacion');

    return esCargaContinua
      ? circuito.corrienteTotalA * 1.25
      : circuito.corrienteTotalA;
  }

  /**
   * Seleccionar conductor apropiado
   */
  private seleccionarConductor(
    corrienteDiseno: number,
    ampacities: Ampacity[],
  ): Ampacity {
    // Buscar el conductor más pequeño que soporte la corriente de diseño
    for (const ampacity of ampacities) {
      if (ampacity.amp >= corrienteDiseno) {
        return ampacity;
      }
    }

    // Si no se encuentra, usar el más grande disponible
    return ampacities[ampacities.length - 1] || ampacities[0];
  }

  /**
   * Generar observaciones para un circuito
   */
  private generarObservacionesCircuito(
    circuito: CircuitoTemporal,
    breaker: BreakerCurve,
    conductor: Ampacity,
  ): string[] {
    const observaciones: string[] = [];

    observaciones.push(`${circuito.cargas.length} carga(s) agrupada(s)`);
    observaciones.push(
      `Breaker ${breaker.amp}A ${breaker.poles}P curva ${breaker.curve}`,
    );
    observaciones.push(
      `Conductor ${conductor.calibreAwg}AWG ${conductor.material}`,
    );

    const utilizacion = (circuito.corrienteTotalA / breaker.amp) * 100;
    if (utilizacion > 80) {
      observaciones.push('⚠️ Utilización superior al 80%');
    }

    return observaciones;
  }

  /**
   * Generar resumen de circuitos
   */
  private generarResumen(circuitos: CircuitoRamalDto[]): ResumenCircuitosDto {
    const totalCircuitos = circuitos.length;
    const cargaTotal = circuitos.reduce((sum, c) => sum + c.carga_total_va, 0);
    const corrienteTotal = circuitos.reduce(
      (sum, c) => sum + c.corriente_total_a,
      0,
    );
    const utilizacionPromedio =
      circuitos.reduce((sum, c) => sum + c.utilizacion_pct, 0) / totalCircuitos;

    const monofasicos = circuitos.filter((c) => c.phases === 1).length;
    const trifasicos = circuitos.filter((c) => c.phases === 3).length;

    const calibres = circuitos.map((c) => c.conductor.calibre_awg);
    const calibreMinimo = Math.max(...calibres);
    const calibreMaximo = Math.min(...calibres);

    return {
      total_circuitos: totalCircuitos,
      carga_total_va: Math.round(cargaTotal * 100) / 100,
      corriente_total_a: Math.round(corrienteTotal * 100) / 100,
      utilizacion_promedio_pct: Math.round(utilizacionPromedio * 100) / 100,
      circuitos_monofasicos: monofasicos,
      circuitos_trifasicos: trifasicos,
      calibre_minimo_awg: calibreMinimo,
      calibre_maximo_awg: calibreMaximo,
    };
  }

  /**
   * Generar observaciones generales
   */
  private generarObservaciones(
    circuitos: CircuitoRamalDto[],
    resumen: ResumenCircuitosDto,
  ): string[] {
    const observaciones: string[] = [];

    observaciones.push(
      `${resumen.total_circuitos} circuitos ramales generados`,
    );
    observaciones.push(
      `Utilización promedio: ${resumen.utilizacion_promedio_pct}%`,
    );

    const circuitosAltos = circuitos.filter(
      (c) => c.utilizacion_pct > 80,
    ).length;
    if (circuitosAltos > 0) {
      observaciones.push(
        `⚠️ ${circuitosAltos} circuito(s) con alta utilización (>80%)`,
      );
    }

    observaciones.push(
      `Calibres utilizados: ${resumen.calibre_maximo_awg}-${resumen.calibre_minimo_awg} AWG`,
    );

    return observaciones;
  }

  /**
   * Registrar métricas Prometheus
   */
  private recordMetrics(resumen: ResumenCircuitosDto, duration: number): void {
    this.metricsService.incrementCalcRuns('circuits', 'success');
    this.metricsService.observeCalcDuration('circuits', duration / 1000);

    // Métrica específica calc_circuits_total
    this.metricsService.incrementCalcRuns('circuits_total', 'success');

    this.logger.debug(
      `Métricas registradas: total_circuitos=${resumen.total_circuitos}, duration=${duration}ms`,
    );
  }
}
