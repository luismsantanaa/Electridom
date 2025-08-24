import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

export interface Superficie {
  nombre: string;
  area_m2: number;
}

@Component({
  selector: 'app-rooms-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="card">
      <div class="card-header">
        <h5>Ambientes y Superficies</h5>
      </div>
      <div class="card-body">
        <form [formGroup]="roomsForm" (ngSubmit)="onSubmit()">
          <div class="row">
            <div class="col-md-6">
              <div class="form-group">
                <label for="nombre">Nombre del Ambiente</label>
                <input 
                  type="text" 
                  class="form-control" 
                  id="nombre"
                  formControlName="nombre"
                  placeholder="Ej: Sala, Cocina, Dormitorio">
              </div>
            </div>
            <div class="col-md-6">
              <div class="form-group">
                <label for="area">Área (m²)</label>
                <input 
                  type="number" 
                  class="form-control" 
                  id="area"
                  formControlName="area_m2"
                  step="0.1"
                  min="0.1"
                  placeholder="Ej: 15.5">
              </div>
            </div>
          </div>
          <div class="mt-3">
            <button type="submit" class="btn btn-primary" [disabled]="!roomsForm.valid">
              Agregar Ambiente
            </button>
          </div>
        </form>

        <div class="mt-4">
          <h6>Ambientes Registrados</h6>
          <div class="table-responsive">
            <table class="table table-striped">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Área (m²)</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let superficie of superficies(); let i = index">
                  <td>{{ superficie.nombre }}</td>
                  <td>{{ superficie.area_m2 }}</td>
                  <td>
                    <button class="btn btn-sm btn-danger" (click)="removeSuperficie(i)">
                      Eliminar
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .card {
      margin-bottom: 20px;
    }
    .form-group {
      margin-bottom: 15px;
    }
  `]
})
export class RoomsFormComponent {
  roomsForm: FormGroup;
  superficies = signal<Superficie[]>([]);

  constructor(private fb: FormBuilder) {
    this.roomsForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(1)]],
      area_m2: ['', [Validators.required, Validators.min(0.1)]]
    });
  }

  onSubmit() {
    if (this.roomsForm.valid) {
      const nuevaSuperficie: Superficie = {
        nombre: this.roomsForm.value.nombre,
        area_m2: this.roomsForm.value.area_m2
      };
      
      this.superficies.update(superficies => [...superficies, nuevaSuperficie]);
      this.roomsForm.reset();
    }
  }

  removeSuperficie(index: number) {
    this.superficies.update(superficies => 
      superficies.filter((_, i) => i !== index)
    );
  }

  getSuperficies(): Superficie[] {
    return this.superficies();
  }
}
