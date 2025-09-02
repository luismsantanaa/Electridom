import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { ProtectionsService, CircuitProtection, Protection } from './protections.service';

@Component({
  selector: 'app-protections',
  templateUrl: './protections.component.html',
  styleUrls: ['./protections.component.scss']
})
export class ProtectionsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  projectForm: FormGroup;
  protections: CircuitProtection[] = [];
  loading = false;
  error: string | null = null;
  selectedProjectId: number | null = null;

  // Configuración de la tabla
  tableColumns = [
    { field: 'id', header: 'ID', sortable: true },
    { field: 'loadVA', header: 'Carga (VA)', sortable: true },
    { field: 'conductorGauge', header: 'Conductor', sortable: true },
    { field: 'areaType', header: 'Tipo de Área', sortable: true },
    { field: 'phase', header: 'Fase', sortable: true },
    { field: 'voltage', header: 'Tensión (V)', sortable: true },
    { field: 'currentA', header: 'Corriente (A)', sortable: true },
    { field: 'protection.breakerAmp', header: 'Breaker (A)', sortable: true },
    { field: 'protection.breakerType', header: 'Tipo Breaker', sortable: true },
    { field: 'protection.differentialType', header: 'Diferencial', sortable: true },
    { field: 'protection.notes', header: 'Notas', sortable: false }
  ];

  constructor(
    private formBuilder: FormBuilder,
    private protectionsService: ProtectionsService
  ) {
    this.projectForm = this.formBuilder.group({
      projectId: ['', [Validators.required, Validators.min(1)]]
    });
  }

  ngOnInit(): void {
    this.subscribeToService();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private subscribeToService(): void {
    this.protectionsService.loading$
      .pipe(takeUntil(this.destroy$))
      .subscribe(loading => this.loading = loading);

    this.protectionsService.error$
      .pipe(takeUntil(this.destroy$))
      .subscribe(error => this.error = error);
  }

  /**
   * Carga las protecciones de un proyecto
   */
  loadProtections(): void {
    if (this.projectForm.valid) {
      const projectId = this.projectForm.get('projectId')?.value;
      this.selectedProjectId = projectId;

      this.protectionsService.getProtectionsByProjectId(projectId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (data) => {
            this.protections = data;
          },
          error: (error) => {
            console.error('Error al cargar protecciones:', error);
          }
        });
    }
  }

  /**
   * Recalcula todas las protecciones del proyecto
   */
  recalculateAllProtections(): void {
    if (this.selectedProjectId) {
      this.protectionsService.recalculateProtections(this.selectedProjectId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (protections) => {
            // Actualizar las protecciones en la lista
            this.updateProtectionsList(protections);
            this.showSuccessMessage('Protecciones recalculadas exitosamente');
          },
          error: (error) => {
            console.error('Error al recalcular protecciones:', error);
            this.showErrorMessage('Error al recalcular protecciones');
          }
        });
    }
  }

  /**
   * Recalcula la protección de un circuito específico
   */
  recalculateCircuitProtection(circuit: CircuitProtection): void {
    if (this.selectedProjectId) {
      // Simular recálculo individual (en un caso real, esto podría ser un endpoint separado)
      const currentA = this.protectionsService.calculateCircuitCurrent(circuit.loadVA, circuit.voltage);
      const ampacityA = this.protectionsService.getConductorAmpacity(circuit.conductorGauge);
      const breakerAmp = this.protectionsService.selectBreaker(currentA, ampacityA);
      const differentialType = this.protectionsService.getDifferentialTypeForArea(circuit.areaType);

      // Crear o actualizar la protección
      const protectionData = {
        circuitId: circuit.id,
        breakerAmp,
        breakerType: 'MCB',
        differentialType,
        notes: this.generateProtectionNotes(circuit, breakerAmp, differentialType)
      };

      if (circuit.protection) {
        // Actualizar protección existente
        this.protectionsService.updateProtection(circuit.protection.id, protectionData)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (updatedProtection) => {
              this.updateCircuitProtection(circuit.id, updatedProtection);
              this.showSuccessMessage(`Protección del circuito ${circuit.id} recalculada`);
            },
            error: (error) => {
              console.error('Error al actualizar protección:', error);
              this.showErrorMessage('Error al recalcular protección individual');
            }
          });
      } else {
        // Crear nueva protección
        this.protectionsService.createProtection(protectionData)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (newProtection) => {
              this.updateCircuitProtection(circuit.id, newProtection);
              this.showSuccessMessage(`Protección del circuito ${circuit.id} creada`);
            },
            error: (error) => {
              console.error('Error al crear protección:', error);
              this.showErrorMessage('Error al crear protección individual');
            }
          });
      }
    }
  }

  /**
   * Actualiza la lista de protecciones después del recálculo
   */
  private updateProtectionsList(protections: Protection[]): void {
    // Crear un mapa de protecciones por circuitId
    const protectionMap = new Map<number, Protection>();
    protections.forEach(protection => {
      protectionMap.set(protection.circuitId, protection);
    });

    // Actualizar la lista de circuitos con las nuevas protecciones
    this.protections = this.protections.map(circuit => ({
      ...circuit,
      protection: protectionMap.get(circuit.id) || circuit.protection
    }));
  }

  /**
   * Actualiza la protección de un circuito específico
   */
  private updateCircuitProtection(circuitId: number, protection: Protection): void {
    this.protections = this.protections.map(circuit => 
      circuit.id === circuitId 
        ? { ...circuit, protection } 
        : circuit
    );
  }

  /**
   * Genera notas explicativas para la protección
   */
  private generateProtectionNotes(circuit: CircuitProtection, breakerAmp: number, differentialType: string): string {
    const notes: string[] = [];
    
    // Nota sobre selección de breaker
    const currentA = this.protectionsService.calculateCircuitCurrent(circuit.loadVA, circuit.voltage);
    if (breakerAmp > currentA * 1.25) {
      notes.push(`Breaker ${breakerAmp}A seleccionado con margen de seguridad`);
    }
    
    // Nota sobre diferencial
    if (differentialType === 'GFCI') {
      notes.push('GFCI requerido por normativa para área de riesgo');
    } else if (differentialType === 'AFCI') {
      notes.push('AFCI recomendado para protección contra arcos eléctricos');
    }
    
    return notes.join('; ');
  }

  /**
   * Muestra mensaje de éxito
   */
  private showSuccessMessage(message: string): void {
    // En un caso real, esto podría usar un servicio de notificaciones
    console.log('✅', message);
    // Aquí podrías implementar un toast o notificación visual
  }

  /**
   * Muestra mensaje de error
   */
  private showErrorMessage(message: string): void {
    // En un caso real, esto podría usar un servicio de notificaciones
    console.error('❌', message);
    // Aquí podrías implementar un toast o notificación visual
  }

  /**
   * Limpia el error
   */
  clearError(): void {
    this.error = null;
  }

  /**
   * Obtiene el estado de la protección para mostrar en la tabla
   */
  getProtectionStatus(circuit: CircuitProtection): string {
    if (!circuit.protection) {
      return 'Sin protección';
    }
    
    const currentA = this.protectionsService.calculateCircuitCurrent(circuit.loadVA, circuit.voltage);
    const ampacityA = this.protectionsService.getConductorAmpacity(circuit.conductorGauge);
    
    if (circuit.protection.breakerAmp > ampacityA) {
      return '⚠️ Sobredimensionado';
    }
    
    if (circuit.protection.breakerAmp < currentA) {
      return '❌ Subdimensionado';
    }
    
    return '✅ Correcto';
  }

  /**
   * Obtiene la clase CSS para el estado de la protección
   */
  getProtectionStatusClass(circuit: CircuitProtection): string {
    if (!circuit.protection) {
      return 'text-warning';
    }
    
    const currentA = this.protectionsService.calculateCircuitCurrent(circuit.loadVA, circuit.voltage);
    const ampacityA = this.protectionsService.getConductorAmpacity(circuit.conductorGauge);
    
    if (circuit.protection.breakerAmp > ampacityA) {
      return 'text-warning';
    }
    
    if (circuit.protection.breakerAmp < currentA) {
      return 'text-danger';
    }
    
    return 'text-success';
  }
}
