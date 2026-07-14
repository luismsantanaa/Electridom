import { Injectable, Logger } from '@nestjs/common';
import { NormParamService } from './norm-param.service';

export interface SistemaElectrico {
  tensionNominal: number; // voltios
  potenciaAparente: number; // VA
  factorPotencia: number;
  tipoSistema: 'MONOFASICO' | 'TRIFASICO';
  impedanciaFuente: number; // ohmios
  factorK: number; // factor de multiplicación para corriente de arranque
}

export interface CircuitoAnalisis {
  id: string;
  tipo: string;
  corrienteNominal: number; // amperios
  longitud: number; // metros
  material: string; // 'COBRE' | 'ALUMINIO'
  seccion: number; // mm²
  tipoInstalacion: string;
  temperatura: number; // °C
  proteccion: {
    tipo: string;
    amperaje: number;
    curva: string;
    corrienteInterruptora: number;
  };
}

export interface AnalisisCortocircuito {
  circuitoId: string;
  corrienteCortocircuito: number; // amperios
  corrienteArranque: number; // amperios
  tiempoInterrupcion: number; // segundos
  energiaIncidente: number; // A²s
  cumpleNorma: boolean;
  factorSeguridad: number;
  recomendaciones: string[];
  detallesCalculo: {
    impedanciaTotal: number;
    reactanciaTotal: number;
    resistenciaTotal: number;
    factorCorreccion: number;
  };
}

export interface LimitesCortocircuito {
  corrienteMinima: number; // amperios
  tiempoMaximo: number; // segundos
  energiaMaxima: number; // A²s
  factorSeguridadMinimo: number;
}

@Injectable()
export class ShortCircuitService {
  private readonly logger = new Logger(ShortCircuitService.name);

  constructor(private readonly normParamService: NormParamService) {}

  /**
   * Analiza la capacidad de cortocircuito de un circuito
   */
  async analizarCortocircuito(
    sistema: SistemaElectrico,
    circuito: CircuitoAnalisis,
    warnings: string[] = [],
  ): Promise<AnalisisCortocircuito> {
    try {
      // Obtener límites normativos
      const limites = await this.obtenerLimitesNormativos(warnings);

      // Calcular impedancia del circuito
      const impedanciaCircuito = this.calcularImpedanciaCircuito(
        circuito.material,
        circuito.seccion,
        circuito.longitud,
        circuito.temperatura,
        circuito.tipoInstalacion,
      );

      // Calcular impedancia total del sistema
      const impedanciaTotal = this.calcularImpedanciaTotal(
        sistema.impedanciaFuente,
        impedanciaCircuito,
        sistema.tipoSistema,
      );

      // Calcular corriente de cortocircuito
      const corrienteCortocircuito = this.calcularCorrienteCortocircuito(
        sistema.tensionNominal,
        impedanciaTotal,
        sistema.tipoSistema,
      );

      // Calcular corriente de arranque
      const corrienteArranque = this.calcularCorrienteArranque(
        circuito.corrienteNominal,
        sistema.factorK,
        circuito.tipo,
      );

      // Calcular tiempo de interrupción
      const tiempoInterrupcion = this.calcularTiempoInterrupcion(
        corrienteCortocircuito,
        circuito.proteccion,
        sistema.tipoSistema,
      );

      // Calcular energía incidente
      const energiaIncidente = this.calcularEnergiaIncidente(
        corrienteCortocircuito,
        tiempoInterrupcion,
      );

      // Validar si cumple norma
      const cumpleNorma = this.validarCumplimientoNorma(
        corrienteCortocircuito,
        tiempoInterrupcion,
        energiaIncidente,
        limites,
      );

      // Calcular factor de seguridad
      const factorSeguridad = this.calcularFactorSeguridad(
        corrienteCortocircuito,
        circuito.proteccion.corrienteInterruptora,
      );

      // Generar recomendaciones
      const recomendaciones = this.generarRecomendaciones(
        corrienteCortocircuito,
        tiempoInterrupcion,
        energiaIncidente,
        cumpleNorma,
        factorSeguridad,
        limites,
        circuito,
      );

      return {
        circuitoId: circuito.id,
        corrienteCortocircuito,
        corrienteArranque,
        tiempoInterrupcion,
        energiaIncidente,
        cumpleNorma,
        factorSeguridad,
        recomendaciones,
        detallesCalculo: {
          impedanciaTotal,
          reactanciaTotal: impedanciaTotal * 0.8, // Aproximación
          resistenciaTotal: impedanciaTotal * 0.6, // Aproximación
          factorCorreccion: this.calcularFactorCorreccion(circuito.temperatura),
        },
      };
    } catch (error) {
      this.logger.error('Error analizando cortocircuito', error);
      throw new Error(`Error en análisis de cortocircuito: ${error.message}`);
    }
  }

  /**
   * Analiza múltiples circuitos
   */
  async analizarCortocircuitoMultiple(
    sistema: SistemaElectrico,
    circuitos: CircuitoAnalisis[],
  ): Promise<AnalisisCortocircuito[]> {
    const resultados: AnalisisCortocircuito[] = [];
    const warnings: string[] = [];

    for (const circuito of circuitos) {
      try {
        const resultado = await this.analizarCortocircuito(
          sistema,
          circuito,
          warnings,
        );
        resultados.push(resultado);
      } catch (error) {
        this.logger.warn(`Error en circuito ${circuito.id}: ${error.message}`);
        warnings.push(`Circuito ${circuito.id}: ${error.message}`);
      }
    }

    return resultados;
  }

  /**
   * Obtiene los límites normativos de cortocircuito
   */
  private async obtenerLimitesNormativos(
    warnings: string[],
  ): Promise<LimitesCortocircuito> {
    try {
      const limites = await this.normParamService.getParam('LIMITES_CORTOCIRCUITO');
      const limitesParsed = JSON.parse(limites);

      if (!limitesParsed) {
        this.logger.warn(
          'Límites de cortocircuito no encontrados, usando valores por defecto',
          { warnings },
        );
        return this.obtenerLimitesPorDefecto();
      }

      return limitesParsed;
    } catch (error) {
      this.logger.warn(
        'Usando límites por defecto debido a error',
        { warnings },
      );
      return this.obtenerLimitesPorDefecto();
    }
  }

  /**
   * Límites por defecto según estándares internacionales
   */
  private obtenerLimitesPorDefecto(): LimitesCortocircuito {
    return {
      corrienteMinima: 100, // 100A mínimo para activar protecciones
      tiempoMaximo: 0.1, // 100ms máximo para interrupción
      energiaMaxima: 100000, // 100kA²s máximo
      factorSeguridadMinimo: 1.5, // Factor de seguridad mínimo
    };
  }

  /**
   * Calcula la impedancia del circuito
   */
  private calcularImpedanciaCircuito(
    material: string,
    seccion: number,
    longitud: number,
    temperatura: number,
    tipoInstalacion: string,
  ): number {
    // Resistencia del conductor
    const resistencia = this.calcularResistencia(
      material,
      seccion,
      longitud,
      temperatura,
    );

    // Reactancia del conductor
    const reactancia = this.calcularReactancia(
      seccion,
      longitud,
      tipoInstalacion,
    );

    // Impedancia = √(R² + X²)
    return Math.sqrt(resistencia * resistencia + reactancia * reactancia);
  }

  /**
   * Calcula la resistencia del conductor
   */
  private calcularResistencia(
    material: string,
    seccion: number,
    longitud: number,
    temperatura: number,
  ): number {
    // Resistividad base a 20°C (ohmios·mm²/m)
    const resistividadBase = material.toUpperCase() === 'COBRE' ? 0.0172 : 0.0283;

    // Factor de corrección por temperatura
    const factorTemperatura = this.calcularFactorCorreccionTemperatura(
      material,
      temperatura,
    );

    return (resistividadBase * longitud * factorTemperatura) / seccion;
  }

  /**
   * Calcula el factor de corrección por temperatura
   */
  private calcularFactorCorreccionTemperatura(
    material: string,
    temperatura: number,
  ): number {
    const coeficienteTemperatura = material.toUpperCase() === 'COBRE' ? 0.00393 : 0.00403;
    return 1 + coeficienteTemperatura * (temperatura - 20);
  }

  /**
   * Calcula la reactancia del conductor
   */
  private calcularReactancia(
    seccion: number,
    longitud: number,
    tipoInstalacion: string,
  ): number {
    // Reactancia aproximada por metro (ohmios/m)
    let reactanciaPorMetro = 0.0001;

    switch (tipoInstalacion.toUpperCase()) {
      case 'TUBO':
        reactanciaPorMetro = 0.00015;
        break;
      case 'CANALIZACION':
        reactanciaPorMetro = 0.00012;
        break;
      case 'DIRECTO':
        reactanciaPorMetro = 0.00008;
        break;
    }

    // Ajustar según sección
    if (seccion > 50) {
      reactanciaPorMetro *= 0.8;
    } else if (seccion > 25) {
      reactanciaPorMetro *= 0.9;
    }

    return reactanciaPorMetro * longitud;
  }

  /**
   * Calcula la impedancia total del sistema
   */
  private calcularImpedanciaTotal(
    impedanciaFuente: number,
    impedanciaCircuito: number,
    tipoSistema: string,
  ): number {
    // Para sistemas trifásicos, la impedancia se reduce por √3
    const factorSistema = tipoSistema === 'TRIFASICO' ? Math.sqrt(3) : 1;

    // Impedancia total = impedancia fuente + impedancia circuito
    return impedanciaFuente + impedanciaCircuito / factorSistema;
  }

  /**
   * Calcula la corriente de cortocircuito
   */
  private calcularCorrienteCortocircuito(
    tension: number,
    impedancia: number,
    tipoSistema: string,
  ): number {
    // Icc = V / Z
    // Para trifásico: Icc = V / (Z × √3)
    const factorSistema = tipoSistema === 'TRIFASICO' ? Math.sqrt(3) : 1;

    return (tension / impedancia) * factorSistema;
  }

  /**
   * Calcula la corriente de arranque
   */
  private calcularCorrienteArranque(
    corrienteNominal: number,
    factorK: number,
    tipo: string,
  ): number {
    // Factor de arranque según tipo de carga
    let factorArranque = factorK;

    if (tipo.toUpperCase().includes('MOTOR')) {
      factorArranque = Math.max(factorK, 6); // Mínimo 6x para motores
    } else if (tipo.toUpperCase().includes('COMPRESOR')) {
      factorArranque = Math.max(factorK, 8); // Mínimo 8x para compresores
    }

    return corrienteNominal * factorArranque;
  }

  /**
   * Calcula el tiempo de interrupción
   */
  private calcularTiempoInterrupcion(
    corrienteCortocircuito: number,
    proteccion: any,
    tipoSistema: string,
  ): number {
    // Tiempo de interrupción basado en la curva de la protección
    const curva = proteccion.curva;
    const corrienteInterruptora = proteccion.corrienteInterruptora;

    // Tiempo base según curva (aproximado)
    let tiempoBase = 0.1; // 100ms por defecto

    switch (curva) {
      case 'B':
        tiempoBase = 0.05; // 50ms
        break;
      case 'C':
        tiempoBase = 0.1; // 100ms
        break;
      case 'D':
        tiempoBase = 0.2; // 200ms
        break;
      case 'K':
        tiempoBase = 0.15; // 150ms
        break;
      case 'Z':
        tiempoBase = 0.08; // 80ms
        break;
    }

    // Ajustar según relación Icc/Ir
    const relacionCorriente = corrienteCortocircuito / corrienteInterruptora;

    if (relacionCorriente > 10) {
      tiempoBase *= 0.5; // Interrupción más rápida para corrientes altas
    } else if (relacionCorriente < 3) {
      tiempoBase *= 2; // Interrupción más lenta para corrientes bajas
    }

    return tiempoBase;
  }

  /**
   * Calcula la energía incidente
   */
  private calcularEnergiaIncidente(
    corriente: number,
    tiempo: number,
  ): number {
    // E = I² × t
    return corriente * corriente * tiempo;
  }

  /**
   * Valida si cumple con las normas
   */
  private validarCumplimientoNorma(
    corriente: number,
    tiempo: number,
    energia: number,
    limites: LimitesCortocircuito,
  ): boolean {
    return (
      corriente >= limites.corrienteMinima &&
      tiempo <= limites.tiempoMaximo &&
      energia <= limites.energiaMaxima
    );
  }

  /**
   * Calcula el factor de seguridad
   */
  private calcularFactorSeguridad(
    corrienteCortocircuito: number,
    corrienteInterruptora: number,
  ): number {
    return corrienteInterruptora / corrienteCortocircuito;
  }

  /**
   * Calcula el factor de corrección general
   */
  private calcularFactorCorreccion(temperatura: number): number {
    if (temperatura <= 20) return 1.0;
    if (temperatura <= 30) return 1.05;
    if (temperatura <= 40) return 1.12;
    if (temperatura <= 50) return 1.20;
    if (temperatura <= 60) return 1.30;
    return 1.40;
  }

  /**
   * Genera recomendaciones basadas en el análisis
   */
  private generarRecomendaciones(
    corrienteCortocircuito: number,
    tiempoInterrupcion: number,
    energiaIncidente: number,
    cumpleNorma: boolean,
    factorSeguridad: number,
    limites: LimitesCortocircuito,
    circuito: CircuitoAnalisis,
  ): string[] {
    const recomendaciones: string[] = [];

    if (!cumpleNorma) {
      if (corrienteCortocircuito < limites.corrienteMinima) {
        recomendaciones.push(
          `La corriente de cortocircuito (${corrienteCortocircuito.toFixed(1)}A) es menor que el mínimo requerido (${limites.corrienteMinima}A)`,
        );
      }
      if (tiempoInterrupcion > limites.tiempoMaximo) {
        recomendaciones.push(
          `El tiempo de interrupción (${(tiempoInterrupcion * 1000).toFixed(1)}ms) excede el máximo permitido (${(limites.tiempoMaximo * 1000).toFixed(1)}ms)`,
        );
      }
      if (energiaIncidente > limites.energiaMaxima) {
        recomendaciones.push(
          `La energía incidente (${(energiaIncidente / 1000).toFixed(1)}kA²s) excede el máximo permitido (${(limites.energiaMaxima / 1000).toFixed(1)}kA²s)`,
        );
      }
    }

    if (factorSeguridad < limites.factorSeguridadMinimo) {
      recomendaciones.push(
        `El factor de seguridad (${factorSeguridad.toFixed(2)}) está por debajo del mínimo recomendado (${limites.factorSeguridadMinimo})`,
      );
    }

    // Recomendaciones de optimización
    if (factorSeguridad > 5) {
      recomendaciones.push(
        'El factor de seguridad es muy alto, considerar optimización de costos',
      );
    }

    if (tiempoInterrupcion < 0.05) {
      recomendaciones.push(
        'El tiempo de interrupción es muy rápido, verificar coordinación con otras protecciones',
      );
    }

    return recomendaciones;
  }
}
