import { Injectable, Logger } from '@nestjs/common';
import { NormParamService } from './norm-param.service';

export interface CircuitoVoltaje {
  id: string;
  tipo: string;
  longitud: number; // metros
  corriente: number; // amperios
  tension: number; // voltios
  material: string; // 'COBRE' | 'ALUMINIO'
  seccion: number; // mm²
  tipoInstalacion: string; // 'TUBO', 'CANALIZACION', 'DIRECTO'
  temperatura: number; // °C
}

export interface CalculoCaidaTension {
  circuitoId: string;
  caidaTension: number; // voltios
  caidaPorcentual: number; // %
  cumpleNorma: boolean;
  factorCorreccion: number;
  resistencia: number; // ohmios
  reactancia: number; // ohmios
  potenciaPerdida: number; // watts
  recomendaciones: string[];
}

export interface LimitesCaidaTension {
  iluminacion: number; // %
  tomacorrientes: number; // %
  motores: number; // %
  alimentadores: number; // %
  general: number; // %
}

@Injectable()
export class VoltageDropService {
  private readonly logger = new Logger(VoltageDropService.name);

  constructor(private readonly normParamService: NormParamService) {}

  /**
   * Calcula la caída de tensión para un circuito
   */
  async calcularCaidaTension(
    circuito: CircuitoVoltaje,
    warnings: string[] = [],
  ): Promise<CalculoCaidaTension> {
    try {
      // Obtener límites normativos
      const limites = await this.obtenerLimitesNormativos(warnings);

      // Calcular resistencia del conductor
      const resistencia = this.calcularResistencia(
        circuito.material,
        circuito.seccion,
        circuito.longitud,
        circuito.temperatura,
      );

      // Calcular reactancia (aproximada)
      const reactancia = this.calcularReactancia(
        circuito.seccion,
        circuito.longitud,
        circuito.tipoInstalacion,
      );

      // Calcular caída de tensión
      const caidaTension = this.calcularCaidaTensionReal(
        circuito.corriente,
        resistencia,
        reactancia,
        circuito.tension,
      );

      // Calcular porcentaje
      const caidaPorcentual = (caidaTension / circuito.tension) * 100;

      // Determinar límite aplicable
      const limiteAplicable = this.determinarLimiteAplicable(
        circuito.tipo,
        limites,
      );

      // Validar si cumple norma
      const cumpleNorma = caidaPorcentual <= limiteAplicable;

      // Generar recomendaciones
      const recomendaciones = this.generarRecomendaciones(
        caidaPorcentual,
        limiteAplicable,
        circuito,
      );

      // Calcular potencia perdida
      const potenciaPerdida = this.calcularPotenciaPerdida(
        circuito.corriente,
        resistencia,
      );

      return {
        circuitoId: circuito.id,
        caidaTension,
        caidaPorcentual,
        cumpleNorma,
        factorCorreccion: this.calcularFactorCorreccion(circuito.temperatura),
        resistencia,
        reactancia,
        potenciaPerdida,
        recomendaciones,
      };
    } catch (error) {
      this.logger.error('Error calculando caída de tensión', error);
      throw new Error(`Error en cálculo de caída de tensión: ${error.message}`);
    }
  }

  /**
   * Calcula la caída de tensión para múltiples circuitos
   */
  async calcularCaidaTensionMultiple(
    circuitos: CircuitoVoltaje[],
  ): Promise<CalculoCaidaTension[]> {
    const resultados: CalculoCaidaTension[] = [];
    const warnings: string[] = [];

    for (const circuito of circuitos) {
      try {
        const resultado = await this.calcularCaidaTension(circuito, warnings);
        resultados.push(resultado);
      } catch (error) {
        this.logger.warn(`Error en circuito ${circuito.id}: ${error.message}`);
        warnings.push(`Circuito ${circuito.id}: ${error.message}`);
      }
    }

    return resultados;
  }

  /**
   * Obtiene los límites normativos de caída de tensión
   */
  private async obtenerLimitesNormativos(
    warnings: string[],
  ): Promise<LimitesCaidaTension> {
    try {
      const limites = await this.normParamService.getParam('LIMITES_CAIDA_TENSION');
      const limitesParsed = JSON.parse(limites);

      if (!limitesParsed) {
        this.logger.warn(
          'Límites de caída de tensión no encontrados, usando valores por defecto',
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
  private obtenerLimitesPorDefecto(): LimitesCaidaTension {
    return {
      iluminacion: 3.0, // 3% máximo
      tomacorrientes: 5.0, // 5% máximo
      motores: 5.0, // 5% máximo
      alimentadores: 2.0, // 2% máximo
      general: 5.0, // 5% máximo
    };
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

    // Resistencia = (resistividad × longitud × factor_temperatura) / sección
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
    let reactanciaPorMetro = 0.0001; // Valor base

    // Ajustar según tipo de instalación
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

    // Ajustar según sección (reactancia disminuye con sección mayor)
    if (seccion > 50) {
      reactanciaPorMetro *= 0.8;
    } else if (seccion > 25) {
      reactanciaPorMetro *= 0.9;
    }

    return reactanciaPorMetro * longitud;
  }

  /**
   * Calcula la caída de tensión real
   */
  private calcularCaidaTensionReal(
    corriente: number,
    resistencia: number,
    reactancia: number,
    tension: number,
  ): number {
    // Para circuitos monofásicos: V = I × (R × cosφ + X × sinφ)
    // Asumimos factor de potencia 0.85 (cosφ = 0.85, sinφ = 0.53)
    const cosPhi = 0.85;
    const sinPhi = 0.53;

    const caidaResistiva = corriente * resistencia * cosPhi;
    const caidaReactiva = corriente * reactancia * sinPhi;

    return caidaResistiva + caidaReactiva;
  }

  /**
   * Calcula el factor de corrección general
   */
  private calcularFactorCorreccion(temperatura: number): number {
    // Factor de corrección por temperatura ambiente
    if (temperatura <= 20) return 1.0;
    if (temperatura <= 30) return 1.05;
    if (temperatura <= 40) return 1.12;
    if (temperatura <= 50) return 1.20;
    if (temperatura <= 60) return 1.30;
    return 1.40; // Para temperaturas superiores a 60°C
  }

  /**
   * Determina el límite aplicable según el tipo de circuito
   */
  private determinarLimiteAplicable(
    tipo: string,
    limites: LimitesCaidaTension,
  ): number {
    const tipoUpper = tipo.toUpperCase();

    if (tipoUpper.includes('ILU') || tipoUpper.includes('ILUMINACION')) {
      return limites.iluminacion;
    }
    if (tipoUpper.includes('TOM') || tipoUpper.includes('TOMACORRIENTES')) {
      return limites.tomacorrientes;
    }
    if (tipoUpper.includes('MOTOR') || tipoUpper.includes('COMPRESOR')) {
      return limites.motores;
    }
    if (tipoUpper.includes('ALIMENTADOR') || tipoUpper.includes('PRINCIPAL')) {
      return limites.alimentadores;
    }

    return limites.general;
  }

  /**
   * Genera recomendaciones basadas en el resultado
   */
  private generarRecomendaciones(
    caidaPorcentual: number,
    limiteAplicable: number,
    circuito: CircuitoVoltaje,
  ): string[] {
    const recomendaciones: string[] = [];

    if (caidaPorcentual > limiteAplicable) {
      recomendaciones.push(
        `La caída de tensión (${caidaPorcentual.toFixed(2)}%) excede el límite normativo (${limiteAplicable}%)`,
      );

      if (circuito.seccion < 50) {
        recomendaciones.push('Considerar aumentar la sección del conductor');
      }
      if (circuito.longitud > 100) {
        recomendaciones.push('Considerar reducir la longitud del circuito');
      }
      if (circuito.material.toUpperCase() === 'ALUMINIO') {
        recomendaciones.push('Considerar cambiar a conductor de cobre');
      }
    } else if (caidaPorcentual > limiteAplicable * 0.8) {
      recomendaciones.push(
        'La caída de tensión está cerca del límite, monitorear en condiciones de carga máxima',
      );
    }

    // Recomendaciones de optimización
    if (caidaPorcentual < limiteAplicable * 0.5) {
      recomendaciones.push(
        'El conductor puede estar sobredimensionado, evaluar optimización de costos',
      );
    }

    return recomendaciones;
  }

  /**
   * Calcula la potencia perdida en el conductor
   */
  private calcularPotenciaPerdida(corriente: number, resistencia: number): number {
    // P = I² × R
    return corriente * corriente * resistencia;
  }
}
