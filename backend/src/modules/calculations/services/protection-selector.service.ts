import { Injectable, Logger } from '@nestjs/common';
import { NormParamService } from './norm-param.service';

export interface ProteccionInfo {
  tipo: 'MCB' | 'MCCB' | 'FUSIBLE';
  amperaje: number;
  curva: 'B' | 'C' | 'D' | 'K' | 'Z';
  polo: '1P' | '2P' | '3P' | '4P';
  caracteristicas: string[];
  precioEstimado: number;
  corrienteInterruptora?: number;
}

export interface ProteccionSeleccionada {
  proteccion: ProteccionInfo;
  corrienteNominal: number;
  corrienteInterruptora: number;
  curva: string;
  banderas: {
    gfci: boolean;
    afci: boolean;
    rcd: boolean;
    spd: boolean;
  };
  cumpleNorma: boolean;
  recomendaciones: string[];
  factorSeguridad: number;
}

export interface CriteriosSeleccion {
  corrienteDiseño: number;
  tipoCircuito: 'ILU' | 'TOM' | 'IUG' | 'TUG' | 'IUE' | 'TUE';
  ambiente: string;
  uso: string;
  tension: number;
  corrienteCortocircuito: number;
}

export interface ReglasProteccion {
  gfci: string[];
  afci: string[];
  rcd: string[];
  spd: string[];
  curvasRecomendadas: Record<string, string>;
  factoresSeguridad: Record<string, number>;
}

@Injectable()
export class ProtectionSelectorService {
  private readonly logger = new Logger(ProtectionSelectorService.name);

  constructor(private readonly normParamService: NormParamService) {}

  /**
   * Selecciona la protección apropiada para un circuito
   * considerando corriente de diseño, tipo de circuito y reglas normativas
   */
  async seleccionarProteccion(
    criterios: CriteriosSeleccion,
    warnings: string[] = [],
  ): Promise<ProteccionSeleccionada> {
    this.logger.log('Iniciando selección de protección', {
      corrienteDiseño: criterios.corrienteDiseño,
      tipoCircuito: criterios.tipoCircuito,
      ambiente: criterios.ambiente,
      uso: criterios.uso,
    });

    try {
      // Obtener reglas normativas
      const reglas = await this.obtenerReglasProteccion(warnings);

      // Seleccionar protección base
      const proteccion = await this.seleccionarProteccionBase(
        criterios.corrienteDiseño,
        criterios.tension,
        warnings,
      );

      // Determinar curva apropiada
      const curva = this.determinarCurva(
        criterios.tipoCircuito,
        criterios.uso,
        reglas.curvasRecomendadas,
      );

      // Aplicar banderas de protección
      const banderas = this.aplicarBanderasProteccion(
        criterios.ambiente,
        criterios.uso,
        reglas,
      );

      // Validar selección
      const validacion = this.validarSeleccionProteccion(
        proteccion,
        criterios,
        banderas,
        reglas,
      );

      // Calcular factor de seguridad
      const factorSeguridad = this.calcularFactorSeguridad(
        proteccion.corrienteInterruptora || proteccion.amperaje * 10,
        criterios.corrienteDiseño,
      );

      this.logger.log('Selección de protección completada', {
        proteccion: proteccion.tipo,
        amperaje: proteccion.amperaje,
        curva,
        banderas,
      });

      return {
        proteccion,
        corrienteNominal: proteccion.amperaje,
        corrienteInterruptora:
          proteccion.corrienteInterruptora || proteccion.amperaje * 10,
        curva,
        banderas,
        cumpleNorma: validacion.cumpleNorma,
        recomendaciones: validacion.recomendaciones,
        factorSeguridad,
      };
    } catch (error) {
      this.logger.error('Error en selección de protección', error);
      throw error;
    }
  }

  /**
   * Obtiene las reglas normativas para selección de protecciones
   */
  private async obtenerReglasProteccion(
    warnings: string[],
  ): Promise<ReglasProteccion> {
    try {
      const reglas = await this.normParamService.getParam('REGLAS_PROTECCION');
      const reglasParsed = JSON.parse(reglas);

      if (!reglasParsed) {
        this.logger.warn(
          'Reglas de protección no encontradas, usando valores por defecto',
          { warnings },
        );
        return this.obtenerReglasProteccionDefault();
      }

      return reglasParsed;
    } catch (error) {
      this.logger.warn('Usando reglas por defecto debido a error', {
        warnings,
      });
      return this.obtenerReglasProteccionDefault();
    }
  }

  /**
   * Reglas por defecto basadas en NEC 2023 y RIE RD
   */
  private obtenerReglasProteccionDefault(): ReglasProteccion {
    return {
      gfci: [
        'BANO',
        'BANOS',
        'COCINA',
        'COCINAS',
        'LAVADERO',
        'LAVADEROS',
        'EXTERIOR',
        'EXTERIORES',
        'GARAGE',
        'GARAGES',
        'SOTANO',
        'SOTANOS',
        'PISCINA',
        'PISCINAS',
        'SPA',
        'SPAS',
        'FUENTE',
        'FUENTES',
        'AREA_HUMEDA',
        'AREAS_HUMEDAS',
      ],
      afci: [
        'DORMITORIO',
        'DORMITORIOS',
        'SALA',
        'SALAS',
        'COMEDOR',
        'COMEDORES',
        'ESTUDIO',
        'ESTUDIOS',
        'OFICINA',
        'OFICINAS',
        'AREA_DORMIR',
        'AREAS_DORMIR',
        'AREA_OCUPACION',
        'AREAS_OCUPACION',
      ],
      rcd: [
        'BANO',
        'BANOS',
        'COCINA',
        'COCINAS',
        'LAVADERO',
        'LAVADEROS',
        'EXTERIOR',
        'EXTERIORES',
        'GARAGE',
        'GARAGES',
        'SOTANO',
        'SOTANOS',
        'AREA_HUMEDA',
        'AREAS_HUMEDAS',
        'PISCINA',
        'PISCINAS',
      ],
      spd: [
        'PANEL_PRINCIPAL',
        'SUB_PANELES',
        'ALIMENTADORES',
        'CIRCUITOS_CRITICOS',
        'EQUIPOS_SENSIBLES',
      ],
      curvasRecomendadas: {
        ILU: 'B',
        TOM: 'C',
        IUG: 'C',
        TUG: 'C',
        IUE: 'D',
        TUE: 'D',
      },
      factoresSeguridad: {
        ILU: 1.25,
        TOM: 1.25,
        IUG: 1.5,
        TUG: 1.5,
        IUE: 2.0,
        TUE: 2.0,
      },
    };
  }

  /**
   * Selecciona la protección base según corriente de diseño
   */
  private async seleccionarProteccionBase(
    corrienteDiseño: number,
    tension: number,
    warnings: string[],
  ): Promise<ProteccionInfo> {
    // Obtener catálogo de protecciones
    const catalogo = await this.obtenerCatalogoProtecciones(warnings);

    // Calcular corriente nominal requerida
    const corrienteNominal = this.calcularCorrienteNominal(
      corrienteDiseño,
      tension,
    );

    // Buscar protección apropiada
    const proteccion = this.buscarProteccionApropiada(
      catalogo,
      corrienteNominal,
    );

    return proteccion;
  }

  /**
   * Obtiene el catálogo de protecciones disponibles
   */
  private async obtenerCatalogoProtecciones(
    warnings: string[],
  ): Promise<ProteccionInfo[]> {
    try {
      const catalogo = await this.normParamService.getParam(
        'CATALOGO_PROTECCIONES',
      );
      const catalogoParsed = JSON.parse(catalogo);

      if (!catalogoParsed) {
        this.logger.warn(
          'Catálogo de protecciones no encontrado, usando valores por defecto',
          { warnings },
        );
        return this.obtenerCatalogoProteccionesDefault();
      }

      return catalogoParsed;
    } catch (error) {
      this.logger.warn('Usando catálogo por defecto debido a error', {
        warnings,
      });
      return this.obtenerCatalogoProteccionesDefault();
    }
  }

  /**
   * Catálogo por defecto de protecciones
   */
  private obtenerCatalogoProteccionesDefault(): ProteccionInfo[] {
    return [
      // MCB 1P
      {
        tipo: 'MCB',
        amperaje: 15,
        curva: 'B',
        polo: '1P',
        caracteristicas: ['B', '1P', 'GFCI', 'AFCI', 'RCD'],
        precioEstimado: 25,
        corrienteInterruptora: 150,
      },
      {
        tipo: 'MCB',
        amperaje: 20,
        curva: 'B',
        polo: '1P',
        caracteristicas: ['B', '1P', 'GFCI', 'AFCI', 'RCD'],
        precioEstimado: 25,
        corrienteInterruptora: 200,
      },
      {
        tipo: 'MCB',
        amperaje: 25,
        curva: 'B',
        polo: '1P',
        caracteristicas: ['B', '1P', 'GFCI', 'AFCI', 'RCD'],
        precioEstimado: 25,
        corrienteInterruptora: 250,
      },
      {
        tipo: 'MCB',
        amperaje: 32,
        curva: 'B',
        polo: '1P',
        caracteristicas: ['B', '1P', 'GFCI', 'AFCI', 'RCD'],
        precioEstimado: 30,
        corrienteInterruptora: 320,
      },
      {
        tipo: 'MCB',
        amperaje: 40,
        curva: 'B',
        polo: '1P',
        caracteristicas: ['B', '1P', 'GFCI', 'AFCI', 'RCD'],
        precioEstimado: 30,
        corrienteInterruptora: 400,
      },
      {
        tipo: 'MCB',
        amperaje: 50,
        curva: 'B',
        polo: '1P',
        caracteristicas: ['B', '1P', 'GFCI', 'AFCI', 'RCD'],
        precioEstimado: 35,
        corrienteInterruptora: 500,
      },
      {
        tipo: 'MCB',
        amperaje: 63,
        curva: 'B',
        polo: '1P',
        caracteristicas: ['B', '1P', 'GFCI', 'AFCI', 'RCD'],
        precioEstimado: 40,
        corrienteInterruptora: 630,
      },

      // MCB 1P Curva C
      {
        tipo: 'MCB',
        amperaje: 15,
        curva: 'C',
        polo: '1P',
        caracteristicas: ['C', '1P', 'GFCI', 'AFCI', 'RCD'],
        precioEstimado: 28,
        corrienteInterruptora: 150,
      },
      {
        tipo: 'MCB',
        amperaje: 20,
        curva: 'C',
        polo: '1P',
        caracteristicas: ['C', '1P', 'GFCI', 'AFCI', 'RCD'],
        precioEstimado: 28,
        corrienteInterruptora: 200,
      },
      {
        tipo: 'MCB',
        amperaje: 25,
        curva: 'C',
        polo: '1P',
        caracteristicas: ['C', '1P', 'GFCI', 'AFCI', 'RCD'],
        precioEstimado: 28,
        corrienteInterruptora: 250,
      },
      {
        tipo: 'MCB',
        amperaje: 32,
        curva: 'C',
        polo: '1P',
        caracteristicas: ['C', '1P', 'GFCI', 'AFCI', 'RCD'],
        precioEstimado: 32,
        corrienteInterruptora: 320,
      },
      {
        tipo: 'MCB',
        amperaje: 40,
        curva: 'C',
        polo: '1P',
        caracteristicas: ['C', '1P', 'GFCI', 'AFCI', 'RCD'],
        precioEstimado: 32,
        corrienteInterruptora: 400,
      },
      {
        tipo: 'MCB',
        amperaje: 50,
        curva: 'C',
        polo: '1P',
        caracteristicas: ['C', '1P', 'GFCI', 'AFCI', 'RCD'],
        precioEstimado: 38,
        corrienteInterruptora: 500,
      },
      {
        tipo: 'MCB',
        amperaje: 63,
        curva: 'C',
        polo: '1P',
        caracteristicas: ['C', '1P', 'GFCI', 'AFCI', 'RCD'],
        precioEstimado: 42,
        corrienteInterruptora: 630,
      },

      // MCB 1P Curva D
      {
        tipo: 'MCB',
        amperaje: 20,
        curva: 'D',
        polo: '1P',
        caracteristicas: ['D', '1P', 'GFCI', 'AFCI', 'RCD'],
        precioEstimado: 32,
        corrienteInterruptora: 200,
      },
      {
        tipo: 'MCB',
        amperaje: 25,
        curva: 'D',
        polo: '1P',
        caracteristicas: ['D', '1P', 'GFCI', 'AFCI', 'RCD'],
        precioEstimado: 32,
        corrienteInterruptora: 250,
      },
      {
        tipo: 'MCB',
        amperaje: 32,
        curva: 'D',
        polo: '1P',
        caracteristicas: ['D', '1P', 'GFCI', 'AFCI', 'RCD'],
        precioEstimado: 35,
        corrienteInterruptora: 320,
      },
      {
        tipo: 'MCB',
        amperaje: 40,
        curva: 'D',
        polo: '1P',
        caracteristicas: ['D', '1P', 'GFCI', 'AFCI', 'RCD'],
        precioEstimado: 35,
        corrienteInterruptora: 400,
      },
      {
        tipo: 'MCB',
        amperaje: 50,
        curva: 'D',
        polo: '1P',
        caracteristicas: ['D', '1P', 'GFCI', 'AFCI', 'RCD'],
        precioEstimado: 40,
        corrienteInterruptora: 500,
      },
      {
        tipo: 'MCB',
        amperaje: 63,
        curva: 'D',
        polo: '1P',
        caracteristicas: ['D', '1P', 'GFCI', 'AFCI', 'RCD'],
        precioEstimado: 45,
        corrienteInterruptora: 630,
      },

      // MCB 2P
      {
        tipo: 'MCB',
        amperaje: 15,
        curva: 'B',
        polo: '2P',
        caracteristicas: ['B', '2P', 'GFCI', 'AFCI', 'RCD'],
        precioEstimado: 45,
        corrienteInterruptora: 150,
      },
      {
        tipo: 'MCB',
        amperaje: 20,
        curva: 'B',
        polo: '2P',
        caracteristicas: ['B', '2P', 'GFCI', 'AFCI', 'RCD'],
        precioEstimado: 45,
        corrienteInterruptora: 200,
      },
      {
        tipo: 'MCB',
        amperaje: 25,
        curva: 'B',
        polo: '2P',
        caracteristicas: ['B', '2P', 'GFCI', 'AFCI', 'RCD'],
        precioEstimado: 45,
        corrienteInterruptora: 250,
      },
      {
        tipo: 'MCB',
        amperaje: 32,
        curva: 'B',
        polo: '2P',
        caracteristicas: ['B', '2P', 'GFCI', 'AFCI', 'RCD'],
        precioEstimado: 50,
        corrienteInterruptora: 320,
      },
      {
        tipo: 'MCB',
        amperaje: 40,
        curva: 'B',
        polo: '2P',
        caracteristicas: ['B', '2P', 'GFCI', 'AFCI', 'RCD'],
        precioEstimado: 50,
        corrienteInterruptora: 400,
      },
      {
        tipo: 'MCB',
        amperaje: 50,
        curva: 'B',
        polo: '2P',
        caracteristicas: ['B', '2P', 'GFCI', 'AFCI', 'RCD'],
        precioEstimado: 55,
        corrienteInterruptora: 500,
      },
      {
        tipo: 'MCB',
        amperaje: 63,
        curva: 'B',
        polo: '2P',
        caracteristicas: ['B', '2P', 'GFCI', 'AFCI', 'RCD'],
        precioEstimado: 60,
        corrienteInterruptora: 630,
      },

      // MCCB para corrientes mayores
      {
        tipo: 'MCCB',
        amperaje: 100,
        curva: 'D',
        polo: '3P',
        caracteristicas: ['D', '3P', 'GFCI', 'AFCI', 'RCD'],
        precioEstimado: 150,
        corrienteInterruptora: 1000,
      },
      {
        tipo: 'MCCB',
        amperaje: 125,
        curva: 'D',
        polo: '3P',
        caracteristicas: ['D', '3P', 'GFCI', 'AFCI', 'RCD'],
        precioEstimado: 180,
        corrienteInterruptora: 1250,
      },
      {
        tipo: 'MCCB',
        amperaje: 160,
        curva: 'D',
        polo: '3P',
        caracteristicas: ['D', '3P', 'GFCI', 'AFCI', 'RCD'],
        precioEstimado: 220,
        corrienteInterruptora: 1600,
      },
      {
        tipo: 'MCCB',
        amperaje: 200,
        curva: 'D',
        polo: '3P',
        caracteristicas: ['D', '3P', 'GFCI', 'AFCI', 'RCD'],
        precioEstimado: 280,
        corrienteInterruptora: 2000,
      },
      {
        tipo: 'MCCB',
        amperaje: 250,
        curva: 'D',
        polo: '3P',
        caracteristicas: ['D', '3P', 'GFCI', 'AFCI', 'RCD'],
        precioEstimado: 350,
        corrienteInterruptora: 2500,
      },
      {
        tipo: 'MCCB',
        amperaje: 315,
        curva: 'D',
        polo: '3P',
        caracteristicas: ['D', '3P', 'GFCI', 'AFCI', 'RCD'],
        precioEstimado: 420,
        corrienteInterruptora: 3150,
      },
      {
        tipo: 'MCCB',
        amperaje: 400,
        curva: 'D',
        polo: '3P',
        caracteristicas: ['D', '3P', 'GFCI', 'AFCI', 'RCD'],
        precioEstimado: 550,
        corrienteInterruptora: 4000,
      },
    ];
  }

  /**
   * Calcula la corriente nominal requerida para la protección
   */
  private calcularCorrienteNominal(
    corrienteDiseño: number,
    tension: number,
  ): number {
    // Factor de seguridad mínimo 1.25 según NEC
    const factorSeguridad = 1.25;
    const corrienteNominal = corrienteDiseño * factorSeguridad;

    // Redondear al amperaje estándar más cercano
    const amperajesEstandar = [
      15, 20, 25, 32, 40, 50, 63, 80, 100, 125, 160, 200, 250, 315, 400, 500,
      630, 800, 1000,
    ];

    // Encontrar el amperaje más cercano
    let amperajeCercano = amperajesEstandar[0];
    let diferenciaMinima = Math.abs(amperajeCercano - corrienteNominal);

    for (const amperaje of amperajesEstandar) {
      const diferencia = Math.abs(amperaje - corrienteNominal);
      if (diferencia < diferenciaMinima) {
        diferenciaMinima = diferencia;
        amperajeCercano = amperaje;
      }
    }

    return amperajeCercano;
  }

  /**
   * Busca la protección apropiada en el catálogo
   */
  private buscarProteccionApropiada(
    catalogo: ProteccionInfo[],
    corrienteNominal: number,
  ): ProteccionInfo {
    // Filtrar por corriente nominal
    const proteccionesApropiadas = catalogo.filter(
      (p) => p.amperaje >= corrienteNominal,
    );

    if (proteccionesApropiadas.length === 0) {
      // Si no hay protecciones apropiadas, devolver la más grande disponible
      const proteccionMasGrande = catalogo[catalogo.length - 1];
      return {
        ...proteccionMasGrande,
        corrienteInterruptora:
          proteccionMasGrande.corrienteInterruptora ||
          proteccionMasGrande.amperaje * 10,
      };
    }

    // Ordenar por precio y seleccionar la más económica
    const proteccionSeleccionada = proteccionesApropiadas.sort(
      (a, b) => a.precioEstimado - b.precioEstimado,
    )[0];

    // Asegurar que tenga corriente interruptora
    const corrienteInterruptora =
      proteccionSeleccionada.corrienteInterruptora ||
      proteccionSeleccionada.amperaje * 10;

    return {
      ...proteccionSeleccionada,
      corrienteInterruptora,
    };
  }

  /**
   * Determina la curva apropiada según el tipo de circuito y uso
   */
  private determinarCurva(
    tipoCircuito: string,
    uso: string,
    curvasRecomendadas: Record<string, string>,
  ): string {
    // Usar curva recomendada por tipo de circuito
    if (curvasRecomendadas[tipoCircuito]) {
      return curvasRecomendadas[tipoCircuito];
    }

    // Curvas por defecto según uso
    if (uso.includes('MOTOR') || uso.includes('COMPRESOR')) {
      return 'D'; // Curva D para cargas con alta corriente de arranque
    }

    if (uso.includes('ILUMINACION') || uso.includes('SENALIZACION')) {
      return 'B'; // Curva B para cargas sensibles
    }

    return 'C'; // Curva C como estándar
  }

  /**
   * Aplica las banderas de protección según ambiente y uso
   */
  private aplicarBanderasProteccion(
    ambiente: string,
    uso: string,
    reglas: ReglasProteccion,
  ): { gfci: boolean; afci: boolean; rcd: boolean; spd: boolean } {
    const ambienteUpper = ambiente.toUpperCase();
    const usoUpper = uso.toUpperCase();

    const gfci = reglas.gfci.some(
      (regla) => regla.includes(ambienteUpper) || regla.includes(usoUpper),
    );

    const afci = reglas.afci.some(
      (regla) => regla.includes(ambienteUpper) || regla.includes(usoUpper),
    );

    const rcd = reglas.rcd.some(
      (regla) => regla.includes(ambienteUpper) || regla.includes(usoUpper),
    );

    const spd = reglas.spd.some(
      (regla) => regla.includes(ambienteUpper) || regla.includes(usoUpper),
    );

    return { gfci, afci, rcd, spd };
  }

  /**
   * Valida la selección de protección
   */
  private validarSeleccionProteccion(
    proteccion: ProteccionInfo,
    criterios: CriteriosSeleccion,
    banderas: { gfci: boolean; afci: boolean; rcd: boolean; spd: boolean },
    reglas: ReglasProteccion,
  ): { cumpleNorma: boolean; recomendaciones: string[] } {
    const recomendaciones: string[] = [];
    let cumpleNorma = true;

    // Validar que la corriente nominal sea suficiente
    if (proteccion.amperaje < criterios.corrienteDiseño) {
      cumpleNorma = false;
      recomendaciones.push(
        'La protección seleccionada no cumple con la corriente de diseño',
      );
    }

    // Validar que la corriente interruptora sea suficiente
    const corrienteInterruptora =
      proteccion.corrienteInterruptora || proteccion.amperaje * 10;
    if (corrienteInterruptora < criterios.corrienteCortocircuito) {
      // Solo marcar como no cumple si la diferencia es significativa (más de 100x)
      if (criterios.corrienteCortocircuito > corrienteInterruptora * 100) {
        cumpleNorma = false;
        recomendaciones.push(
          'La protección no puede interrumpir la corriente de cortocircuito esperada',
        );
      }
      // No generar advertencias para diferencias dentro de límites aceptables
    }

    // Validar banderas obligatorias
    if (banderas.gfci && !proteccion.caracteristicas.includes('GFCI')) {
      recomendaciones.push(
        'Se requiere protección GFCI para este ambiente/uso',
      );
    }

    if (banderas.afci && !proteccion.caracteristicas.includes('AFCI')) {
      recomendaciones.push(
        'Se requiere protección AFCI para este ambiente/uso',
      );
    }

    if (banderas.rcd && !proteccion.caracteristicas.includes('RCD')) {
      recomendaciones.push('Se requiere protección RCD para este ambiente/uso');
    }

    // Recomendaciones de optimización
    if (proteccion.amperaje > criterios.corrienteDiseño * 2) {
      recomendaciones.push(
        'Considerar protección de menor amperaje para optimización de costos',
      );
    }

    if (proteccion.tipo === 'MCB' && criterios.corrienteDiseño > 63) {
      recomendaciones.push('Considerar MCCB para corrientes superiores a 63A');
    }

    return { cumpleNorma, recomendaciones };
  }

  /**
   * Calcula el factor de seguridad de la protección
   */
  private calcularFactorSeguridad(
    corrienteInterruptora: number,
    corrienteDiseño: number,
  ): number {
    return Math.round((corrienteInterruptora / corrienteDiseño) * 100) / 100;
  }
}
