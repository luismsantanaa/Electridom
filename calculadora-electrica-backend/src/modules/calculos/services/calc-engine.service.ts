import { Injectable, Logger } from '@nestjs/common';
import { NormParamService } from './norm-param.service';
import { MetricsService } from '../../metrics/metrics.service';
import { 
  CalcRoomsRequestDto, 
  SuperficieDto, 
  ConsumoDto, 
  SystemConfigDto 
} from '../dtos/calc-rooms-request.dto';
import { 
  CalcRoomsResponseDto, 
  AmbienteResultDto, 
  TotalesDto 
} from '../dtos/calc-rooms-response.dto';

interface AmbienteCarga {
  nombre: string;
  area_m2: number;
  consumos: ConsumoDto[];
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
   * Calcular cargas por ambiente
   */
  async calcByRoom(request: CalcRoomsRequestDto): Promise<CalcRoomsResponseDto> {
    const startTime = Date.now();
    
    try {
      this.logger.log('Iniciando cálculo de cargas por ambiente');
      
      // Configuración del sistema
      const system = request.system || { voltage: 120, phases: 1, frequency: 60 };
      
      // Agrupar consumos por ambiente
      const ambientesCarga = this.groupConsumosByAmbiente(request.superficies, request.consumos);
      
      // Calcular cargas por ambiente
      const resultadosAmbientes = await this.calculateAmbienteCargas(ambientesCarga);
      
      // Calcular totales
      const totales = this.calculateTotales(resultadosAmbientes, system);
      
      // Registrar métricas
      const duration = Date.now() - startTime;
      this.recordMetrics(resultadosAmbientes, duration);
      
      this.logger.log(`Cálculo completado en ${duration}ms`);
      
      return {
        ambientes: resultadosAmbientes.map(amb => ({
          nombre: amb.nombre,
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
      this.logger.error('Error en cálculo de cargas por ambiente:', error.message);
      throw error;
    }
  }

  /**
   * Agrupar consumos por ambiente
   */
  private groupConsumosByAmbiente(superficies: SuperficieDto[], consumos: ConsumoDto[]): AmbienteCarga[] {
    const ambientesMap = new Map<string, AmbienteCarga>();
    
    // Inicializar ambientes con superficies
    for (const superficie of superficies) {
      ambientesMap.set(superficie.nombre, {
        nombre: superficie.nombre,
        area_m2: superficie.area_m2,
        consumos: [],
        carga_va: 0,
        fp_efectivo: 1.0,
        observaciones: [],
      });
    }
    
    // Agrupar consumos por ambiente
    for (const consumo of consumos) {
      const ambiente = ambientesMap.get(consumo.ambiente);
      if (ambiente) {
        ambiente.consumos.push(consumo);
      } else {
        this.logger.warn(`Ambiente '${consumo.ambiente}' no encontrado en superficies`);
      }
    }
    
    return Array.from(ambientesMap.values());
  }

  /**
   * Calcular cargas por ambiente
   */
  private async calculateAmbienteCargas(ambientes: AmbienteCarga[]): Promise<AmbienteCarga[]> {
    const lightingVaPerM2 = await this.normParamService.getParamAsNumber('lighting_va_per_m2');
    
    for (const ambiente of ambientes) {
      // Calcular carga base de iluminación
      const cargaIluminacion = ambiente.area_m2 * lightingVaPerM2;
      
      // Calcular carga de consumos definidos
      let cargaConsumos = 0;
      let potenciaActiva = 0;
      let potenciaReactiva = 0;
      
      for (const consumo of ambiente.consumos) {
        const fp = consumo.fp || 0.9; // Factor de potencia por defecto
        const potenciaVa = consumo.potencia_w / fp;
        
        cargaConsumos += potenciaVa;
        potenciaActiva += consumo.potencia_w;
        potenciaReactiva += potenciaVa * Math.sqrt(1 - fp * fp);
      }
      
      // Carga total del ambiente
      ambiente.carga_va = cargaIluminacion + cargaConsumos;
      
      // Factor de potencia efectivo
      if (ambiente.carga_va > 0) {
        const fpEfectivo = potenciaActiva / ambiente.carga_va;
        ambiente.fp_efectivo = Math.max(0.1, Math.min(1.0, fpEfectivo));
      } else {
        ambiente.fp_efectivo = 1.0;
      }
      
      // Observaciones
      ambiente.observaciones = [];
      if (cargaIluminacion > 0) {
        ambiente.observaciones.push(`Iluminación base: ${cargaIluminacion.toFixed(1)} VA (${lightingVaPerM2} VA/m²)`);
      }
      if (cargaConsumos > 0) {
        ambiente.observaciones.push(`Consumos definidos: ${cargaConsumos.toFixed(1)} VA`);
      }
      if (ambiente.consumos.length === 0) {
        ambiente.observaciones.push('Solo carga base de iluminación');
      }
    }
    
    return ambientes;
  }

  /**
   * Calcular totales del sistema
   */
  private calculateTotales(ambientes: AmbienteCarga[], system: SystemConfigDto): TotalesDto {
    const cargaTotalVa = ambientes.reduce((sum, amb) => sum + amb.carga_va, 0);
    const cargaDiversificadaVa = cargaTotalVa; // Por ahora sin factor de diversificación
    const voltage = system.voltage || 120;
    const phases = system.phases || 1;
    const corrienteTotalA = cargaDiversificadaVa / voltage;
    
    return {
      carga_total_va: Math.round(cargaTotalVa * 100) / 100,
      carga_diversificada_va: Math.round(cargaDiversificadaVa * 100) / 100,
      corriente_total_a: Math.round(corrienteTotalA * 100) / 100,
      tension_v: voltage,
      phases: phases,
    };
  }

  /**
   * Registrar métricas Prometheus
   */
  private recordMetrics(ambientes: AmbienteCarga[], duration: number): void {
    const totalVa = ambientes.reduce((sum, amb) => sum + amb.carga_va, 0);
    
    // Métricas específicas de CE-01
    this.metricsService.incrementCalcRuns('rooms', 'success');
    this.metricsService.observeCalcDuration('rooms', duration / 1000); // Convertir a segundos
    
    // Métricas adicionales
    this.metricsService.incrementCalcRuns('env_total_va', 'success');
    this.metricsService.observeCalcDuration('env_duration_ms', duration);
    
    this.logger.debug(`Métricas registradas: total_va=${totalVa.toFixed(1)}, duration=${duration}ms`);
  }
}
