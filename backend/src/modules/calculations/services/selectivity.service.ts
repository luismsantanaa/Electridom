import { Injectable, Logger } from '@nestjs/common';
import { NormParamService } from './norm-param.service';

export interface Proteccion {
  id: string;
  tipo: 'MCB' | 'MCCB' | 'FUSIBLE' | 'RELE';
  amperaje: number;
  curva: string;
  polo: string;
  corrienteInterruptora: number;
  tiempoInterrupcion: number; // segundos
  ubicacion: string; // 'PANEL_PRINCIPAL' | 'SUB_PANEL' | 'CIRCUITO'
  nivel: number; // 1 = más cercano a la carga, mayor = más cercano a la fuente
}

export interface CircuitoSelectividad {
  id: string;
  protecciones: Proteccion[];
  corrienteMaxima: number; // amperios
  tipo: string;
  ambiente: string;
  uso: string;
}

export interface AnalisisSelectividad {
  circuitoId: string;
  proteccionesAnalizadas: Proteccion[];
  selectividadCumple: boolean;
  coordinacionCumple: boolean;
  tiempoCoordinacion: number; // segundos
  margenSelectividad: number; // %
  recomendaciones: string[];
  detallesAnalisis: {
    proteccionPrincipal: Proteccion;
    proteccionSecundaria: Proteccion;
    relacionCorriente: number;
    relacionTiempo: number;
    factorCoordinacion: number;
  };
}

export interface ReglasSelectividad {
  margenMinimo: number; // % mínimo entre protecciones
  tiempoMinimo: number; // segundos mínimo entre interrupciones
  relacionCorrienteMaxima: number; // relación máxima Icc/Ir
  nivelesPermitidos: number[]; // niveles de protección permitidos
}

@Injectable()
export class SelectivityService {
  private readonly logger = new Logger(SelectivityService.name);

  constructor(private readonly normParamService: NormParamService) {}

  /**
   * Analiza la selectividad de un circuito
   */
  async analizarSelectividad(
    circuito: CircuitoSelectividad,
    warnings: string[] = [],
  ): Promise<AnalisisSelectividad> {
    try {
      // Obtener reglas normativas
      const reglas = await this.obtenerReglasSelectividad(warnings);

      // Ordenar protecciones por nivel (mayor a menor)
      const proteccionesOrdenadas = [...circuito.protecciones].sort(
        (a, b) => b.nivel - a.nivel,
      );

      if (proteccionesOrdenadas.length < 2) {
        return this.crearAnalisisSinSelectividad(circuito, proteccionesOrdenadas);
      }

      // Analizar cada par de protecciones consecutivas
      const analisisPares = this.analizarParesProtecciones(
        proteccionesOrdenadas,
        reglas,
      );

      // Determinar si cumple selectividad
      const selectividadCumple = analisisPares.every(
        (analisis) => analisis.selectividadCumple,
      );

      // Determinar si cumple coordinación
      const coordinacionCumple = analisisPares.every(
        (analisis) => analisis.coordinacionCumple,
      );

      // Calcular tiempo total de coordinación
      const tiempoCoordinacion = this.calcularTiempoCoordinacion(
        proteccionesOrdenadas,
      );

      // Calcular margen de selectividad promedio
      const margenSelectividad = this.calcularMargenSelectividadPromedio(
        analisisPares,
      );

      // Generar recomendaciones
      const recomendaciones = this.generarRecomendaciones(
        selectividadCumple,
        coordinacionCumple,
        analisisPares,
        reglas,
        circuito,
      );

      // Obtener detalles del análisis principal
      const detallesAnalisis = this.obtenerDetallesAnalisis(
        proteccionesOrdenadas,
        analisisPares,
      );

      return {
        circuitoId: circuito.id,
        proteccionesAnalizadas: proteccionesOrdenadas,
        selectividadCumple,
        coordinacionCumple,
        tiempoCoordinacion,
        margenSelectividad,
        recomendaciones,
        detallesAnalisis,
      };
    } catch (error) {
      this.logger.error('Error analizando selectividad', error);
      throw new Error(`Error en análisis de selectividad: ${error.message}`);
    }
  }

  /**
   * Analiza la selectividad de múltiples circuitos
   */
  async analizarSelectividadMultiple(
    circuitos: CircuitoSelectividad[],
  ): Promise<AnalisisSelectividad[]> {
    const resultados: AnalisisSelectividad[] = [];
    const warnings: string[] = [];

    for (const circuito of circuitos) {
      try {
        const resultado = await this.analizarSelectividad(circuito, warnings);
        resultados.push(resultado);
      } catch (error) {
        this.logger.warn(`Error en circuito ${circuito.id}: ${error.message}`);
        warnings.push(`Circuito ${circuito.id}: ${error.message}`);
      }
    }

    return resultados;
  }

  /**
   * Obtiene las reglas normativas de selectividad
   */
  private async obtenerReglasSelectividad(
    warnings: string[],
  ): Promise<ReglasSelectividad> {
    try {
      const reglas = await this.normParamService.getParam('REGLAS_SELECTIVIDAD');
      const reglasParsed = JSON.parse(reglas);

      if (!reglasParsed) {
        this.logger.warn(
          'Reglas de selectividad no encontradas, usando valores por defecto',
          { warnings },
        );
        return this.obtenerReglasPorDefecto();
      }

      return reglasParsed;
    } catch (error) {
      this.logger.warn(
        'Usando reglas por defecto debido a error',
        { warnings },
      );
      return this.obtenerReglasPorDefecto();
    }
  }

  /**
   * Reglas por defecto según estándares internacionales
   */
  private obtenerReglasPorDefecto(): ReglasSelectividad {
    return {
      margenMinimo: 20, // 20% mínimo entre protecciones
      tiempoMinimo: 0.1, // 100ms mínimo entre interrupciones
      relacionCorrienteMaxima: 10, // 10x máximo Icc/Ir
      nivelesPermitidos: [1, 2, 3], // Máximo 3 niveles de protección
    };
  }

  /**
   * Crea análisis para circuitos sin selectividad
   */
  private crearAnalisisSinSelectividad(
    circuito: CircuitoSelectividad,
    protecciones: Proteccion[],
  ): AnalisisSelectividad {
    return {
      circuitoId: circuito.id,
      proteccionesAnalizadas: protecciones,
      selectividadCumple: false,
      coordinacionCumple: false,
      tiempoCoordinacion: 0,
      margenSelectividad: 0,
      recomendaciones: [
        'Se requiere al menos 2 protecciones para análisis de selectividad',
        'Considerar agregar protecciones intermedias para mejor coordinación',
      ],
      detallesAnalisis: {
        proteccionPrincipal: protecciones[0] || this.crearProteccionDefault(),
        proteccionSecundaria: this.crearProteccionDefault(),
        relacionCorriente: 0,
        relacionTiempo: 0,
        factorCoordinacion: 0,
      },
    };
  }

  /**
   * Crea una protección por defecto
   */
  private crearProteccionDefault(): Proteccion {
    return {
      id: 'DEFAULT',
      tipo: 'MCB',
      amperaje: 0,
      curva: 'C',
      polo: '1P',
      corrienteInterruptora: 0,
      tiempoInterrupcion: 0,
      ubicacion: 'N/A',
      nivel: 0,
    };
  }

  /**
   * Analiza pares de protecciones consecutivas
   */
  private analizarParesProtecciones(
    protecciones: Proteccion[],
    reglas: ReglasSelectividad,
  ): Array<{
    proteccionPrincipal: Proteccion;
    proteccionSecundaria: Proteccion;
    selectividadCumple: boolean;
    coordinacionCumple: boolean;
    margenSelectividad: number;
  }> {
    const analisis: Array<{
      proteccionPrincipal: Proteccion;
      proteccionSecundaria: Proteccion;
      selectividadCumple: boolean;
      coordinacionCumple: boolean;
      margenSelectividad: number;
    }> = [];

    for (let i = 0; i < protecciones.length - 1; i++) {
      const proteccionPrincipal = protecciones[i];
      const proteccionSecundaria = protecciones[i + 1];

      // Calcular relación de corrientes
      const relacionCorriente = this.calcularRelacionCorriente(
        proteccionPrincipal,
        proteccionSecundaria,
      );

      // Calcular relación de tiempos
      const relacionTiempo = this.calcularRelacionTiempo(
        proteccionPrincipal,
        proteccionSecundaria,
      );

      // Validar selectividad
      const selectividadCumple = this.validarSelectividad(
        relacionCorriente,
        relacionTiempo,
        reglas,
      );

      // Validar coordinación
      const coordinacionCumple = this.validarCoordinacion(
        proteccionPrincipal,
        proteccionSecundaria,
        reglas,
      );

      // Calcular margen de selectividad
      const margenSelectividad = this.calcularMargenSelectividad(
        relacionCorriente,
        relacionTiempo,
      );

      analisis.push({
        proteccionPrincipal,
        proteccionSecundaria,
        selectividadCumple,
        coordinacionCumple,
        margenSelectividad,
      });
    }

    return analisis;
  }

  /**
   * Calcula la relación de corrientes entre protecciones
   */
  private calcularRelacionCorriente(
    proteccionPrincipal: Proteccion,
    proteccionSecundaria: Proteccion,
  ): number {
    // Relación = Icc_principal / Icc_secundaria
    const corrientePrincipal = proteccionPrincipal.corrienteInterruptora;
    const corrienteSecundaria = proteccionSecundaria.corrienteInterruptora;

    if (corrienteSecundaria === 0) return 0;
    return corrientePrincipal / corrienteSecundaria;
  }

  /**
   * Calcula la relación de tiempos entre protecciones
   */
  private calcularRelacionTiempo(
    proteccionPrincipal: Proteccion,
    proteccionSecundaria: Proteccion,
  ): number {
    // Relación = tiempo_secundaria / tiempo_principal
    const tiempoPrincipal = proteccionPrincipal.tiempoInterrupcion;
    const tiempoSecundaria = proteccionSecundaria.tiempoInterrupcion;

    if (tiempoPrincipal === 0) return 0;
    return tiempoSecundaria / tiempoPrincipal;
  }

  /**
   * Valida la selectividad entre protecciones
   */
  private validarSelectividad(
    relacionCorriente: number,
    relacionTiempo: number,
    reglas: ReglasSelectividad,
  ): boolean {
    // Para selectividad: la protección principal debe interrumpir antes
    // y con mayor margen de corriente
    return (
      relacionCorriente >= 1.2 && // Al menos 20% más de corriente
      relacionTiempo >= 1.5 // Al menos 50% más de tiempo
    );
  }

  /**
   * Valida la coordinación entre protecciones
   */
  private validarCoordinacion(
    proteccionPrincipal: Proteccion,
    proteccionSecundaria: Proteccion,
    reglas: ReglasSelectividad,
  ): boolean {
    // Verificar que los niveles sean consecutivos
    const diferenciaNivel = proteccionPrincipal.nivel - proteccionSecundaria.nivel;

    // Verificar que el tiempo de interrupción sea suficiente
    const tiempoDiferencia = Math.abs(
      proteccionPrincipal.tiempoInterrupcion - proteccionSecundaria.tiempoInterrupcion,
    );

    return (
      diferenciaNivel === 1 && // Niveles consecutivos
      tiempoDiferencia >= reglas.tiempoMinimo // Tiempo mínimo de coordinación
    );
  }

  /**
   * Calcula el margen de selectividad
   */
  private calcularMargenSelectividad(
    relacionCorriente: number,
    relacionTiempo: number,
  ): number {
    // Margen = promedio de los márgenes de corriente y tiempo
    const margenCorriente = Math.max(0, (relacionCorriente - 1) * 100);
    const margenTiempo = Math.max(0, (relacionTiempo - 1) * 100);

    return (margenCorriente + margenTiempo) / 2;
  }

  /**
   * Calcula el tiempo total de coordinación
   */
  private calcularTiempoCoordinacion(protecciones: Proteccion[]): number {
    if (protecciones.length === 0) return 0;

    // Sumar todos los tiempos de interrupción
    return protecciones.reduce(
      (total, proteccion) => total + proteccion.tiempoInterrupcion,
      0,
    );
  }

  /**
   * Calcula el margen de selectividad promedio
   */
  private calcularMargenSelectividadPromedio(
    analisisPares: Array<{
      margenSelectividad: number;
    }>,
  ): number {
    if (analisisPares.length === 0) return 0;

    const margenTotal = analisisPares.reduce(
      (total, analisis) => total + analisis.margenSelectividad,
      0,
    );

    return margenTotal / analisisPares.length;
  }

  /**
   * Obtiene los detalles del análisis principal
   */
  private obtenerDetallesAnalisis(
    protecciones: Proteccion[],
    analisisPares: Array<{
      proteccionPrincipal: Proteccion;
      proteccionSecundaria: Proteccion;
      selectividadCumple: boolean;
      coordinacionCumple: boolean;
      margenSelectividad: number;
    }>,
  ): AnalisisSelectividad['detallesAnalisis'] {
    if (analisisPares.length === 0) {
      return {
        proteccionPrincipal: this.crearProteccionDefault(),
        proteccionSecundaria: this.crearProteccionDefault(),
        relacionCorriente: 0,
        relacionTiempo: 0,
        factorCoordinacion: 0,
      };
    }

    const primerPar = analisisPares[0];
    const relacionCorriente = this.calcularRelacionCorriente(
      primerPar.proteccionPrincipal,
      primerPar.proteccionSecundaria,
    );
    const relacionTiempo = this.calcularRelacionTiempo(
      primerPar.proteccionPrincipal,
      primerPar.proteccionSecundaria,
    );

    return {
      proteccionPrincipal: primerPar.proteccionPrincipal,
      proteccionSecundaria: primerPar.proteccionSecundaria,
      relacionCorriente,
      relacionTiempo,
      factorCoordinacion: relacionCorriente * relacionTiempo,
    };
  }

  /**
   * Genera recomendaciones basadas en el análisis
   */
  private generarRecomendaciones(
    selectividadCumple: boolean,
    coordinacionCumple: boolean,
    analisisPares: Array<{
      proteccionPrincipal: Proteccion;
      proteccionSecundaria: Proteccion;
      selectividadCumple: boolean;
      coordinacionCumple: boolean;
      margenSelectividad: number;
    }>,
    reglas: ReglasSelectividad,
    circuito: CircuitoSelectividad,
  ): string[] {
    const recomendaciones: string[] = [];

    if (!selectividadCumple) {
      recomendaciones.push(
        'La selectividad entre protecciones no cumple con los estándares',
      );

      // Analizar cada par que no cumple
      analisisPares.forEach((par, index) => {
        if (!par.selectividadCumple) {
          recomendaciones.push(
            `Par ${index + 1}: Mejorar selectividad entre ${par.proteccionPrincipal.tipo} ${par.proteccionPrincipal.amperaje}A y ${par.proteccionSecundaria.tipo} ${par.proteccionSecundaria.amperaje}A`,
          );
        }
      });
    }

    if (!coordinacionCumple) {
      recomendaciones.push(
        'La coordinación entre protecciones no cumple con los estándares',
      );

      // Analizar cada par que no cumple
      analisisPares.forEach((par, index) => {
        if (!par.coordinacionCumple) {
          recomendaciones.push(
            `Par ${index + 1}: Verificar niveles y tiempos de coordinación entre ${par.proteccionPrincipal.ubicacion} y ${par.proteccionSecundaria.ubicacion}`,
          );
        }
      });
    }

    // Recomendaciones de optimización
    if (selectividadCumple && coordinacionCumple) {
      recomendaciones.push('La selectividad y coordinación cumplen con los estándares');

      // Verificar si hay margen para optimización
      const margenPromedio = this.calcularMargenSelectividadPromedio(analisisPares);
      if (margenPromedio > 50) {
        recomendaciones.push(
          'Margen de selectividad alto, considerar optimización de costos',
        );
      }
    }

    // Verificar número de niveles
    if (circuito.protecciones.length > reglas.nivelesPermitidos.length) {
      recomendaciones.push(
        `Demasiados niveles de protección (${circuito.protecciones.length}), máximo recomendado: ${reglas.nivelesPermitidos.length}`,
      );
    }

    return recomendaciones;
  }
}
