import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { ProtectionsService } from './protections.service';

export interface ValidationIssue {
  circuitId: number;
  severity: 'info' | 'warning' | 'error' | 'critical';
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

@Component({
  selector: 'app-protections-validation',
  templateUrl: './protections-validation.component.html',
  styleUrls: ['./protections-validation.component.scss']
})
export class ProtectionsValidationComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  @Input() projectId: number | null = null;
  
  validationResult: ValidationResult | null = null;
  loading = false;
  error: string | null = null;
  expandedIssues = new Set<number>();

  constructor(private protectionsService: ProtectionsService) {}

  ngOnInit(): void {
    if (this.projectId) {
      this.validateProtections();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Valida las protecciones del proyecto
   */
  validateProtections(): void {
    if (!this.projectId) return;

    this.loading = true;
    this.error = null;

    // Simular llamada al servicio (en un caso real, esto sería una llamada HTTP)
    this.protectionsService.getProtectionsByProjectId(this.projectId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (circuits) => {
          // Generar validaciones simuladas basadas en los circuitos
          this.validationResult = this.generateValidationResult(circuits);
          this.loading = false;
        },
        error: (error) => {
          this.error = 'Error al cargar las protecciones para validación';
          this.loading = false;
          console.error('Error en validación:', error);
        }
      });
  }

  /**
   * Genera resultado de validación simulado
   */
  private generateValidationResult(circuits: any[]): ValidationResult {
    const issues: ValidationIssue[] = [];
    
    circuits.forEach(circuit => {
      // Validar que tenga protección
      if (!circuit.protection) {
        issues.push({
          circuitId: circuit.id,
          severity: 'warning',
          category: 'protection',
          code: 'PROT_001',
          title: 'Circuito sin protección',
          description: `El circuito ${circuit.id} no tiene protección asignada`,
          recommendation: 'Asignar protección automáticamente o manualmente',
          normReference: 'NEC 2020 Art. 240.4'
        });
        return;
      }

      const protection = circuit.protection;
      
      // Validar breaker vs ampacidad
      const ampacityA = this.getConductorAmpacity(circuit.conductorGauge);
      if (protection.breakerAmp > ampacityA) {
        issues.push({
          circuitId: circuit.id,
          severity: 'critical',
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

      // Validar breaker vs corriente
      const currentA = Math.ceil(circuit.loadVA / circuit.voltage);
      if (protection.breakerAmp < currentA) {
        issues.push({
          circuitId: circuit.id,
          severity: 'error',
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

      // Validar diferencial según área
      const expectedDifferential = this.getExpectedDifferentialType(circuit.areaType);
      if (expectedDifferential !== 'NONE' && protection.differentialType !== expectedDifferential) {
        issues.push({
          circuitId: circuit.id,
          severity: 'error',
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
    });

    const summary = {
      info: issues.filter(i => i.severity === 'info').length,
      warnings: issues.filter(i => i.severity === 'warning').length,
      errors: issues.filter(i => i.severity === 'error').length,
      critical: issues.filter(i => i.severity === 'critical').length
    };

    return {
      projectId: this.projectId!,
      totalCircuits: circuits.length,
      issues,
      summary,
      isValid: summary.errors === 0 && summary.critical === 0
    };
  }

  /**
   * Obtiene la ampacidad del conductor
   */
  private getConductorAmpacity(conductorGauge: string): number {
    const ampacityTable: { [key: string]: number } = {
      '1.5 mm2': 15,
      '2.0 mm2': 20,
      '3.5 mm2': 30,
      '5.5 mm2': 50,
      '8.0 mm2': 70
    };
    
    return ampacityTable[conductorGauge] || 20;
  }

  /**
   * Obtiene el tipo de diferencial esperado para el área
   */
  private getExpectedDifferentialType(areaType: string): string {
    const normalizedAreaType = areaType.toLowerCase().trim();
    
    if (['banio', 'cocina', 'lavanderia', 'exteriores'].includes(normalizedAreaType)) {
      return 'GFCI';
    }
    
    if (['dormitorio', 'estudio', 'sala'].includes(normalizedAreaType)) {
      return 'AFCI';
    }
    
    return 'NONE';
  }

  /**
   * Obtiene la clase CSS para la severidad
   */
  getSeverityClass(severity: string): string {
    switch (severity) {
      case 'critical': return 'alert-danger';
      case 'error': return 'alert-danger';
      case 'warning': return 'alert-warning';
      case 'info': return 'alert-info';
      default: return 'alert-secondary';
    }
  }

  /**
   * Obtiene el icono para la severidad
   */
  getSeverityIcon(severity: string): string {
    switch (severity) {
      case 'critical': return 'fas fa-exclamation-triangle';
      case 'error': return 'fas fa-times-circle';
      case 'warning': return 'fas fa-exclamation-circle';
      case 'info': return 'fas fa-info-circle';
      default: return 'fas fa-question-circle';
    }
  }

  /**
   * Obtiene el color del badge para la severidad
   */
  getSeverityBadgeClass(severity: string): string {
    switch (severity) {
      case 'critical': return 'bg-danger';
      case 'error': return 'bg-danger';
      case 'warning': return 'bg-warning';
      case 'info': return 'bg-info';
      default: return 'bg-secondary';
    }
  }

  /**
   * Obtiene el texto para la severidad
   */
  getSeverityText(severity: string): string {
    switch (severity) {
      case 'critical': return 'Crítico';
      case 'error': return 'Error';
      case 'warning': return 'Advertencia';
      case 'info': return 'Información';
      default: return 'Desconocido';
    }
  }

  /**
   * Expande o colapsa un issue
   */
  toggleIssue(issueId: number): void {
    if (this.expandedIssues.has(issueId)) {
      this.expandedIssues.delete(issueId);
    } else {
      this.expandedIssues.add(issueId);
    }
  }

  /**
   * Verifica si un issue está expandido
   */
  isIssueExpanded(issueId: number): boolean {
    return this.expandedIssues.has(issueId);
  }

  /**
   * Obtiene el color del badge para la categoría
   */
  getCategoryBadgeClass(category: string): string {
    switch (category) {
      case 'safety': return 'bg-danger';
      case 'compliance': return 'bg-warning';
      case 'protection': return 'bg-info';
      case 'efficiency': return 'bg-success';
      default: return 'bg-secondary';
    }
  }

  /**
   * Obtiene el texto para la categoría
   */
  getCategoryText(category: string): string {
    switch (category) {
      case 'safety': return 'Seguridad';
      case 'compliance': return 'Cumplimiento';
      case 'protection': return 'Protección';
      case 'efficiency': return 'Eficiencia';
      default: return category;
    }
  }

  /**
   * Limpia el error
   */
  clearError(): void {
    this.error = null;
  }

  /**
   * Refresca la validación
   */
  refreshValidation(): void {
    this.validateProtections();
  }
  
  /**
   * Método para trackear items en ngFor
   */
  trackByIssueId(index: number, issue: ValidationIssue): number {
    return issue.circuitId;
  }
}
