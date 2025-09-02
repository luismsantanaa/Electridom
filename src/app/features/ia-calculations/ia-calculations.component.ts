import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { IACalculationsService, IASuperficie, IAConsumo, IACalculationResponse } from './ia-calculations.service';

@Component({
  selector: 'app-ia-calculations',
  templateUrl: './ia-calculations.component.html',
  styleUrls: ['./ia-calculations.component.scss']
})
export class IACalculationsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Formularios
  superficiesForm: FormGroup;
  consumosForm: FormGroup;
  projectForm: FormGroup;

  // Estados
  loading = false;
  error: string | null = null;
  showResults = false;
  activeTab: 'manual' | 'ia' = 'manual';

  // Datos
  iaResult: IACalculationResponse | null = null;
  totalLoad = 0;
  loadByAmbiente: { [ambiente: string]: number } = {};

  constructor(
    private formBuilder: FormBuilder,
    private iaService: IACalculationsService
  ) {
    this.superficiesForm = this.formBuilder.group({
      superficies: this.formBuilder.array([])
    });

    this.consumosForm = this.formBuilder.group({
      consumos: this.formBuilder.array([])
    });

    this.projectForm = this.formBuilder.group({
      projectId: ['', [Validators.required, Validators.min(1)]]
    });
  }

  ngOnInit(): void {
    this.subscribeToService();
    this.addSuperficie();
    this.addConsumo();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private subscribeToService(): void {
    this.iaService.loading$.pipe(takeUntil(this.destroy$)).subscribe(loading => {
      this.loading = loading;
    });

    this.iaService.error$.pipe(takeUntil(this.destroy$)).subscribe(error => {
      this.error = error;
    });

    this.iaService.lastResult$.pipe(takeUntil(this.destroy$)).subscribe(result => {
      this.iaResult = result;
      if (result) {
        this.showResults = true;
        this.activeTab = 'ia';
      }
    });
  }

  // Getters para formularios
  get superficiesArray(): FormArray {
    return this.superficiesForm.get('superficies') as FormArray;
  }

  get consumosArray(): FormArray {
    return this.consumosForm.get('consumos') as FormArray;
  }

  // Métodos para superficies
  addSuperficie(): void {
    const superficie = this.formBuilder.group({
      nombre: ['', Validators.required],
      area_m2: [0, [Validators.required, Validators.min(0.1)]]
    });

    this.superficiesArray.push(superficie);
  }

  removeSuperficie(index: number): void {
    this.superficiesArray.removeAt(index);
    this.updateCalculations();
  }

  // Métodos para consumos
  addConsumo(): void {
    const consumo = this.formBuilder.group({
      equipo: ['', Validators.required],
      ambiente: ['', Validators.required],
      w: [0, [Validators.required, Validators.min(1)]]
    });

    this.consumosArray.push(consumo);
  }

  removeConsumo(index: number): void {
    this.consumosArray.removeAt(index);
    this.updateCalculations();
  }

  // Actualizar cálculos cuando cambian los datos
  updateCalculations(): void {
    const consumos = this.consumosForm.value.consumos;
    this.totalLoad = this.iaService.calculateTotalLoad(consumos);
    this.loadByAmbiente = this.iaService.calculateLoadByAmbiente(consumos);
  }

  // Calcular con IA
  calculateWithIA(): void {
    if (this.projectForm.invalid) {
      this.error = 'Por favor, ingrese un ID de proyecto válido';
      return;
    }

    const superficies = this.superficiesForm.value.superficies;
    const consumos = this.consumosForm.value.consumos;
    const projectId = this.projectForm.value.projectId;

    // Validar entradas
    const validation = this.iaService.validateInputs(superficies, consumos);
    if (!validation.isValid) {
      this.error = validation.errors.join(', ');
      return;
    }

    // Realizar cálculo
    const request = {
      projectId,
      inputs: { superficies, consumos }
    };

    this.iaService.calculateWithIA(request).subscribe({
      next: (response) => {
        console.log('Cálculo IA completado:', response);
      },
      error: (error) => {
        console.error('Error en cálculo IA:', error);
      }
    });
  }

  // Cargar último resultado
  loadLastResult(): void {
    const projectId = this.projectForm.value.projectId;
    if (projectId) {
      this.iaService.getLastIAResult(projectId).subscribe({
        next: (response) => {
          if (response) {
            console.log('Último resultado cargado:', response);
          }
        },
        error: (error) => {
          console.error('Error cargando último resultado:', error);
        }
      });
    }
  }

  // Cambiar pestaña
  setActiveTab(tab: 'manual' | 'ia'): void {
    this.activeTab = tab;
  }

  // Limpiar error
  clearError(): void {
    this.error = null;
  }

  // Limpiar formularios
  clearForms(): void {
    this.superficiesForm.reset();
    this.consumosForm.reset();
    this.projectForm.reset();
    this.iaService.clearLastResult();
    this.showResults = false;
    this.activeTab = 'manual';
    this.totalLoad = 0;
    this.loadByAmbiente = {};

    // Agregar campos iniciales
    while (this.superficiesArray.length > 0) {
      this.superficiesArray.removeAt(0);
    }
    while (this.consumosArray.length > 0) {
      this.consumosArray.removeAt(0);
    }

    this.addSuperficie();
    this.addConsumo();
  }

  // Obtener ambientes únicos para el dropdown
  getUniqueAmbientes(): string[] {
    const superficies = this.superficiesForm.value.superficies;
    return superficies.map((s: IASuperficie) => s.nombre).filter(Boolean);
  }

  // Track by functions para ngFor
  trackBySuperficie(index: number, item: any): number {
    return index;
  }

  trackByConsumo(index: number, item: any): number {
    return index;
  }
}
