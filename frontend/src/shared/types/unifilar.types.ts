// Sprint 21: Unifilar Advanced Export Types

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

export interface UnifilarMetadata {
  version: string;
  generatedAt: string;
  totalCircuits: number;
  totalLoadVA: number;
}

export interface UnifilarAdvancedExport {
  projectId: number;
  projectName?: string;
  service: {
    voltage: string;
    phases: string;
    amperage: number;
    type: string;
  };
  panels: UnifilarPanel[];
  phaseBalance: PhaseBalance;
  render: RenderConfig;
  metadata: UnifilarMetadata;
  symbols: Record<string, { name: string; description: string }>;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export type ExportFormat = 'pdf' | 'json';
export type PageSize = 'A3' | 'A4' | 'Letter';
export type Orientation = 'vertical' | 'horizontal';

export interface ExportOptions {
  format: ExportFormat;
  pageSize?: PageSize;
  orientation?: Orientation;
  includeMetadata?: boolean;
  includeSymbols?: boolean;
}
