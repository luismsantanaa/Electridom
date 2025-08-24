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
  name: string;
  loads: CargaEnCircuitoDto[];
  cargaTotalVa: number;
  corrienteTotalA: number;
  category: string;
  environment?: string;
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
   * Agrupar loads en circuits ramales y seleccionar conductors
   */
  async groupIntoCircuits(
    request: CalcCircuitsRequestDto,
  ): Promise<CalcCircuitsResponseDto> {
    const startTime = Date.now();

    try {
      this.logger.log('Iniciando agrupación de circuits ramales');

      // Obtener parámetros normativos
      const maxUtilizacion = await this.getMaxUtilization();

      // Obtener datos de ampacity y breakers
      const [ampacities, breakers] = await Promise.all([
        this.getAmpacities(),
        this.getBreakers(),
      ]);

      // Agrupar loads en circuits temporales
      const circuitosTemporales = await this.agruparCargas(
        request.cargas_diversificadas,
        request.system,
        maxUtilizacion,
      );

      // Seleccionar breakers y conductors para cada circuit
      const circuitosCompletos = await this.seleccionarComponentes(
        circuitosTemporales,
        breakers,
        ampacities,
        request.system,
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
      this.logger.error('Error agrupando circuits:', error.message);
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
   * Agrupar loads en circuits respetando límites
   */
  private async agruparCargas(
    loads: CargaDiversificadaInputDto[],
    system: any,
    maxUtilizacion: number,
  ): Promise<CircuitoTemporal[]> {
    const circuits: CircuitoTemporal[] = [];
    let contadorCircuito = 1;

    // Agrupar por categoría para mejorar organización
    const cargasPorCategoria = this.agruparPorCategoria(loads, system);

    for (const [category, cargasCategoria] of cargasPorCategoria.entries()) {
      let circuitoActual: CircuitoTemporal | null = null;

      for (const load of cargasCategoria) {
        const cargaCircuito: CargaEnCircuitoDto = {
          category: load.category,
          carga_va: load.carga_diversificada_va,
          current_a:
            load.carga_diversificada_va /
            (system.voltage_v * (system.phases === 3 ? Math.sqrt(3) : 1)),
          description: load.description,
          environment: load.environment,
        };

        // Verificar si la load cabe en el circuit actual
        if (
          circuitoActual &&
          this.cargaCabeEnCircuito(
            circuitoActual,
            cargaCircuito,
            maxUtilizacion,
          )
        ) {
          // Agregar al circuit existente
          circuitoActual.loads.push(cargaCircuito);
          circuitoActual.cargaTotalVa += cargaCircuito.carga_va;
          circuitoActual.corrienteTotalA += cargaCircuito.current_a;
        } else {
          // Crear nuevo circuit
          circuitoActual = {
            id: `C${contadorCircuito.toString().padStart(3, '0')}`,
            name: `circuit ${contadorCircuito} - ${category}`,
            loads: [cargaCircuito],
            cargaTotalVa: cargaCircuito.carga_va,
            corrienteTotalA: cargaCircuito.current_a,
            category,
            environment: load.environment,
          };
          circuits.push(circuitoActual);
          contadorCircuito++;
        }
      }
    }

    return circuits;
  }

  /**
   * Agrupar loads por categoría
   */
  private agruparPorCategoria(
    loads: CargaDiversificadaInputDto[],
    system: any,
  ): Map<string, CargaDiversificadaInputDto[]> {
    const grupos = new Map<string, CargaDiversificadaInputDto[]>();

    for (const load of loads) {
      if (!grupos.has(load.category)) {
        grupos.set(load.category, []);
      }
      grupos.get(load.category)!.push(load);
    }

    return grupos;
  }

  /**
   * Verificar si una load cabe en un circuit
   */
  private cargaCabeEnCircuito(
    circuit: CircuitoTemporal,
    nuevaCarga: CargaEnCircuitoDto,
    maxUtilizacion: number,
  ): boolean {
    const corrienteTotal = circuit.corrienteTotalA + nuevaCarga.current_a;

    // Estimar breaker mínimo necesario (redondeamos hacia arriba a values estándar)
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

    return 100; // value por defecto para loads muy altas
  }

  /**
   * Seleccionar breakers y conductors para circuits
   */
  private async seleccionarComponentes(
    circuits: CircuitoTemporal[],
    breakers: BreakerCurve[],
    ampacities: Ampacity[],
    system: any,
  ): Promise<CircuitoRamalDto[]> {
    const circuitosCompletos: CircuitoRamalDto[] = [];

    for (const circuit of circuits) {
      // Seleccionar breaker
      const breaker = this.seleccionarBreaker(
        circuit,
        breakers,
        system.phases,
      );

      // Calcular corriente de diseño con margen 125% si aplica
      const corrienteDiseno = this.calcularCorrienteDiseno(circuit);

      // Seleccionar conductor
      const conductor = this.seleccionarConductor(corrienteDiseno, ampacities);

      // Calcular utilización
      const utilization = (circuit.corrienteTotalA / breaker.amp) * 100;

      circuitosCompletos.push({
        id_circuito: circuit.id,
        name: circuit.name,
        loads: circuit.loads,
        carga_total_va: Math.round(circuit.cargaTotalVa * 100) / 100,
        corriente_total_a: Math.round(circuit.corrienteTotalA * 100) / 100,
        breaker: {
          amp: breaker.amp,
          poles: breaker.poles,
          curve: breaker.curve,
          use_case: breaker.useCase,
          notes: breaker.notes,
        },
        conductor: {
          calibre_awg: conductor.calibreAwg,
          section_mm2: conductor.seccionMm2,
          material: conductor.material,
          insulation: conductor.insulation,
          ampacity: conductor.amp,
          temp_c: conductor.tempC,
        },
        utilizacion_pct: Math.round(utilization * 100) / 100,
        margen_seguridad_pct:
          corrienteDiseno > circuit.corrienteTotalA ? 125 : 100,
        voltage_v: system.voltage_v,
        phases: system.phases,
        observaciones: this.generarObservacionesCircuito(
          circuit,
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
    circuit: CircuitoTemporal,
    breakers: BreakerCurve[],
    systemPhases: number,
  ): BreakerCurve {
    // Filtrar breakers según fases del system
    const breakersCompatibles = breakers.filter((b) => b.poles <= systemPhases);

    // Buscar el breaker más pequeño que soporte la corriente
    for (const breaker of breakersCompatibles) {
      if (circuit.corrienteTotalA <= breaker.amp * 0.8) {
        return breaker;
      }
    }

    // Si no se encuentra, usar el más grande disponible
    return breakersCompatibles[breakersCompatibles.length - 1] || breakers[0];
  }

  /**
   * Calcular corriente de diseño con margen 125%
   */
  private calcularCorrienteDiseno(circuit: CircuitoTemporal): number {
    // Aplicar 125% para loads continuas (simplificado)
    const esCargaContinua =
      circuit.category.includes('iluminacion') ||
      circuit.category.includes('climatizacion');

    return esCargaContinua
      ? circuit.corrienteTotalA * 1.25
      : circuit.corrienteTotalA;
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
   * Generar observaciones para un circuit
   */
  private generarObservacionesCircuito(
    circuit: CircuitoTemporal,
    breaker: BreakerCurve,
    conductor: Ampacity,
  ): string[] {
    const observaciones: string[] = [];

    observaciones.push(`${circuit.loads.length} load(s) agrupada(s)`);
    observaciones.push(
      `breaker ${breaker.amp}A ${breaker.poles}P curva ${breaker.curve}`,
    );
    observaciones.push(
      `conductor ${conductor.calibreAwg}AWG ${conductor.material}`,
    );

    const utilization = (circuit.corrienteTotalA / breaker.amp) * 100;
    if (utilization > 80) {
      observaciones.push('⚠️ Utilización superior al 80%');
    }

    return observaciones;
  }

  /**
   * Generar resumen de circuits
   */
  private generarResumen(circuits: CircuitoRamalDto[]): ResumenCircuitosDto {
    const totalCircuitos = circuits.length;
    const cargaTotal = circuits.reduce((sum, c) => sum + c.carga_total_va, 0);
    const corrienteTotal = circuits.reduce(
      (sum, c) => sum + c.corriente_total_a,
      0,
    );
    const utilizacionPromedio =
      circuits.reduce((sum, c) => sum + c.utilizacion_pct, 0) / totalCircuitos;

    const monofasicos = circuits.filter((c) => c.phases === 1).length;
    const trifasicos = circuits.filter((c) => c.phases === 3).length;

    const calibres = circuits.map((c) => c.conductor.calibre_awg);
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
    circuits: CircuitoRamalDto[],
    resumen: ResumenCircuitosDto,
  ): string[] {
    const observaciones: string[] = [];

    observaciones.push(
      `${resumen.total_circuitos} circuits ramales generados`,
    );
    observaciones.push(
      `Utilización promedio: ${resumen.utilizacion_promedio_pct}%`,
    );

    const circuitosAltos = circuits.filter(
      (c) => c.utilizacion_pct > 80,
    ).length;
    if (circuitosAltos > 0) {
      observaciones.push(
        `⚠️ ${circuitosAltos} circuit(s) con alta utilización (>80%)`,
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

