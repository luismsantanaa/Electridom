import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { IaService, CalcRequest, CalcResponse, SystemConfig, Environment, Consumption } from '../../services/ia.service';

@Component({
  selector: 'app-calculos-ia',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './calculos-ia.component.html',
  styleUrls: ['./calculos-ia.component.scss']
})
export class CalculosIaComponent {
  private iaService = inject(IaService);
  private fb = inject(FormBuilder);

  // Signals
  isLoading = signal(false);
  result = signal<CalcResponse | null>(null);
  error = signal<string | null>(null);

  // Formulario reactivo
  calcForm: FormGroup = this.fb.group({
    system: this.fb.group({
      voltage: [120, [Validators.required, Validators.min(1)]],
      phases: [1, [Validators.required, Validators.min(1), Validators.max(3)]],
      frequency: [60, [Validators.required, Validators.min(50), Validators.max(60)]]
    }),
    superficies: this.fb.array([]),
    consumos: this.fb.array([]),
    model: [''],
    temperature: [0.3, [Validators.min(0), Validators.max(1)]]
  });

  // Computed
  canCalculate = computed(() => {
    return this.calcForm.valid && !this.isLoading();
  });

  constructor() {
    this.addEnvironment();
    this.addConsumption();
  }

  // Getters para acceder a los FormArrays
  get superficiesArray(): FormArray {
    return this.calcForm.get('superficies') as FormArray;
  }

  get consumosArray(): FormArray {
    return this.calcForm.get('consumos') as FormArray;
  }

  // Métodos para manejar superficies
  addEnvironment() {
    const environmentForm = this.fb.group({
      nombre: ['', Validators.required],
      area_m2: [0, [Validators.required, Validators.min(0.1)]],
      tipo: ['residencial', Validators.required]
    });

    this.superficiesArray.push(environmentForm);
  }

  removeEnvironment(index: number) {
    if (this.superficiesArray.length > 1) {
      this.superficiesArray.removeAt(index);
    }
  }

  // Métodos para manejar consumos
  addConsumption() {
    const consumptionForm = this.fb.group({
      nombre: ['', Validators.required],
      ambiente: ['', Validators.required],
      potencia_w: [0, [Validators.required, Validators.min(0.1)]],
      tipo: ['iluminacion', Validators.required]
    });

    this.consumosArray.push(consumptionForm);
  }

  removeConsumption(index: number) {
    if (this.consumosArray.length > 1) {
      this.consumosArray.removeAt(index);
    }
  }

  // Calcular
  calculate() {
    if (!this.calcForm.valid || this.isLoading()) return;

    this.isLoading.set(true);
    this.error.set(null);
    this.result.set(null);

    const request: CalcRequest = this.calcForm.value;

    this.iaService.calculate(request).subscribe({
      next: (response) => {
        this.result.set(response);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error en cálculo:', error);
        this.error.set('Error al realizar el cálculo. Por favor, verifica los datos e intenta de nuevo.');
        this.isLoading.set(false);
      }
    });
  }

  // Limpiar resultados
  clearResults() {
    this.result.set(null);
    this.error.set(null);
  }

  // Obtener clases CSS para el estado de cumplimiento
  getComplianceClass(status: string): string {
    switch (status) {
      case 'compliant': return 'compliant';
      case 'warning': return 'warning';
      case 'non_compliant': return 'non-compliant';
      default: return '';
    }
  }

  // Obtener clases CSS para el nivel de seguridad
  getSafetyClass(level: string): string {
    switch (level) {
      case 'high': return 'safe';
      case 'medium': return 'warning';
      case 'low': return 'danger';
      default: return '';
    }
  }
}
