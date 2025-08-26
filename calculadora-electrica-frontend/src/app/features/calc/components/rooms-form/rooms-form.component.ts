import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { Environment } from '../../services/calc-api.service';

@Component({
  selector: 'app-rooms-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="card">
      <div class="card-header">
        <h5 class="card-title mb-0">
          <i class="fas fa-home me-2"></i>
          Ambientes y Superficies
        </h5>
      </div>
      <div class="card-body">
        <form [formGroup]="roomsForm" (ngSubmit)="onSubmit()">
          <!-- Configuración del Sistema -->
          <div class="row mb-4">
            <div class="col-md-4">
              <label for="voltage" class="form-label">Tensión (V)</label>
              <input 
                type="number" 
                class="form-control" 
                id="voltage"
                formControlName="voltage"
                placeholder="120"
              >
              <div class="invalid-feedback" *ngIf="roomsForm.get('voltage')?.invalid && roomsForm.get('voltage')?.touched">
                Tensión debe ser mayor a 0
              </div>
            </div>
            <div class="col-md-4">
              <label for="phases" class="form-label">Fases</label>
              <select class="form-select" id="phases" formControlName="phases">
                <option value="1">Monofásico (1)</option>
                <option value="3">Trifásico (3)</option>
              </select>
            </div>
            <div class="col-md-4">
              <label for="frequency" class="form-label">Frecuencia (Hz)</label>
              <input 
                type="number" 
                class="form-control" 
                id="frequency"
                formControlName="frequency"
                placeholder="60"
              >
            </div>
          </div>

          <!-- Lista de Ambientes -->
          <div class="mb-3">
            <div class="d-flex justify-content-between align-items-center mb-3">
              <h6 class="mb-0">Ambientes</h6>
              <button 
                type="button" 
                class="btn btn-primary btn-sm"
                (click)="addRoom()"
                [disabled]="loading()"
              >
                <i class="fas fa-plus me-1"></i>
                Agregar Ambiente
              </button>
            </div>

            <div formArrayName="rooms" class="rooms-list">
              <div 
                *ngFor="let room of roomsArray().controls; let i = index" 
                [formGroupName]="i"
                class="room-item border rounded p-3 mb-3"
              >
                <div class="row">
                  <div class="col-md-6">
                    <label [for]="'roomName' + i" class="form-label">Nombre del Ambiente</label>
                    <input 
                      type="text" 
                      class="form-control" 
                      [id]="'roomName' + i"
                      formControlName="nombre"
                      placeholder="Ej: Sala, Cocina, Dormitorio"
                    >
                    <div class="invalid-feedback" *ngIf="room.get('nombre')?.invalid && room.get('nombre')?.touched">
                      Nombre es requerido
                    </div>
                  </div>
                  <div class="col-md-4">
                    <label [for]="'roomArea' + i" class="form-label">Área (m²)</label>
                    <input 
                      type="number" 
                      class="form-control" 
                      [id]="'roomArea' + i"
                      formControlName="area_m2"
                      placeholder="0.00"
                      step="0.01"
                      min="0.1"
                    >
                    <div class="invalid-feedback" *ngIf="room.get('area_m2')?.invalid && room.get('area_m2')?.touched">
                      Área debe ser mayor a 0.1 m²
                    </div>
                  </div>
                  <div class="col-md-2 d-flex align-items-end">
                    <button 
                      type="button" 
                      class="btn btn-danger btn-sm w-100"
                      (click)="removeRoom(i)"
                      [disabled]="roomsArray.length <= 1"
                    >
                      <i class="fas fa-trash"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div class="alert alert-info" *ngIf="roomsArray.length === 0">
              <i class="fas fa-info-circle me-2"></i>
              Agrega al menos un ambiente para continuar
            </div>
          </div>

          <!-- Resumen -->
          <div class="row mb-3" *ngIf="roomsArray.length > 0">
            <div class="col-12">
              <div class="card bg-light">
                <div class="card-body">
                  <h6 class="card-title">Resumen de Ambientes</h6>
                  <div class="row">
                    <div class="col-md-6">
                      <strong>Total de ambientes:</strong> {{ roomsArray().length }}
                    </div>
                    <div class="col-md-6">
                      <strong>Área total:</strong> {{ totalArea() | number:'1.2-2' }} m²
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
              [disabled]="roomsForm.invalid || loading()"
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
    .rooms-list {
      max-height: 400px;
      overflow-y: auto;
    }
    .room-item {
      background-color: #f8f9fa;
      transition: all 0.3s ease;
    }
    .room-item:hover {
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
  `]
})
export class RoomsFormComponent {
  private fb = inject(FormBuilder);
  
  // Signals
  loading = signal(false);
  
  // Formulario reactivo
  roomsForm: FormGroup;
  
  // Computed properties
  roomsArray = computed(() => this.roomsForm.get('rooms') as FormArray);
  totalArea = computed(() => {
    const rooms = this.roomsArray();
    return rooms.controls.reduce((total, room) => {
      const area = room.get('area_m2')?.value || 0;
      return total + area;
    }, 0);
  });

  constructor() {
    this.roomsForm = this.fb.group({
      voltage: [120, [Validators.required, Validators.min(1)]],
      phases: [1, [Validators.required, Validators.pattern(/^[13]$/)]],
      frequency: [60, [Validators.required, Validators.min(1)]],
      rooms: this.fb.array([])
    });

    // Agregar un ambiente por defecto
    this.addRoom();
  }

  // Métodos del formulario
  addRoom(): void {
    const room = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(1)]],
      area_m2: [0, [Validators.required, Validators.min(0.1)]]
    });
    
    this.roomsArray().push(room);
  }

  removeRoom(index: number): void {
    if (this.roomsArray().length > 1) {
      this.roomsArray().removeAt(index);
    }
  }

  clearForm(): void {
    // Limpiar array de ambientes
    while (this.roomsArray().length !== 0) {
      this.roomsArray().removeAt(0);
    }
    
    // Resetear valores del formulario
    this.roomsForm.patchValue({
      voltage: 120,
      phases: 1,
      frequency: 60
    });
    
    // Agregar un ambiente por defecto
    this.addRoom();
  }

  onSubmit(): void {
    if (this.roomsForm.valid) {
      const formValue = this.roomsForm.value;
      
      // Preparar datos para el servicio
      const environments: Environment[] = formValue.rooms.map((room: any) => ({
        nombre: room.nombre,
        area_m2: room.area_m2
      }));

      // Emitir evento con los datos
      this.roomsData.set({
        system: {
          voltage: formValue.voltage,
          phases: Number(formValue.phases) as 1 | 3,
          frequency: formValue.frequency
        },
        superficies: environments
      });
    } else {
      // Marcar todos los campos como touched para mostrar errores
      this.markFormGroupTouched(this.roomsForm);
    }
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      } else {
        control?.markAsTouched();
      }
    });
  }

  // Signal para comunicar datos con el componente padre
  roomsData = signal<{
    system: { voltage: number; phases: 1 | 3; frequency: number };
    superficies: Environment[];
  } | null>(null);
}
