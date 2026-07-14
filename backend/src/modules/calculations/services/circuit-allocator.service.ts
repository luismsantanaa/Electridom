import { Injectable, Logger } from '@nestjs/common';
import { NormParamService } from './norm-param.service';

export interface CargaElectrica {
  id: string;
  environment: string;
  type: 'ILU' | 'TOM' | 'IUG' | 'TUG' | 'IUE' | 'TUE';
  watts: number;
  factorUso?: number;
  vaCalculado: number;
}

export interface CircuitoAsignado {
  id: string;
  type: 'ILU' | 'TOM' | 'IUG' | 'TUG' | 'IUE' | 'TUE';
  cargas: CargaElectrica[];
  cargaTotalVA: number;
  fase: 'A' | 'B' | 'C';
  porcentajeUso: number;
  ambientesIncluidos: string[];
  balanceado: boolean;
}

export interface PanelSchedule {
  circuitos: CircuitoAsignado[];
  balanceoFases: {
    faseA: { totalVA: number; circuitos: number };
    faseB: { totalVA: number; circuitos: number };
    faseC: { totalVA: number; circuitos: number };
  };
  totalCargaVA: number;
  demandaEstimadaVA: number;
}

@Injectable()
export class CircuitAllocatorService {
  private readonly logger = new Logger(CircuitAllocatorService.name);

  constructor(private readonly normParamService: NormParamService) {}

  /**
   * Asigna cargas eléctricas a circuitos de manera inteligente
   * respetando límites normativos y balanceando fases
   */
  async asignarCargasACircuitos(
    cargas: CargaElectrica[],
    warnings: string[] = [],
  ): Promise<PanelSchedule> {
    this.logger.log('Iniciando asignación de cargas a circuitos', {
      totalCargas: cargas.length,
      tipos: [...new Set(cargas.map(c => c.type))],
    });

    try {
      // Obtener parámetros normativos
      const limites = await this.obtenerLimitesNormativos(warnings);

      // Agrupar cargas por tipo
      const cargasPorTipo = this.agruparCargasPorTipo(cargas);

      // Crear circuitos por tipo
      const circuitos = await this.crearCircuitosPorTipo(
        cargasPorTipo,
        limites,
        warnings,
      );

      // Balancear fases
      const circuitosBalanceados = this.balancearFases(circuitos);

      // Calcular totales del panel
      const panelSchedule = this.calcularPanelSchedule(circuitosBalanceados);

      this.logger.log('Asignación de circuitos completada', {
        totalCircuitos: panelSchedule.circuitos.length,
        balanceo: panelSchedule.balanceoFases,
      });

      return panelSchedule;
    } catch (error) {
      this.logger.error('Error en asignación de circuitos', error);
      throw error;
    }
  }

  /**
   * Obtiene límites normativos para circuitos
   */
  private async obtenerLimitesNormativos(warnings: string[]) {
    try {
      const limites = {
        iluVAMax: await this.normParamService.getParamAsNumber('ILU_VA_MAX_POR_CIRCUITO'),
        tomaVAMax: await this.normParamService.getParamAsNumber('TOMA_VA_MAX_POR_CIRCUITO'),
        iugVAMax: await this.normParamService.getParamAsNumber('IUG_VA_MAX_POR_CIRCUITO'),
        tugVAMax: await this.normParamService.getParamAsNumber('TUG_VA_MAX_POR_CIRCUITO'),
        iueVAMax: await this.normParamService.getParamAsNumber('IUE_VA_MAX_POR_CIRCUITO'),
        tueVAMax: await this.normParamService.getParamAsNumber('TUE_VA_MAX_POR_CIRCUITO'),
      };

      this.logger.debug('Límites normativos obtenidos', limites);
      return limites;
    } catch (error) {
      this.logger.warn('Usando límites por defecto debido a error en parámetros normativos', { warnings });
      // Límites por defecto según NEC 2023
      return {
        iluVAMax: 1440,
        tomaVAMax: 1800,
        iugVAMax: 2400,
        tugVAMax: 3000,
        iueVAMax: 3600,
        tueVAMax: 4800,
      };
    }
  }

  /**
   * Agrupa cargas por tipo para facilitar la asignación
   */
  private agruparCargasPorTipo(cargas: CargaElectrica[]): Map<string, CargaElectrica[]> {
    const agrupacion = new Map<string, CargaElectrica[]>();

    for (const carga of cargas) {
      if (!agrupacion.has(carga.type)) {
        agrupacion.set(carga.type, []);
      }
      agrupacion.get(carga.type)!.push(carga);
    }

    this.logger.debug('Cargas agrupadas por tipo', {
      grupos: Object.fromEntries(agrupacion),
    });

    return agrupacion;
  }

  /**
   * Crea circuitos agrupando cargas por tipo respetando límites
   */
  private async crearCircuitosPorTipo(
    cargasPorTipo: Map<string, CargaElectrica[]>,
    limites: any,
    warnings: string[],
  ): Promise<CircuitoAsignado[]> {
    const circuitos: CircuitoAsignado[] = [];
    let circuitoId = 1;

    for (const [tipo, cargas] of cargasPorTipo) {
      const limiteVA = this.obtenerLimitePorTipo(tipo, limites);

      // Agrupar cargas en circuitos respetando el límite
      const circuitosDelTipo = this.agruparCargasEnCircuitos(
        cargas,
        limiteVA,
        tipo,
        circuitoId,
      );

      circuitos.push(...circuitosDelTipo);
      circuitoId += circuitosDelTipo.length;
    }

    this.logger.debug('Circuitos creados por tipo', {
      totalCircuitos: circuitos.length,
      porTipo: circuitos.reduce((acc, c) => {
        acc[c.type] = (acc[c.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    });

    return circuitos;
  }

  /**
   * Obtiene el límite VA según el tipo de circuito
   */
  private obtenerLimitePorTipo(tipo: string, limites: any): number {
    const mapeoLimites: Record<string, number> = {
      'ILU': limites.iluVAMax,
      'TOM': limites.tomaVAMax,
      'IUG': limites.iugVAMax,
      'TUG': limites.tugVAMax,
      'IUE': limites.iueVAMax,
      'TUE': limites.tueVAMax,
    };

    return mapeoLimites[tipo] || 1800; // Default seguro
  }

  /**
   * Agrupa cargas en circuitos respetando límites VA
   */
  private agruparCargasEnCircuitos(
    cargas: CargaElectrica[],
    limiteVA: number,
    tipo: string,
    circuitoIdInicial: number,
  ): CircuitoAsignado[] {
    const circuitos: CircuitoAsignado[] = [];
    let circuitoActual: CargaElectrica[] = [];
    let cargaAcumuladaVA = 0;
    let circuitoId = circuitoIdInicial;

    for (const carga of cargas) {
      // Si agregar esta carga excedería el límite, crear nuevo circuito
      if (cargaAcumuladaVA + carga.vaCalculado > limiteVA && circuitoActual.length > 0) {
        circuitos.push(this.crearCircuito(circuitoActual, tipo, circuitoId));
        circuitoId++;
        circuitoActual = [];
        cargaAcumuladaVA = 0;
      }

      circuitoActual.push(carga);
      cargaAcumuladaVA += carga.vaCalculado;
    }

    // Agregar el último circuito si tiene cargas
    if (circuitoActual.length > 0) {
      circuitos.push(this.crearCircuito(circuitoActual, tipo, circuitoId));
    }

    return circuitos;
  }

  /**
   * Crea un circuito con las cargas asignadas
   */
  private crearCircuito(
    cargas: CargaElectrica[],
    tipo: string,
    id: number,
  ): CircuitoAsignado {
    const cargaTotalVA = cargas.reduce((total, c) => total + c.vaCalculado, 0);
    const ambientesIncluidos = [...new Set(cargas.map(c => c.environment))];

    return {
      id: `CIRC_${tipo}_${id}`,
      type: tipo as any,
      cargas,
      cargaTotalVA,
      fase: 'A', // Se asignará en balanceo de fases
      porcentajeUso: 0, // Se calculará después
      ambientesIncluidos,
      balanceado: false,
    };
  }

  /**
   * Balancea las fases del panel eléctrico
   */
  private balancearFases(circuitos: CircuitoAsignado[]): CircuitoAsignado[] {
    const fases: { fase: 'A' | 'B' | 'C'; totalVA: number; circuitos: number }[] = [
      { fase: 'A', totalVA: 0, circuitos: 0 },
      { fase: 'B', totalVA: 0, circuitos: 0 },
      { fase: 'C', totalVA: 0, circuitos: 0 },
    ];

    // Ordenar circuitos por carga (mayor a menor) para mejor balanceo
    const circuitosOrdenados = [...circuitos].sort((a, b) => b.cargaTotalVA - a.cargaTotalVA);

    for (const circuito of circuitosOrdenados) {
      // Encontrar la fase con menor carga
      const faseMenorCarga = fases.reduce((min, fase) =>
        fase.totalVA < min.totalVA ? fase : min
      );

      // Asignar circuito a esa fase
      circuito.fase = faseMenorCarga.fase;
      faseMenorCarga.totalVA += circuito.cargaTotalVA;
      faseMenorCarga.circuitos++;
      circuito.balanceado = true;
    }

    this.logger.debug('Balanceo de fases completado', {
      fases: fases.map(f => ({ fase: f.fase, totalVA: f.totalVA, circuitos: f.circuitos })),
    });

    return circuitos;
  }

  /**
   * Calcula el resumen del panel schedule
   */
  private calcularPanelSchedule(circuitos: CircuitoAsignado[]): PanelSchedule {
    const totalCargaVA = circuitos.reduce((total, c) => total + c.cargaTotalVA, 0);

    // Calcular porcentaje de uso por circuito
    circuitos.forEach(circuito => {
      const limiteVA = this.obtenerLimitePorTipo(circuito.type, {
        iluVAMax: 1440, tomaVAMax: 1800, iugVAMax: 2400,
        tugVAMax: 3000, iueVAMax: 3600, tueVAMax: 4800,
      });
      circuito.porcentajeUso = (circuito.cargaTotalVA / limiteVA) * 100;
    });

    // Agrupar por fases para el resumen
    const balanceoFases = {
      faseA: { totalVA: 0, circuitos: 0 },
      faseB: { totalVA: 0, circuitos: 0 },
      faseC: { totalVA: 0, circuitos: 0 },
    };

    circuitos.forEach(circuito => {
      switch (circuito.fase) {
        case 'A':
          balanceoFases.faseA.totalVA += circuito.cargaTotalVA;
          balanceoFases.faseA.circuitos++;
          break;
        case 'B':
          balanceoFases.faseB.totalVA += circuito.cargaTotalVA;
          balanceoFases.faseB.circuitos++;
          break;
        case 'C':
          balanceoFases.faseC.totalVA += circuito.cargaTotalVA;
          balanceoFases.faseC.circuitos++;
          break;
      }
    });

    return {
      circuitos,
      balanceoFases,
      totalCargaVA,
      demandaEstimadaVA: totalCargaVA * 0.8, // Factor de demanda estimado
    };
  }
}
