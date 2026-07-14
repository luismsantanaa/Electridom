import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Protection } from '../entities/protection.entity';
import { Circuit } from '../entities/circuit.entity';

export interface UnifilarNode {
  id: string;
  type: 'service' | 'main-panel' | 'sub-panel' | 'circuit' | 'load';
  position: { x: number; y: number };
  properties: Record<string, any>;
  connections: string[];
  symbolRefs: string[];
}

export interface UnifilarService {
  voltage: string;
  phases: string;
  amperage: number;
  type: string;
}

export interface UnifilarMainPanel {
  id: number;
  type: string;
  amperage: number;
  voltage: string;
  phases: number;
  symbols: string[];
  circuits: UnifilarCircuit[];
}

export interface UnifilarCircuit {
  id: number;
  phase: string;
  breakerAmp: number;
  breakerType: string;
  differential: string;
  loadVA: number;
  conductorGauge: string;
  areaType: string;
  symbolRefs: string[];
  position: { x: number; y: number };
}

export interface UnifilarExport {
  projectId: number;
  projectName?: string;
  service: UnifilarService;
  mainPanel: UnifilarMainPanel;
  metadata: {
    version: string;
    generatedAt: string;
    totalCircuits: number;
    totalLoadVA: number;
  };
  symbols: {
    [key: string]: {
      name: string;
      description: string;
      category: string;
      iecCode?: string;
      uneCode?: string;
    };
  };
}

@Injectable()
export class UnifilarExportService {
  private readonly logger = new Logger(UnifilarExportService.name);

  // Símbolos IEC/UNE para componentes eléctricos
  private readonly electricalSymbols = {
    // Acometida
    'service-entrance': {
      name: 'Acometida de Servicio',
      description: 'Punto de entrada del servicio eléctrico',
      category: 'service',
      iecCode: 'IEC 60617-2-1',
      uneCode: 'UNE-EN 60617-2-1'
    },
    
    // Tablero principal
    'main-panel': {
      name: 'Tablero Principal',
      description: 'Tablero de distribución principal',
      category: 'panel',
      iecCode: 'IEC 60617-11',
      uneCode: 'UNE-EN 60617-11'
    },
    
    // Interruptores
    'mcb': {
      name: 'Interruptor Termomagnético',
      description: 'Miniature Circuit Breaker',
      category: 'protection',
      iecCode: 'IEC 60617-7',
      uneCode: 'UNE-EN 60617-7'
    },
    
    'mccb': {
      name: 'Interruptor de Caja Moldeada',
      description: 'Molded Case Circuit Breaker',
      category: 'protection',
      iecCode: 'IEC 60617-7',
      uneCode: 'UNE-EN 60617-7'
    },
    
    'gfci': {
      name: 'Interruptor Diferencial GFCI',
      description: 'Ground Fault Circuit Interrupter',
      category: 'protection',
      iecCode: 'IEC 60617-7',
      uneCode: 'UNE-EN 60617-7'
    },
    
    'afci': {
      name: 'Interruptor Diferencial AFCI',
      description: 'Arc Fault Circuit Interrupter',
      category: 'protection',
      iecCode: 'IEC 60617-7',
      uneCode: 'UNE-EN 60617-7'
    },
    
    // Cargas
    'outlet': {
      name: 'Toma de Corriente',
      description: 'Punto de conexión para equipos',
      category: 'load',
      iecCode: 'IEC 60617-11',
      uneCode: 'UNE-EN 60617-11'
    },
    
    'light': {
      name: 'Punto de Luz',
      description: 'Punto de iluminación',
      category: 'load',
      iecCode: 'IEC 60617-11',
      uneCode: 'UNE-EN 60617-11'
    },
    
    'appliance': {
      name: 'Equipo Aparato',
      description: 'Carga de aparato específico',
      category: 'load',
      iecCode: 'IEC 60617-11',
      uneCode: 'UNE-EN 60617-11'
    }
  };

  constructor(
    @InjectRepository(Protection)
    private protectionRepository: Repository<Protection>,
    @InjectRepository(Circuit)
    private circuitRepository: Repository<Circuit>,
  ) {}

  /**
   * Genera el diagrama unifilar en formato JSON
   */
  async generateUnifilar(projectId: number): Promise<UnifilarExport> {
    this.logger.log(`Generando diagrama unifilar para el proyecto ${projectId}`);

    const circuits = await this.circuitRepository.find({
      where: { projectId },
      relations: ['protections']
    });

    if (circuits.length === 0) {
      throw new Error(`No se encontraron circuitos para el proyecto ${projectId}`);
    }

    // Calcular totales
    const totalLoadVA = circuits.reduce((sum, circuit) => sum + circuit.loadVA, 0);
    const totalAmperage = Math.ceil(totalLoadVA / 120); // Asumiendo 120V como base

    // Determinar configuración del servicio
    const service = this.determineServiceConfiguration(totalAmperage, circuits);

    // Generar tablero principal
    const mainPanel = this.generateMainPanel(circuits, service);

    // Generar metadatos
    const metadata = {
      version: '1.0.0',
      generatedAt: new Date().toISOString(),
      totalCircuits: circuits.length,
      totalLoadVA
    };

    this.logger.log(`Diagrama unifilar generado: ${circuits.length} circuitos, ${totalLoadVA}VA total`);

    return {
      projectId,
      service,
      mainPanel,
      metadata,
      symbols: this.electricalSymbols
    };
  }

  /**
   * Determina la configuración del servicio según la carga
   */
  private determineServiceConfiguration(totalAmperage: number, circuits: Circuit[]): UnifilarService {
    // Determinar si es monofásico o trifásico
    const hasThreePhase = circuits.some(c => c.phase > 1);
    const maxVoltage = Math.max(...circuits.map(c => c.voltage));
    
    let serviceType = 'residential';
    let phases = '1F+N';
    let voltage = '120/240V';
    let amperage = 100; // Default

    if (hasThreePhase) {
      phases = '3F+N';
      voltage = '120/208V';
      serviceType = 'commercial';
    }

    // Determinar amperaje del servicio según la carga total
    if (totalAmperage <= 100) {
      amperage = 100;
    } else if (totalAmperage <= 200) {
      amperage = 200;
    } else if (totalAmperage <= 400) {
      amperage = 400;
    } else {
      amperage = 600;
      serviceType = 'industrial';
    }

    return {
      voltage,
      phases,
      amperage,
      type: serviceType
    };
  }

  /**
   * Genera el tablero principal con todos los circuitos
   */
  private generateMainPanel(circuits: Circuit[], service: UnifilarService): UnifilarMainPanel {
    const panelCircuits: UnifilarCircuit[] = [];
    let currentX = 0;
    const baseY = 100;

    circuits.forEach((circuit, index) => {
      const protection = circuit.protections?.[0];
      
      // Determinar símbolos según el tipo de protección
      const symbolRefs: string[] = [];
      
      if (protection) {
        // Símbolo del breaker
        if (protection.breakerType === 'MCB') {
          symbolRefs.push('mcb');
        } else if (protection.breakerType === 'MCCB') {
          symbolRefs.push('mccb');
        }

        // Símbolo del diferencial
        if (protection.differentialType === 'GFCI') {
          symbolRefs.push('gfci');
        } else if (protection.differentialType === 'AFCI') {
          symbolRefs.push('afci');
        }
      }

      // Símbolo de la carga según el tipo de área
      if (['cocina', 'lavanderia'].includes(circuit.areaType)) {
        symbolRefs.push('appliance');
      } else if (['dormitorio', 'sala', 'estudio'].includes(circuit.areaType)) {
        symbolRefs.push('light');
      } else {
        symbolRefs.push('outlet');
      }

      const unifilarCircuit: UnifilarCircuit = {
        id: circuit.id,
        phase: this.getPhaseLabel(circuit.phase),
        breakerAmp: protection?.breakerAmp || 0,
        breakerType: protection?.breakerType || 'NONE',
        differential: protection?.differentialType || 'NONE',
        loadVA: circuit.loadVA,
        conductorGauge: circuit.conductorGauge,
        areaType: circuit.areaType,
        symbolRefs,
        position: {
          x: currentX,
          y: baseY + (index * 80)
        }
      };

      panelCircuits.push(unifilarCircuit);
      currentX += 120; // Espaciado horizontal entre circuitos
    });

    return {
      id: 1,
      type: 'Main Distribution Panel',
      amperage: service.amperage,
      voltage: service.voltage,
      phases: service.phases === '1F+N' ? 1 : 3,
      symbols: ['main-panel'],
      circuits: panelCircuits
    };
  }

  /**
   * Obtiene la etiqueta de fase
   */
  private getPhaseLabel(phase: number): string {
    const phaseLabels = ['A', 'B', 'C'];
    return phaseLabels[phase - 1] || 'A';
  }

  /**
   * Genera un diagrama unifilar simplificado para visualización
   */
  async generateSimplifiedUnifilar(projectId: number): Promise<any> {
    const fullUnifilar = await this.generateUnifilar(projectId);
    
    // Simplificar para visualización básica
    return {
      projectId: fullUnifilar.projectId,
      service: {
        voltage: fullUnifilar.service.voltage,
        phases: fullUnifilar.service.phases,
        amperage: fullUnifilar.service.amperage
      },
      mainPanel: {
        id: fullUnifilar.mainPanel.id,
        amperage: fullUnifilar.mainPanel.amperage,
        circuits: fullUnifilar.mainPanel.circuits.map(c => ({
          id: c.id,
          phase: c.phase,
          breakerAmp: c.breakerAmp,
          differential: c.differential,
          loadVA: c.loadVA,
          areaType: c.areaType
        }))
      },
      summary: {
        totalCircuits: fullUnifilar.metadata.totalCircuits,
        totalLoadVA: fullUnifilar.metadata.totalLoadVA,
        generatedAt: fullUnifilar.metadata.generatedAt
      }
    };
  }

  /**
   * Obtiene los símbolos disponibles
   */
  getAvailableSymbols(): any {
    return this.electricalSymbols;
  }

  /**
   * Valida que el diagrama unifilar sea coherente
   */
  validateUnifilar(unifilar: UnifilarExport): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validar que todos los circuitos tengan protección
    const unprotectedCircuits = unifilar.mainPanel.circuits.filter(c => c.breakerAmp === 0);
    if (unprotectedCircuits.length > 0) {
      errors.push(`${unprotectedCircuits.length} circuitos sin protección asignada`);
    }

    // Validar que la suma de cargas sea coherente
    const calculatedTotal = unifilar.mainPanel.circuits.reduce((sum, c) => sum + c.loadVA, 0);
    if (calculatedTotal !== unifilar.metadata.totalLoadVA) {
      errors.push('Inconsistencia en el cálculo de carga total');
    }

    // Validar que el amperaje del servicio sea suficiente
    const maxCircuitAmperage = Math.max(...unifilar.mainPanel.circuits.map(c => c.breakerAmp));
    if (maxCircuitAmperage > unifilar.service.amperage) {
      errors.push('El amperaje del servicio es insuficiente para los circuitos');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
