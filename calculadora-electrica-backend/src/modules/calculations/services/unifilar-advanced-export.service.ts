import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Protection } from '../entities/protection.entity';
import { Circuit } from '../entities/circuit.entity';
import { UnifilarExportService, UnifilarExport } from './unifilar-export.service';
import * as PDFDocument from 'pdfkit';
import { Readable } from 'stream';

export interface UnifilarAdvancedExport extends UnifilarExport {
  panels: UnifilarPanel[];
  phaseBalance: PhaseBalance;
  render: RenderConfig;
}

export interface UnifilarPanel {
  id: number;
  name: string;
  type: string;
  amperage: number;
  voltage: string;
  phases: number;
  phaseMap: { [phase: string]: number[] };
  circuits: UnifilarAdvancedCircuit[];
  symbols: string[];
  position: { x: number; y: number };
}

export interface UnifilarAdvancedCircuit {
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
  connections: string[];
}

export interface PhaseBalance {
  totalLoad: { [phase: string]: number };
  maxImbalance: number;
  isBalanced: boolean;
  recommendations: string[];
}

export interface RenderConfig {
  symbols: 'IEC' | 'UNE' | 'NEMA';
  orientation: 'vertical' | 'horizontal';
  pageSize: 'A3' | 'A4' | 'Letter';
  margins: number;
  showGrid: boolean;
  showLabels: boolean;
}

export interface ExportOptions {
  format: 'pdf' | 'json';
  includeMetadata?: boolean;
  includeSymbols?: boolean;
  pageSize?: string;
  orientation?: string;
}

@Injectable()
export class UnifilarAdvancedExportService {
  private readonly logger = new Logger(UnifilarAdvancedExportService.name);

  constructor(
    @InjectRepository(Protection)
    private protectionRepository: Repository<Protection>,
    @InjectRepository(Circuit)
    private circuitRepository: Repository<Circuit>,
    private unifilarExportService: UnifilarExportService,
  ) {}

  /**
   * Genera exportación avanzada del diagrama unifilar
   */
  async generateAdvancedUnifilar(
    projectId: number,
    options: ExportOptions = { format: 'json' }
  ): Promise<UnifilarAdvancedExport | Buffer> {
    this.logger.log(`Generando exportación avanzada para proyecto ${projectId}, formato: ${options.format}`);

    // Obtener datos básicos del unifilar
    const baseUnifilar = await this.unifilarExportService.generateUnifilar(projectId);
    
    // Generar estructura avanzada
    const advancedUnifilar = await this.generateAdvancedStructure(baseUnifilar, projectId);
    
    // Aplicar configuración de renderizado
    const renderConfig = this.getRenderConfig(options);
    advancedUnifilar.render = renderConfig;

    if (options.format === 'pdf') {
      return this.generatePDF(advancedUnifilar);
    }

    return advancedUnifilar;
  }

  /**
   * Genera la estructura avanzada del unifilar
   */
  private async generateAdvancedStructure(
    baseUnifilar: UnifilarExport,
    projectId: number
  ): Promise<UnifilarAdvancedExport> {
    // Obtener circuitos con protecciones
    const circuits = await this.circuitRepository.find({
      where: { projectId },
      relations: ['protections']
    });

    // Generar paneles con balance de fases
    const panels = this.generatePanels(circuits);
    
    // Calcular balance de fases
    const phaseBalance = this.calculatePhaseBalance(panels);

    return {
      ...baseUnifilar,
      panels,
      phaseBalance,
      render: {
        symbols: 'IEC',
        orientation: 'vertical',
        pageSize: 'A3',
        margins: 10,
        showGrid: true,
        showLabels: true
      }
    };
  }

  /**
   * Genera paneles con distribución de fases
   */
  private generatePanels(circuits: Circuit[]): UnifilarPanel[] {
    const panels: UnifilarPanel[] = [];
    
    // Agrupar circuitos por panel (por ahora un solo panel principal)
    const mainPanelCircuits = circuits.map((circuit, index) => {
      const protection = circuit.protections?.[0];
      
      return {
        id: circuit.id,
        phase: this.getPhaseLabel(circuit.phase),
        breakerAmp: protection?.breakerAmp || 0,
        breakerType: protection?.breakerType || 'NONE',
        differential: protection?.differentialType || 'NONE',
        loadVA: circuit.loadVA,
        conductorGauge: circuit.conductorGauge,
        areaType: circuit.areaType,
        symbolRefs: this.getSymbolRefs(circuit, protection),
        position: {
          x: (index % 8) * 120, // 8 circuitos por fila
          y: Math.floor(index / 8) * 80
        },
        connections: [`panel-${circuit.id}`, `load-${circuit.id}`]
      };
    });

    // Crear mapa de fases
    const phaseMap: { [phase: string]: number[] } = { A: [], B: [], C: [] };
    mainPanelCircuits.forEach(circuit => {
      if (phaseMap[circuit.phase]) {
        phaseMap[circuit.phase].push(circuit.id);
      }
    });

    const mainPanel: UnifilarPanel = {
      id: 1,
      name: 'Tablero Principal',
      type: 'Main Distribution Panel',
      amperage: this.calculatePanelAmperage(mainPanelCircuits),
      voltage: '120/208V',
      phases: 3,
      phaseMap,
      circuits: mainPanelCircuits,
      symbols: ['main-panel'],
      position: { x: 0, y: 0 }
    };

    panels.push(mainPanel);
    return panels;
  }

  /**
   * Calcula el balance de fases
   */
  private calculatePhaseBalance(panels: UnifilarPanel[]): PhaseBalance {
    const totalLoad: { [phase: string]: number } = { A: 0, B: 0, C: 0 };
    const recommendations: string[] = [];

    // Calcular carga total por fase
    panels.forEach(panel => {
      panel.circuits.forEach(circuit => {
        if (totalLoad[circuit.phase] !== undefined) {
          totalLoad[circuit.phase] += circuit.loadVA;
        }
      });
    });

    // Calcular desbalance máximo
    const loads = Object.values(totalLoad);
    const maxLoad = Math.max(...loads);
    const minLoad = Math.min(...loads);
    const maxImbalance = ((maxLoad - minLoad) / maxLoad) * 100;

    // Determinar si está balanceado
    const isBalanced = maxImbalance <= 15; // Máximo 15% de desbalance

    // Generar recomendaciones
    if (!isBalanced) {
      recommendations.push(`El desbalance de fases es del ${maxImbalance.toFixed(1)}%, debe ser menor al 15%`);
      
      if (totalLoad.A > totalLoad.B && totalLoad.A > totalLoad.C) {
        recommendations.push('Considerar mover cargas de la fase A a las fases B o C');
      } else if (totalLoad.B > totalLoad.A && totalLoad.B > totalLoad.C) {
        recommendations.push('Considerar mover cargas de la fase B a las fases A o C');
      } else if (totalLoad.C > totalLoad.A && totalLoad.C > totalLoad.B) {
        recommendations.push('Considerar mover cargas de la fase C a las fases A o B');
      }
    } else {
      recommendations.push('El balance de fases es aceptable');
    }

    // Verificar distribución de cargas
    const avgLoad = (totalLoad.A + totalLoad.B + totalLoad.C) / 3;
    const maxDeviation = Math.max(
      Math.abs(totalLoad.A - avgLoad),
      Math.abs(totalLoad.B - avgLoad),
      Math.abs(totalLoad.C - avgLoad)
    );

    if (maxDeviation > avgLoad * 0.2) {
      recommendations.push('Considerar redistribuir cargas para mejorar el balance');
    }

    return {
      totalLoad,
      maxImbalance,
      isBalanced,
      recommendations
    };
  }

  /**
   * Genera PDF del diagrama unifilar
   */
  private generatePDF(unifilar: UnifilarAdvancedExport): Buffer {
    this.logger.log('Generando PDF del diagrama unifilar');

    const doc = new PDFDocument({
      size: unifilar.render.pageSize,
      margins: {
        top: unifilar.render.margins,
        bottom: unifilar.render.margins,
        left: unifilar.render.margins,
        right: unifilar.render.margins
      }
    });

    const chunks: Buffer[] = [];
    doc.on('data', (chunk) => chunks.push(chunk));

    // Título
    doc.fontSize(24)
       .font('Helvetica-Bold')
       .text('Diagrama Unifilar Eléctrico', { align: 'center' });

    doc.moveDown(0.5);

    // Información del proyecto
    doc.fontSize(12)
       .font('Helvetica')
       .text(`Proyecto ID: ${unifilar.projectId}`)
       .text(`Generado: ${new Date(unifilar.metadata.generatedAt).toLocaleString()}`)
       .text(`Total Circuitos: ${unifilar.metadata.totalCircuits}`)
       .text(`Carga Total: ${unifilar.metadata.totalLoadVA} VA`);

    doc.moveDown();

    // Balance de fases
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .text('Balance de Fases');

    doc.fontSize(10)
       .font('Helvetica')
       .text(`Fase A: ${unifilar.phaseBalance.totalLoad.A} VA`)
       .text(`Fase B: ${unifilar.phaseBalance.totalLoad.B} VA`)
       .text(`Fase C: ${unifilar.phaseBalance.totalLoad.C} VA`)
       .text(`Desbalance: ${unifilar.phaseBalance.maxImbalance.toFixed(1)}%`)
       .text(`Estado: ${unifilar.phaseBalance.isBalanced ? 'Balanceado' : 'Desbalanceado'}`);

    doc.moveDown();

    // Recomendaciones
    if (unifilar.phaseBalance.recommendations.length > 0) {
      doc.fontSize(14)
         .font('Helvetica-Bold')
         .text('Recomendaciones:');

      unifilar.phaseBalance.recommendations.forEach(rec => {
        doc.fontSize(10)
           .font('Helvetica')
           .text(`• ${rec}`);
      });

      doc.moveDown();
    }

    // Circuitos por fase
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .text('Distribución de Circuitos por Fase:');

    unifilar.panels.forEach(panel => {
      doc.fontSize(12)
         .font('Helvetica-Bold')
         .text(`Panel: ${panel.name}`);

      Object.entries(panel.phaseMap).forEach(([phase, circuitIds]) => {
        doc.fontSize(10)
           .font('Helvetica')
           .text(`Fase ${phase}: ${circuitIds.length} circuitos`);
      });

      doc.moveDown(0.5);
    });

    // Finalizar documento
    doc.end();

    return Buffer.concat(chunks);
  }

  /**
   * Obtiene la configuración de renderizado
   */
  private getRenderConfig(options: ExportOptions): RenderConfig {
    return {
      symbols: 'IEC',
      orientation: options.orientation === 'horizontal' ? 'horizontal' : 'vertical',
      pageSize: (options.pageSize as 'A3' | 'A4' | 'Letter') || 'A3',
      margins: 10,
      showGrid: true,
      showLabels: true
    };
  }

  /**
   * Calcula el amperaje del panel
   */
  private calculatePanelAmperage(circuits: UnifilarAdvancedCircuit[]): number {
    const totalLoad = circuits.reduce((sum, circuit) => sum + circuit.loadVA, 0);
    const totalAmperage = Math.ceil(totalLoad / 120); // Asumiendo 120V como base

    if (totalAmperage <= 100) return 100;
    if (totalAmperage <= 200) return 200;
    if (totalAmperage <= 400) return 400;
    return 600;
  }

  /**
   * Obtiene las referencias de símbolos
   */
  private getSymbolRefs(circuit: Circuit, protection?: Protection): string[] {
    const symbolRefs: string[] = [];

    if (protection) {
      if (protection.breakerType === 'MCB') {
        symbolRefs.push('mcb');
      } else if (protection.breakerType === 'MCCB') {
        symbolRefs.push('mccb');
      }

      if (protection.differentialType === 'GFCI') {
        symbolRefs.push('gfci');
      } else if (protection.differentialType === 'AFCI') {
        symbolRefs.push('afci');
      }
    }

    if (['cocina', 'lavanderia'].includes(circuit.areaType)) {
      symbolRefs.push('appliance');
    } else if (['dormitorio', 'sala', 'estudio'].includes(circuit.areaType)) {
      symbolRefs.push('light');
    } else {
      symbolRefs.push('outlet');
    }

    return symbolRefs;
  }

  /**
   * Obtiene la etiqueta de fase
   */
  private getPhaseLabel(phase: number): string {
    const phaseLabels = ['A', 'B', 'C'];
    return phaseLabels[phase - 1] || 'A';
  }

  /**
   * Valida la exportación avanzada
   */
  validateAdvancedUnifilar(unifilar: UnifilarAdvancedExport): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validar balance de fases
    if (!unifilar.phaseBalance.isBalanced) {
      errors.push(`Desbalance de fases: ${unifilar.phaseBalance.maxImbalance.toFixed(1)}%`);
    }

    // Validar que todos los paneles tengan circuitos
    unifilar.panels.forEach(panel => {
      if (panel.circuits.length === 0) {
        errors.push(`Panel ${panel.name} no tiene circuitos asignados`);
      }
    });

    // Validar que la suma de cargas sea coherente
    const calculatedTotal = unifilar.panels.reduce((sum, panel) => {
      return sum + panel.circuits.reduce((panelSum, circuit) => panelSum + circuit.loadVA, 0);
    }, 0);

    if (calculatedTotal !== unifilar.metadata.totalLoadVA) {
      errors.push('Inconsistencia en el cálculo de carga total');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
