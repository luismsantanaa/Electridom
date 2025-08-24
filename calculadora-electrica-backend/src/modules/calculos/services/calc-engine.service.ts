import { Injectable, Logger } from '@nestjs/common';
import { NormParamService } from './norm-param.service';
import { MetricsService } from '../../metrics/metrics.service';
import { 
  CalcRoomsRequestDto, 
  SurfaceDto, 
  ConsumptionDto, 
  SystemConfigDto 
} from '../dtos/calc-rooms-request.dto';
import { 
  CalcRoomsResponseDto, 
  AmbienteResultDto, 
  TotalesDto 
} from '../dtos/calc-rooms-response.dto';

interface AmbienteCarga {
  name: string;
  area_m2: number;
  consumptions: ConsumptionDto[];
  carga_va: number;
  fp_efectivo: number;
  observaciones: string[];
}

@Injectable()
export class CalcEngineService {
  private readonly logger = new Logger(CalcEngineService.name);

  constructor(
    private readonly normParamService: NormParamService,
    private readonly metricsService: MetricsService,
  ) {}

  /**
   * Calcular loads por environment
   */
  async calcByRoom(request: CalcRoomsRequestDto): Promise<CalcRoomsResponseDto> {
    const startTime = Date.now();
    
    try {
      this.logger.log('Iniciando cálculo de loads por environment');
      
      // Configuración del system
      const system = request.system || { voltage: 120, phases: 1, frequency: 60 };
      
      // Agrupar consumptions por environment
      const ambientesCarga = this.groupConsumosByAmbiente(request.surfaces, request.consumptions);
      
      // Calcular loads por environment
      const resultadosAmbientes = await this.calculateAmbienteCargas(ambientesCarga);
      
      // Calcular totales
      const totales = this.calculateTotales(resultadosAmbientes, system);
      
      // Registrar métricas
      const duration = Date.now() - startTime;
      this.recordMetrics(resultadosAmbientes, duration);
      
      this.logger.log(`Cálculo completado en ${duration}ms`);
      
      return {
        environments: resultadosAmbientes.map(amb => ({
          name: amb.name,
          area_m2: amb.area_m2,
          carga_va: amb.carga_va,
          fp: amb.fp_efectivo,
          observaciones: amb.observaciones.join('; '),
        })),
        totales,
        circuits: [],
        feeder: {},
        grounding: {},
      };
      
    } catch (error) {
      this.logger.error('Error en cálculo de loads por environment:', error.message);
      throw error;
    }
  }

  /**
   * Agrupar consumptions por environment
   */
  private groupConsumosByAmbiente(surfaces: SurfaceDto[], consumptions: ConsumptionDto[]): AmbienteCarga[] {
    const ambientesMap = new Map<string, AmbienteCarga>();
    
    // Inicializar environments con surfaces
    for (const surface of surfaces) {
      ambientesMap.set(surface.name, {
        name: surface.name,
        area_m2: surface.area_m2,
        consumptions: [],
        carga_va: 0,
        fp_efectivo: 1.0,
        observaciones: [],
      });
    }
    
    // Agrupar consumptions por environment
    for (const consumption of consumptions) {
      const environment = ambientesMap.get(consumption.environment);
      if (environment) {
        environment.consumptions.push(consumption);
      } else {
        this.logger.warn(`environment '${consumption.environment}' no encontrado en surfaces`);
      }
    }
    
    return Array.from(ambientesMap.values());
  }

  /**
   * Calcular loads por environment
   */
  private async calculateAmbienteCargas(environments: AmbienteCarga[]): Promise<AmbienteCarga[]> {
    const lightingVaPerM2 = await this.normParamService.getParamAsNumber('lighting_va_per_m2');
    
    for (const environment of environments) {
      // Calcular load base de iluminación
      const cargaIluminacion = environment.area_m2 * lightingVaPerM2;
      
      // Calcular load de consumptions definidos
      let cargaConsumos = 0;
      let potenciaActiva = 0;
      let potenciaReactiva = 0;
      
      for (const consumption of environment.consumptions) {
        const fp = consumption.fp || 0.9; // Factor de potencia por defecto
        const potenciaVa = consumption.power_w / fp;
        
        cargaConsumos += potenciaVa;
        potenciaActiva += consumption.power_w;
        potenciaReactiva += potenciaVa * Math.sqrt(1 - fp * fp);
      }
      
      // load total del environment
      environment.carga_va = cargaIluminacion + cargaConsumos;
      
      // Factor de potencia efectivo
      if (environment.carga_va > 0) {
        const fpEfectivo = potenciaActiva / environment.carga_va;
        environment.fp_efectivo = Math.max(0.1, Math.min(1.0, fpEfectivo));
      } else {
        environment.fp_efectivo = 1.0;
      }
      
      // Observaciones
      environment.observaciones = [];
      if (cargaIluminacion > 0) {
        environment.observaciones.push(`Iluminación base: ${cargaIluminacion.toFixed(1)} VA (${lightingVaPerM2} VA/m²)`);
      }
      if (cargaConsumos > 0) {
        environment.observaciones.push(`consumptions definidos: ${cargaConsumos.toFixed(1)} VA`);
      }
      if (environment.consumptions.length === 0) {
        environment.observaciones.push('Solo load base de iluminación');
      }
    }
    
    return environments;
  }

  /**
   * Calcular totales del system
   */
  private calculateTotales(environments: AmbienteCarga[], system: SystemConfigDto): TotalesDto {
    const cargaTotalVa = environments.reduce((sum, amb) => sum + amb.carga_va, 0);
    const cargaDiversificadaVa = cargaTotalVa; // Por ahora sin factor de diversificación
    const voltage = system.voltage || 120;
    const phases = system.phases || 1;
    const corrienteTotalA = cargaDiversificadaVa / voltage;
    
    return {
      carga_total_va: Math.round(cargaTotalVa * 100) / 100,
      carga_diversificada_va: Math.round(cargaDiversificadaVa * 100) / 100,
      corriente_total_a: Math.round(corrienteTotalA * 100) / 100,
      voltage_v: voltage,
      phases: phases,
    };
  }

  /**
   * Registrar métricas Prometheus
   */
  private recordMetrics(environments: AmbienteCarga[], duration: number): void {
    const totalVa = environments.reduce((sum, amb) => sum + amb.carga_va, 0);
    
    // Métricas específicas de CE-01
    this.metricsService.incrementCalcRuns('rooms', 'success');
    this.metricsService.observeCalcDuration('rooms', duration / 1000); // Convertir a segundos
    
    // Métricas adicionales
    this.metricsService.incrementCalcRuns('env_total_va', 'success');
    this.metricsService.observeCalcDuration('env_duration_ms', duration);
    
    this.logger.debug(`Métricas registradas: total_va=${totalVa.toFixed(1)}, duration=${duration}ms`);
  }
}

