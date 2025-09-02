import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Protection } from '../entities/protection.entity';
import { Circuit } from '../entities/circuit.entity';

export enum ValidationSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

export interface ValidationIssue {
  circuitId: number;
  severity: ValidationSeverity;
  category: string;
  code: string;
  title: string;
  description: string;
  recommendation: string;
  normReference?: string;
  currentValue?: any;
  expectedValue?: any;
}

export interface ValidationResult {
  projectId: number;
  totalCircuits: number;
  issues: ValidationIssue[];
  summary: {
    info: number;
    warnings: number;
    errors: number;
    critical: number;
  };
  isValid: boolean;
}

@Injectable()
export class ProtectionValidationService {
  private readonly logger = new Logger(ProtectionValidationService.name);

  // Reglas de ampacidad por calibre (mm²) a 60°C
  private readonly ampacityTable = {
    '1.5 mm2': 15,
    '2.0 mm2': 20,
    '3.5 mm2': 30,
    '5.5 mm2': 50,
    '8.0 mm2': 70
  };

  // Valores estándar de breakers según normativa
  private readonly standardBreakers = [15, 20, 25, 30, 40, 50, 60];

  // Reglas de diferenciales por tipo de área
  private readonly differentialRules = {
    GFCI_required_areas: ['banio', 'cocina', 'lavanderia', 'exteriores'],
    AFCI_susceptible_areas: ['dormitorio', 'estudio', 'sala']
  };

  constructor(
    @InjectRepository(Protection)
    private protectionRepository: Repository<Protection>,
    @InjectRepository(Circuit)
    private circuitRepository: Repository<Circuit>,
  ) {}

  /**
   * Valida todas las protecciones de un proyecto
   */
  async validateProjectProtections(projectId: number): Promise<ValidationResult> {
    this.logger.log(`Validando protecciones para el proyecto ${projectId}`);

    const circuits = await this.circuitRepository.find({
      where: { projectId },
      relations: ['protections']
    });

    if (circuits.length === 0) {
      return {
        projectId,
        totalCircuits: 0,
        issues: [],
        summary: { info: 0, warnings: 0, errors: 0, critical: 0 },
        isValid: true
      };
    }

    const issues: ValidationIssue[] = [];

    for (const circuit of circuits) {
      const circuitIssues = this.validateCircuitProtection(circuit);
      issues.push(...circuitIssues);
    }

    const summary = this.calculateSummary(issues);
    const isValid = summary.errors === 0 && summary.critical === 0;

    this.logger.log(`Validación completada: ${issues.length} issues encontrados`);

    return {
      projectId,
      totalCircuits: circuits.length,
      issues,
      summary,
      isValid
    };
  }

  /**
   * Valida la protección de un circuito específico
   */
  private validateCircuitProtection(circuit: Circuit): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    // Validar que el circuito tenga protección
    if (!circuit.protections || circuit.protections.length === 0) {
      issues.push({
        circuitId: circuit.id,
        severity: ValidationSeverity.WARNING,
        category: 'protection',
        code: 'PROT_001',
        title: 'Circuito sin protección',
        description: `El circuito ${circuit.id} no tiene protección asignada`,
        recommendation: 'Asignar protección automáticamente o manualmente',
        normReference: 'NEC 2020 Art. 240.4'
      });
      return issues;
    }

    const protection = circuit.protections[0];

    // Validar breaker vs ampacidad del conductor
    const ampacityA = this.getConductorAmpacity(circuit.conductorGauge);
    if (protection.breakerAmp > ampacityA) {
      issues.push({
        circuitId: circuit.id,
        severity: ValidationSeverity.CRITICAL,
        category: 'safety',
        code: 'SAFETY_001',
        title: 'Breaker sobredimensionado',
        description: `El breaker de ${protection.breakerAmp}A excede la ampacidad del conductor ${circuit.conductorGauge} (${ampacityA}A)`,
        recommendation: 'Reducir el amperaje del breaker o aumentar el calibre del conductor',
        normReference: 'NEC 2020 Art. 240.4(B)',
        currentValue: protection.breakerAmp,
        expectedValue: `≤ ${ampacityA}A`
      });
    }

    // Validar breaker vs corriente del circuito
    const currentA = this.calculateCircuitCurrent(circuit.loadVA, circuit.voltage);
    if (protection.breakerAmp < currentA) {
      issues.push({
        circuitId: circuit.id,
        severity: ValidationSeverity.ERROR,
        category: 'safety',
        code: 'SAFETY_002',
        title: 'Breaker subdimensionado',
        description: `El breaker de ${protection.breakerAmp}A es menor que la corriente del circuito (${currentA}A)`,
        recommendation: 'Aumentar el amperaje del breaker para evitar disparos innecesarios',
        normReference: 'NEC 2020 Art. 240.4(A)',
        currentValue: protection.breakerAmp,
        expectedValue: `≥ ${currentA}A`
      });
    }

    // Validar que el breaker sea estándar
    if (!this.standardBreakers.includes(protection.breakerAmp)) {
      issues.push({
        circuitId: circuit.id,
        severity: ValidationSeverity.WARNING,
        category: 'compliance',
        code: 'COMP_001',
        title: 'Breaker no estándar',
        description: `El breaker de ${protection.breakerAmp}A no es un valor estándar`,
        recommendation: 'Usar valores estándar: 15, 20, 25, 30, 40, 50, 60A',
        normReference: 'NEC 2020 Art. 240.6',
        currentValue: protection.breakerAmp,
        expectedValue: this.standardBreakers.join(', ')
      });
    }

    // Validar diferencial según tipo de área
    const expectedDifferential = this.getExpectedDifferentialType(circuit.areaType);
    if (expectedDifferential !== 'NONE' && protection.differentialType !== expectedDifferential) {
      issues.push({
        circuitId: circuit.id,
        severity: ValidationSeverity.ERROR,
        category: 'compliance',
        code: 'COMP_002',
        title: 'Diferencial incorrecto para el área',
        description: `El área "${circuit.areaType}" requiere diferencial ${expectedDifferential}, pero tiene ${protection.differentialType}`,
        recommendation: `Cambiar a diferencial ${expectedDifferential}`,
        normReference: expectedDifferential === 'GFCI' ? 'NEC 2020 Art. 210.8' : 'NEC 2020 Art. 210.12',
        currentValue: protection.differentialType,
        expectedValue: expectedDifferential
      });
    }

    // Validar margen de seguridad del breaker
    const safetyMargin = protection.breakerAmp / currentA;
    if (safetyMargin > 1.5) {
      issues.push({
        circuitId: circuit.id,
        severity: ValidationSeverity.INFO,
        category: 'efficiency',
        code: 'EFF_001',
        title: 'Breaker con margen excesivo',
        description: `El breaker tiene un margen de seguridad del ${Math.round(safetyMargin * 100)}%`,
        recommendation: 'Considerar reducir el amperaje del breaker para optimizar costos',
        currentValue: `${Math.round(safetyMargin * 100)}%`,
        expectedValue: '≤ 150%'
      });
    }

    // Validar tipo de breaker
    if (protection.breakerType !== 'MCB' && protection.breakerType !== 'MCCB') {
      issues.push({
        circuitId: circuit.id,
        severity: ValidationSeverity.WARNING,
        category: 'compliance',
        code: 'COMP_003',
        title: 'Tipo de breaker no estándar',
        description: `El tipo de breaker "${protection.breakerType}" no es estándar para circuitos residenciales`,
        recommendation: 'Usar MCB para circuitos monofásicos estándar',
        normReference: 'NEC 2020 Art. 240.6',
        currentValue: protection.breakerType,
        expectedValue: 'MCB o MCCB'
      });
    }

    return issues;
  }

  /**
   * Obtiene la ampacidad del conductor
   */
  private getConductorAmpacity(conductorGauge: string): number {
    return this.ampacityTable[conductorGauge] || 20;
  }

  /**
   * Calcula la corriente del circuito
   */
  private calculateCircuitCurrent(loadVA: number, voltage: number): number {
    return Math.ceil(loadVA / voltage);
  }

  /**
   * Obtiene el tipo de diferencial esperado para el área
   */
  private getExpectedDifferentialType(areaType: string): string {
    const normalizedAreaType = areaType.toLowerCase().trim();
    
    if (this.differentialRules.GFCI_required_areas.includes(normalizedAreaType)) {
      return 'GFCI';
    }
    
    if (this.differentialRules.AFCI_susceptible_areas.includes(normalizedAreaType)) {
      return 'AFCI';
    }
    
    return 'NONE';
  }

  /**
   * Calcula el resumen de validaciones
   */
  private calculateSummary(issues: ValidationIssue[]): { info: number; warnings: number; errors: number; critical: number } {
    return {
      info: issues.filter(i => i.severity === ValidationSeverity.INFO).length,
      warnings: issues.filter(i => i.severity === ValidationSeverity.WARNING).length,
      errors: issues.filter(i => i.severity === ValidationSeverity.ERROR).length,
      critical: issues.filter(i => i.severity === ValidationSeverity.CRITICAL).length
    };
  }

  /**
   * Obtiene las reglas de validación para documentación
   */
  getValidationRules(): any {
    return {
      ampacityTable: this.ampacityTable,
      standardBreakers: this.standardBreakers,
      differentialRules: this.differentialRules,
      severityLevels: {
        CRITICAL: 'Problema de seguridad que debe resolverse inmediatamente',
        ERROR: 'Violación de normativa que debe corregirse',
        WARNING: 'Advertencia que debe revisarse',
        INFO: 'Información para optimización'
      }
    };
  }
}
