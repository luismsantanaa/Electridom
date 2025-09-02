import { Injectable, Logger } from '@nestjs/common';
import { NormParamService } from './norm-param.service';

export interface ConductorInfo {
  calibre: string;
  seccionMM2: number;
  ampacidadBase: number;
  ampacidadCorregida: number;
  temperatura: number;
  agrupamiento: number;
  tipoAislamiento: string;
  material: 'COBRE' | 'ALUMINIO';
}

export interface ConductorSeleccionado {
  calibre: string;
  seccionMM2: number;
  ampacidadCorregida: number;
  ampacidadBase: number;
  factoresCorreccion: {
    temperatura: number;
    agrupamiento: number;
    total: number;
  };
  corrienteDiseño: number;
  margenSeguridad: number;
  cumpleNorma: boolean;
  recomendaciones: string[];
}

export interface FactoresCorreccion {
  temperatura: number;
  agrupamiento: number;
  tipoInstalacion: number;
  tipoAislamiento: number;
}

@Injectable()
export class ConductorSizerService {
  private readonly logger = new Logger(ConductorSizerService.name);

  constructor(private readonly normParamService: NormParamService) {}

  /**
   * Selecciona el calibre de conductor apropiado para la corriente de diseño
   * aplicando factores de corrección normativos
   */
  async seleccionarConductor(
    corrienteDiseño: number,
    temperatura: number = 30,
    agrupamiento: number = 1,
    tipoInstalacion: string = 'TUBO_EMBUTIDO',
    tipoAislamion: string = 'THHN',
    material: 'COBRE' | 'ALUMINIO' = 'COBRE',
    warnings: string[] = [],
  ): Promise<ConductorSeleccionado> {
    this.logger.log('Iniciando selección de conductor', {
      corrienteDiseño,
      temperatura,
      agrupamiento,
      tipoInstalacion,
      tipoAislamion,
      material,
    });

    try {
      // Obtener tablas de conductores
      const tablaConductores = await this.obtenerTablaConductores(
        material,
        warnings,
      );

      // Calcular factores de corrección
      const factores = await this.calcularFactoresCorreccion(
        temperatura,
        agrupamiento,
        tipoInstalacion,
        tipoAislamion,
        warnings,
      );

      // Seleccionar conductor apropiado
      const conductor = this.seleccionarConductorApropiado(
        tablaConductores,
        corrienteDiseño,
        factores,
      );

      // Validar selección
      const validacion = this.validarSeleccionConductor(
        conductor,
        corrienteDiseño,
        factores,
      );

      this.logger.log('Selección de conductor completada', {
        calibre: conductor.calibre,
        ampacidadCorregida: conductor.ampacidadCorregida,
        margenSeguridad: validacion.margenSeguridad,
      });

      return {
        ...conductor,
        corrienteDiseño,
        margenSeguridad: validacion.margenSeguridad,
        cumpleNorma: validacion.cumpleNorma,
        recomendaciones: validacion.recomendaciones,
        factoresCorreccion: {
          temperatura: factores.temperatura,
          agrupamiento: factores.agrupamiento,
          total:
            factores.temperatura *
            factores.agrupamiento *
            factores.tipoInstalacion *
            factores.tipoAislamiento,
        },
      };
    } catch (error) {
      this.logger.error('Error en selección de conductor', error);
      throw error;
    }
  }

  /**
   * Obtiene la tabla de conductores según el material
   */
  private async obtenerTablaConductores(
    material: string,
    warnings: string[],
  ): Promise<ConductorInfo[]> {
    try {
      const tabla = await this.normParamService.getParam('TABLA_CONDUCTORES');
      const tablaParsed = JSON.parse(tabla);

      if (!tablaParsed || !tablaParsed[material]) {
        this.logger.warn(
          `Tabla de conductores no encontrada para material: ${material}`,
          { warnings },
        );

        // Tabla por defecto para cobre (NEC 2023)
        return this.obtenerTablaConductoresDefault(material);
      }

      return tablaParsed[material];
    } catch (error) {
      this.logger.warn(
        `Usando tabla por defecto debido a error: ${error.message}`,
        { warnings },
      );
      return this.obtenerTablaConductoresDefault(material);
    }
  }

  /**
   * Tabla por defecto de conductores según NEC 2023
   */
  private obtenerTablaConductoresDefault(material: string): ConductorInfo[] {
    if (material === 'COBRE') {
      return [
        {
          calibre: 'AWG 14',
          seccionMM2: 2.08,
          ampacidadBase: 20,
          ampacidadCorregida: 20,
          temperatura: 30,
          agrupamiento: 1,
          tipoAislamiento: 'THHN',
          material: 'COBRE',
        },
        {
          calibre: 'AWG 12',
          seccionMM2: 3.31,
          ampacidadBase: 25,
          ampacidadCorregida: 25,
          temperatura: 30,
          agrupamiento: 1,
          tipoAislamiento: 'THHN',
          material: 'COBRE',
        },
        {
          calibre: 'AWG 10',
          seccionMM2: 5.26,
          ampacidadBase: 35,
          ampacidadCorregida: 35,
          temperatura: 30,
          agrupamiento: 1,
          tipoAislamiento: 'THHN',
          material: 'COBRE',
        },
        {
          calibre: 'AWG 8',
          seccionMM2: 8.37,
          ampacidadBase: 50,
          ampacidadCorregida: 50,
          temperatura: 30,
          agrupamiento: 1,
          tipoAislamiento: 'THHN',
          material: 'COBRE',
        },
        {
          calibre: 'AWG 6',
          seccionMM2: 13.3,
          ampacidadBase: 65,
          ampacidadCorregida: 65,
          temperatura: 30,
          agrupamiento: 1,
          tipoAislamiento: 'THHN',
          material: 'COBRE',
        },
        {
          calibre: 'AWG 4',
          seccionMM2: 21.2,
          ampacidadBase: 85,
          ampacidadCorregida: 85,
          temperatura: 30,
          agrupamiento: 1,
          tipoAislamiento: 'THHN',
          material: 'COBRE',
        },
        {
          calibre: 'AWG 2',
          seccionMM2: 33.6,
          ampacidadBase: 115,
          ampacidadCorregida: 115,
          temperatura: 30,
          agrupamiento: 1,
          tipoAislamiento: 'THHN',
          material: 'COBRE',
        },
        {
          calibre: 'AWG 1',
          seccionMM2: 42.4,
          ampacidadBase: 130,
          ampacidadCorregida: 130,
          temperatura: 30,
          agrupamiento: 1,
          tipoAislamiento: 'THHN',
          material: 'COBRE',
        },
        {
          calibre: 'AWG 1/0',
          seccionMM2: 53.5,
          ampacidadBase: 150,
          ampacidadCorregida: 150,
          temperatura: 30,
          agrupamiento: 1,
          tipoAislamiento: 'THHN',
          material: 'COBRE',
        },
        {
          calibre: 'AWG 2/0',
          seccionMM2: 67.4,
          ampacidadBase: 175,
          ampacidadCorregida: 175,
          temperatura: 30,
          agrupamiento: 1,
          tipoAislamiento: 'THHN',
          material: 'COBRE',
        },
        {
          calibre: 'AWG 3/0',
          seccionMM2: 85.0,
          ampacidadBase: 200,
          ampacidadCorregida: 200,
          temperatura: 30,
          agrupamiento: 1,
          tipoAislamiento: 'THHN',
          material: 'COBRE',
        },
        {
          calibre: 'AWG 4/0',
          seccionMM2: 107.2,
          ampacidadBase: 230,
          ampacidadCorregida: 230,
          temperatura: 30,
          agrupamiento: 1,
          tipoAislamiento: 'THHN',
          material: 'COBRE',
        },
      ];
    } else {
      // Tabla para aluminio (factor 0.78 respecto al cobre)
      return [
        {
          calibre: 'AWG 12',
          seccionMM2: 3.31,
          ampacidadBase: 20,
          ampacidadCorregida: 20,
          temperatura: 30,
          agrupamiento: 1,
          tipoAislamiento: 'THHN',
          material: 'ALUMINIO',
        },
        {
          calibre: 'AWG 10',
          seccionMM2: 5.26,
          ampacidadBase: 30,
          ampacidadCorregida: 30,
          temperatura: 30,
          agrupamiento: 1,
          tipoAislamiento: 'THHN',
          material: 'ALUMINIO',
        },
        {
          calibre: 'AWG 8',
          seccionMM2: 8.37,
          ampacidadBase: 40,
          ampacidadCorregida: 40,
          temperatura: 30,
          agrupamiento: 1,
          tipoAislamiento: 'THHN',
          material: 'ALUMINIO',
        },
        {
          calibre: 'AWG 6',
          seccionMM2: 13.3,
          ampacidadBase: 55,
          ampacidadCorregida: 55,
          temperatura: 30,
          agrupamiento: 1,
          tipoAislamiento: 'THHN',
          material: 'ALUMINIO',
        },
        {
          calibre: 'AWG 4',
          seccionMM2: 21.2,
          ampacidadBase: 70,
          ampacidadCorregida: 70,
          temperatura: 30,
          agrupamiento: 1,
          tipoAislamiento: 'THHN',
          material: 'ALUMINIO',
        },
        {
          calibre: 'AWG 2',
          seccionMM2: 33.6,
          ampacidadBase: 95,
          ampacidadCorregida: 95,
          temperatura: 30,
          agrupamiento: 1,
          tipoAislamiento: 'THHN',
          material: 'ALUMINIO',
        },
        {
          calibre: 'AWG 1',
          seccionMM2: 42.4,
          ampacidadBase: 115,
          ampacidadCorregida: 115,
          temperatura: 30,
          agrupamiento: 1,
          tipoAislamiento: 'THHN',
          material: 'ALUMINIO',
        },
        {
          calibre: 'AWG 1/0',
          seccionMM2: 53.5,
          ampacidadBase: 135,
          ampacidadCorregida: 135,
          temperatura: 30,
          agrupamiento: 1,
          tipoAislamiento: 'THHN',
          material: 'ALUMINIO',
        },
        {
          calibre: 'AWG 2/0',
          seccionMM2: 67.4,
          ampacidadBase: 155,
          ampacidadCorregida: 155,
          temperatura: 30,
          agrupamiento: 1,
          tipoAislamiento: 'THHN',
          material: 'ALUMINIO',
        },
        {
          calibre: 'AWG 3/0',
          seccionMM2: 85.0,
          ampacidadBase: 180,
          ampacidadCorregida: 180,
          temperatura: 30,
          agrupamiento: 1,
          tipoAislamiento: 'THHN',
          material: 'ALUMINIO',
        },
        {
          calibre: 'AWG 4/0',
          seccionMM2: 107.2,
          ampacidadBase: 205,
          ampacidadCorregida: 205,
          temperatura: 30,
          agrupamiento: 1,
          tipoAislamiento: 'THHN',
          material: 'ALUMINIO',
        },
      ];
    }
  }

  /**
   * Calcula los factores de corrección aplicables
   */
  private async calcularFactoresCorreccion(
    temperatura: number,
    agrupamiento: number,
    tipoInstalacion: string,
    tipoAislamion: string,
    warnings: string[],
  ): Promise<FactoresCorreccion> {
    // Factor de temperatura
    const factorTemperatura = this.calcularFactorTemperatura(temperatura);

    // Factor de agrupamiento
    const factorAgrupamiento = this.calcularFactorAgrupamiento(agrupamiento);

    // Factor de tipo de instalación
    const factorTipoInstalacion = await this.obtenerFactorTipoInstalacion(
      tipoInstalacion,
      warnings,
    );

    // Factor de tipo de aislamiento
    const factorTipoAislamion = await this.obtenerFactorTipoAislamion(
      tipoAislamion,
      warnings,
    );

    const factores: FactoresCorreccion = {
      temperatura: factorTemperatura,
      agrupamiento: factorAgrupamiento,
      tipoInstalacion: factorTipoInstalacion,
      tipoAislamiento: factorTipoAislamion,
    };

    this.logger.debug('Factores de corrección calculados', factores);
    return factores;
  }

  /**
   * Calcula el factor de corrección por temperatura
   */
  private calcularFactorTemperatura(temperatura: number): number {
    // Tabla de corrección por temperatura (NEC 2023)
    const correccionesTemperatura: Record<number, number> = {
      20: 1.08,
      25: 1.04,
      30: 1.0,
      35: 0.96,
      40: 0.91,
      45: 0.87,
      50: 0.82,
      55: 0.76,
      60: 0.71,
      65: 0.65,
      70: 0.58,
      75: 0.5,
      80: 0.41,
      85: 0.33,
      90: 0.25,
    };

    // Encontrar el factor más cercano
    const temperaturas = Object.keys(correccionesTemperatura)
      .map(Number)
      .sort((a, b) => a - b);

    // Si la temperatura es menor o igual a la mínima, usar la mínima
    if (temperatura <= temperaturas[0]) {
      return correccionesTemperatura[temperaturas[0]];
    }

    // Si la temperatura es mayor o igual a la máxima, usar la máxima
    if (temperatura >= temperaturas[temperaturas.length - 1]) {
      return correccionesTemperatura[temperaturas[temperaturas.length - 1]];
    }

    // Encontrar la temperatura más cercana
    let temperaturaAplicable = temperaturas[0];
    for (const temp of temperaturas) {
      if (temperatura <= temp) {
        temperaturaAplicable = temp;
        break;
      }
    }

    return correccionesTemperatura[temperaturaAplicable] || 1.0;
  }

  /**
   * Calcula el factor de corrección por agrupamiento
   */
  private calcularFactorAgrupamiento(agrupamiento: number): number {
    // Tabla de corrección por agrupamiento (NEC 2023)
    const correccionesAgrupamiento: Record<number, number> = {
      1: 1.0,
      2: 0.8,
      3: 0.7,
      4: 0.65,
      5: 0.6,
      6: 0.56,
      7: 0.52,
      8: 0.49,
      9: 0.47,
      10: 0.45,
      11: 0.44,
      12: 0.42,
      13: 0.41,
      14: 0.4,
      15: 0.39,
      16: 0.38,
      17: 0.37,
      18: 0.36,
      19: 0.35,
      20: 0.34,
    };

    // Encontrar el factor más cercano
    if (agrupamiento <= 1) return 1.0;
    if (agrupamiento >= 20) return 0.34;

    return correccionesAgrupamiento[agrupamiento] || 0.34;
  }

  /**
   * Obtiene el factor de corrección por tipo de instalación
   */
  private async obtenerFactorTipoInstalacion(
    tipoInstalacion: string,
    warnings: string[],
  ): Promise<number> {
    try {
      const factores = await this.normParamService.getParam(
        'FACTORES_TIPO_INSTALACION',
      );
      const factoresParsed = JSON.parse(factores);

      if (factoresParsed && factoresParsed[tipoInstalacion]) {
        return factoresParsed[tipoInstalacion];
      }
    } catch (error) {
      this.logger.warn(
        `Usando factores por defecto debido a error: ${error.message}`,
        { warnings },
      );
    }

    // Factores por defecto
    const factoresDefault: Record<string, number> = {
      TUBO_EMBUTIDO: 0.8,
      TUBO_VISTO: 0.85,
      CANALIZACION: 0.9,
      AIRE_LIBRE: 1.0,
      TIERRA_DIRECTA: 0.7,
    };

    return factoresDefault[tipoInstalacion] || 0.8;
  }

  /**
   * Obtiene el factor de corrección por tipo de aislamiento
   */
  private async obtenerFactorTipoAislamion(
    tipoAislamion: string,
    warnings: string[],
  ): Promise<number> {
    try {
      const factores = await this.normParamService.getParam(
        'FACTORES_TIPO_AISLAMIENTO',
      );
      const factoresParsed = JSON.parse(factores);

      if (factoresParsed && factoresParsed[tipoAislamion]) {
        return factoresParsed[tipoAislamion];
      }
    } catch (error) {
      this.logger.warn(
        `Usando factores por defecto debido a error: ${error.message}`,
        { warnings },
      );
    }

    // Factores por defecto
    const factoresDefault: Record<string, number> = {
      THHN: 1.0,
      THW: 0.88,
      THWN: 0.88,
      XHHW: 0.88,
      USE: 0.88,
      RHW: 0.88,
    };

    return factoresDefault[tipoAislamion] || 1.0;
  }

  /**
   * Selecciona el conductor apropiado según la corriente de diseño
   */
  private seleccionarConductorApropiado(
    tablaConductores: ConductorInfo[],
    corrienteDiseño: number,
    factores: FactoresCorreccion,
  ): ConductorInfo {
    // Ordenar conductores por ampacidad base (ascendente)
    const conductoresOrdenados = [...tablaConductores].sort(
      (a, b) => a.ampacidadBase - b.ampacidadBase,
    );

    // Calcular factor de corrección total
    const factorTotal =
      factores.temperatura *
      factores.agrupamiento *
      factores.tipoInstalacion *
      factores.tipoAislamiento;

    // Buscar el primer conductor que cumpla con la corriente de diseño
    for (const conductor of conductoresOrdenados) {
      const ampacidadCorregida = conductor.ampacidadBase * factorTotal;

      if (ampacidadCorregida >= corrienteDiseño) {
        return {
          ...conductor,
          ampacidadCorregida: Math.round(ampacidadCorregida * 100) / 100,
        };
      }
    }

    // Si no se encuentra, devolver el conductor más grande disponible
    const conductorMaximo =
      conductoresOrdenados[conductoresOrdenados.length - 1];
    return {
      ...conductorMaximo,
      ampacidadCorregida:
        Math.round(conductorMaximo.ampacidadBase * factorTotal * 100) / 100,
    };
  }

  /**
   * Valida la selección del conductor
   */
  private validarSeleccionConductor(
    conductor: ConductorInfo,
    corrienteDiseño: number,
    factores: FactoresCorreccion,
  ): {
    margenSeguridad: number;
    cumpleNorma: boolean;
    recomendaciones: string[];
  } {
    const margenSeguridad =
      ((conductor.ampacidadCorregida - corrienteDiseño) / corrienteDiseño) *
      100;
    const cumpleNorma = conductor.ampacidadCorregida >= corrienteDiseño;

    const recomendaciones: string[] = [];

    if (margenSeguridad < 20) {
      recomendaciones.push(
        'Considerar conductor de calibre superior para mayor margen de seguridad',
      );
    }

    if (factores.temperatura < 0.8) {
      recomendaciones.push(
        'Atención: Factor de temperatura bajo, verificar condiciones de instalación',
      );
    }

    if (factores.agrupamiento < 0.7) {
      recomendaciones.push(
        'Atención: Factor de agrupamiento bajo, considerar separación de conductores',
      );
    }

    if (conductor.ampacidadCorregida > corrienteDiseño * 2) {
      recomendaciones.push(
        'Conductor sobredimensionado, considerar calibre inferior para optimización de costos',
      );
    }

    return {
      margenSeguridad: Math.round(margenSeguridad * 100) / 100,
      cumpleNorma,
      recomendaciones,
    };
  }
}
