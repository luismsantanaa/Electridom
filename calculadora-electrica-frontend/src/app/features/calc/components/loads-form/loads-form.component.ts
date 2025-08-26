import { Component, signal, computed, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { Consumption, Environment } from '../../services/calc-api.service';

@Component({
  selector: 'app-loads-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="card">
      <div class="card-header">
        <h5 class="card-title mb-0">
          <i class="fas fa-bolt me-2"></i>
          Consumos Eléctricos
        </h5>
      </div>
      <div class="card-body">
        <form [formGroup]="loadsForm" (ngSubmit)="onSubmit()">
          <!-- Lista de Consumos -->
          <div class="mb-3">
            <div class="d-flex justify-content-between align-items-center mb-3">
              <h6 class="mb-0">Consumos por Ambiente</h6>
              <button 
                type="button" 
                class="btn btn-primary btn-sm"
                (click)="addLoad()"
                [disabled]="loading() || availableEnvironments().length === 0"
              >
                <i class="fas fa-plus me-1"></i>
                Agregar Consumo
              </button>
            </div>

            <div class="alert alert-warning" *ngIf="availableEnvironments().length === 0">
              <i class="fas fa-exclamation-triangle me-2"></i>
              Primero debes agregar ambientes en el formulario anterior
            </div>

            <div formArrayName="loads" class="loads-list" *ngIf="availableEnvironments().length > 0">
              <div 
                *ngFor="let load of loadsArray().controls; let i = index" 
                [formGroupName]="i"
                class="load-item border rounded p-3 mb-3"
              >
                <div class="row">
                  <div class="col-md-3">
                    <label [for]="'loadName' + i" class="form-label">Nombre del Consumo</label>
                    <input 
                      type="text" 
                      class="form-control" 
                      [id]="'loadName' + i"
                      formControlName="nombre"
                      placeholder="Ej: TV, Refrigerador, A/C"
                    >
                    <div class="invalid-feedback" *ngIf="load.get('nombre')?.invalid && load.get('nombre')?.touched">
                      Nombre es requerido
                    </div>
                  </div>
                  <div class="col-md-3">
                    <label [for]="'loadEnvironment' + i" class="form-label">Ambiente</label>
                    <select 
                      class="form-select" 
                      [id]="'loadEnvironment' + i"
                      formControlName="ambiente"
                    >
                      <option value="">Seleccionar ambiente</option>
                      <option *ngFor="let env of availableEnvironments()" [value]="env.nombre">
                        {{ env.nombre }}
                      </option>
                    </select>
                    <div class="invalid-feedback" *ngIf="load.get('ambiente')?.invalid && load.get('ambiente')?.touched">
                      Ambiente es requerido
                    </div>
                  </div>
                  <div class="col-md-2">
                    <label [for]="'loadPower' + i" class="form-label">Potencia (W)</label>
                    <input 
                      type="number" 
                      class="form-control" 
                      [id]="'loadPower' + i"
                      formControlName="potencia_w"
                      placeholder="0"
                      min="1"
                    >
                    <div class="invalid-feedback" *ngIf="load.get('potencia_w')?.invalid && load.get('potencia_w')?.touched">
                      Potencia debe ser mayor a 0
                    </div>
                  </div>
                  <div class="col-md-2">
                    <label [for]="'loadFP' + i" class="form-label">FP</label>
                    <input 
                      type="number" 
                      class="form-control" 
                      [id]="'loadFP' + i"
                      formControlName="fp"
                      placeholder="1.0"
                      step="0.1"
                      min="0.1"
                      max="1.0"
                    >
                    <div class="invalid-feedback" *ngIf="load.get('fp')?.invalid && load.get('fp')?.touched">
                      FP debe estar entre 0.1 y 1.0
                    </div>
                  </div>
                  <div class="col-md-2">
                    <label [for]="'loadType' + i" class="form-label">Tipo</label>
                    <select 
                      class="form-select" 
                      [id]="'loadType' + i"
                      formControlName="tipo"
                    >
                      <option value="electrodomestico">Electrodoméstico</option>
                      <option value="iluminacion">Iluminación</option>
                      <option value="toma_general">Toma General</option>
                      <option value="climatizacion">Climatización</option>
                      <option value="especial">Especial</option>
                    </select>
                  </div>
                  <div class="col-md-12 mt-2 d-flex justify-content-end">
                    <button 
                      type="button" 
                      class="btn btn-danger btn-sm"
                      (click)="removeLoad(i)"
                    >
                      <i class="fas fa-trash me-1"></i>
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div class="alert alert-info" *ngIf="loadsArray.length === 0 && availableEnvironments().length > 0">
              <i class="fas fa-info-circle me-2"></i>
              Agrega consumos eléctricos para continuar
            </div>
          </div>

          <!-- Resumen -->
          <div class="row mb-3" *ngIf="loadsArray.length > 0">
            <div class="col-12">
              <div class="card bg-light">
                <div class="card-body">
                  <h6 class="card-title">Resumen de Consumos</h6>
                  <div class="row">
                    <div class="col-md-4">
                      <strong>Total de consumos:</strong> {{ loadsArray().length }}
                    </div>
                    <div class="col-md-4">
                      <strong>Potencia total:</strong> {{ totalPower() | number:'1.0-0' }} W
                    </div>
                    <div class="col-md-4">
                      <strong>Consumos por ambiente:</strong>
                      <ul class="list-unstyled mb-0">
                        <li *ngFor="let summary of consumptionSummary()">
                          {{ summary.ambiente }}: {{ summary.count }} consumos
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Botones de acción -->
          <div class="d-flex justify-content-between">
            <button 
              type="button" 
              class="btn btn-secondary"
              (click)="clearForm()"
              [disabled]="loading()"
            >
              <i class="fas fa-eraser me-1"></i>
              Limpiar
            </button>
            <button 
              type="submit" 
              class="btn btn-success"
              [disabled]="loadsForm.invalid || loading() || availableEnvironments().length === 0"
            >
              <i class="fas fa-check me-1"></i>
              Validar y Previsualizar
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .loads-list {
      max-height: 400px;
      overflow-y: auto;
    }
    .load-item {
      background-color: #f8f9fa;
      transition: all 0.3s ease;
    }
    .load-item:hover {
      background-color: #e9ecef;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .form-control:focus, .form-select:focus {
      border-color: #0d6efd;
      box-shadow: 0 0 0 0.2rem rgba(13, 110, 253, 0.25);
    }
    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    .list-unstyled li {
      font-size: 0.9rem;
    }
  `]
})
export class LoadsFormComponent {
  private fb = inject(FormBuilder);
  
  // Input signals
  environments = input<Environment[]>([]);
  
  // Signals
  loading = signal(false);
  
  // Formulario reactivo
  loadsForm: FormGroup;
  
  // Computed properties
  loadsArray = computed(() => this.loadsForm.get('loads') as FormArray);
  availableEnvironments = computed(() => this.environments());
  
  totalPower = computed(() => {
    const loads = this.loadsArray();
    return loads.controls.reduce((total, load) => {
      const power = load.get('potencia_w')?.value || 0;
      return total + power;
    }, 0);
  });

  consumptionSummary = computed(() => {
    const loads = this.loadsArray();
    const summary: { [key: string]: number } = {};
    
    loads.controls.forEach(load => {
      const ambiente = load.get('ambiente')?.value;
      if (ambiente) {
        summary[ambiente] = (summary[ambiente] || 0) + 1;
      }
    });
    
    return Object.keys(summary).map(ambiente => ({
      ambiente,
      count: summary[ambiente]
    }));
  });

  constructor() {
    this.loadsForm = this.fb.group({
      loads: this.fb.array([])
    });
  }

  // Métodos del formulario
  addLoad(): void {
    const load = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(1)]],
      ambiente: ['', [Validators.required]],
      potencia_w: [0, [Validators.required, Validators.min(1)]],
      fp: [1.0, [Validators.required, Validators.min(0.1), Validators.max(1.0)]],
      tipo: ['electrodomestico', [Validators.required]]
    });
    
    this.loadsArray().push(load);
  }

  removeLoad(index: number): void {
    this.loadsArray().removeAt(index);
  }

  clearForm(): void {
    // Limpiar array de consumos
    while (this.loadsArray().length !== 0) {
      this.loadsArray().removeAt(0);
    }
  }

  onSubmit(): void {
    if (this.loadsForm.valid && this.availableEnvironments().length > 0) {
      const formValue = this.loadsForm.value;
      
      // Preparar datos para el servicio
      const consumptions: Consumption[] = formValue.loads.map((load: any) => ({
        nombre: load.nombre,
        ambiente: load.ambiente,
        potencia_w: load.potencia_w,
        fp: load.fp,
        tipo: load.tipo
      }));

      // Emitir evento con los datos
      this.loadsData.set(consumptions);
    } else {
      // Marcar todos los campos como touched para mostrar errores
      this.markFormGroupTouched(this.loadsForm);
    }
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      } else if (control instanceof FormArray) {
        control.controls.forEach(arrayControl => {
          if (arrayControl instanceof FormGroup) {
            this.markFormGroupTouched(arrayControl);
          } else {
            arrayControl.markAsTouched();
          }
        });
      } else {
        control?.markAsTouched();
      }
    });
  }

  // Signal para comunicar datos con el componente padre
  loadsData = signal<Consumption[] | null>(null);
}
