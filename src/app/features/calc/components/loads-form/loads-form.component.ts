import { Component, signal, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

export interface Consumo {
  nombre: string;
  ambiente: string;
  potencia_w: number;
  fp?: number;
  tipo?: string;
}

export interface Superficie {
  nombre: string;
  area_m2: number;
}

@Component({
  selector: 'app-loads-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="card">
      <div class="card-header">
        <h5>Consumos Eléctricos</h5>
      </div>
      <div class="card-body">
        <form [formGroup]="loadsForm" (ngSubmit)="onSubmit()">
          <div class="row">
            <div class="col-md-6">
              <div class="form-group">
                <label for="nombre">Nombre del Consumo</label>
                <input 
                  type="text" 
                  class="form-control" 
                  id="nombre"
                  formControlName="nombre"
                  placeholder="Ej: TV, Refrigerador, Aire Acondicionado">
              </div>
            </div>
            <div class="col-md-6">
              <div class="form-group">
                <label for="ambiente">Ambiente</label>
                <select class="form-control" id="ambiente" formControlName="ambiente">
                  <option value="">Seleccionar ambiente</option>
                  <option *ngFor="let superficie of superficies()" [value]="superficie.nombre">
                    {{ superficie.nombre }}
                  </option>
                </select>
              </div>
            </div>
          </div>
          <div class="row">
            <div class="col-md-4">
              <div class="form-group">
                <label for="potencia">Potencia (W)</label>
                <input 
                  type="number" 
                  class="form-control" 
                  id="potencia"
                  formControlName="potencia_w"
                  min="1"
                  placeholder="Ej: 100">
              </div>
            </div>
            <div class="col-md-4">
              <div class="form-group">
                <label for="fp">Factor de Potencia</label>
                <input 
                  type="number" 
                  class="form-control" 
                  id="fp"
                  formControlName="fp"
                  step="0.01"
                  min="0.1"
                  max="1.0"
                  placeholder="0.85">
              </div>
            </div>
            <div class="col-md-4">
              <div class="form-group">
                <label for="tipo">Tipo de Consumo</label>
                <select class="form-control" id="tipo" formControlName="tipo">
                  <option value="electrodomestico">Electrodoméstico</option>
                  <option value="iluminacion">Iluminación</option>
                  <option value="toma_general">Toma General</option>
                  <option value="climatizacion">Climatización</option>
                  <option value="especial">Especial</option>
                </select>
              </div>
            </div>
          </div>
          <div class="mt-3">
            <button type="submit" class="btn btn-primary" [disabled]="!loadsForm.valid">
              Agregar Consumo
            </button>
          </div>
        </form>

        <div class="mt-4">
          <h6>Consumos Registrados</h6>
          <div class="table-responsive">
            <table class="table table-striped">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Ambiente</th>
                  <th>Potencia (W)</th>
                  <th>FP</th>
                  <th>Tipo</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let consumo of consumos(); let i = index">
                  <td>{{ consumo.nombre }}</td>
                  <td>{{ consumo.ambiente }}</td>
                  <td>{{ consumo.potencia_w }}</td>
                  <td>{{ consumo.fp || 0.85 }}</td>
                  <td>{{ consumo.tipo || 'electrodomestico' }}</td>
                  <td>
                    <button class="btn btn-sm btn-danger" (click)="removeConsumo(i)">
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
export class LoadsFormComponent {
  loadsForm: FormGroup;
  consumos = signal<Consumo[]>([]);
  superficies = input.required<Superficie[]>();

  constructor(private fb: FormBuilder) {
    this.loadsForm = this.fb.group({
      nombre: ['', [Validators.required]],
      ambiente: ['', [Validators.required]],
      potencia_w: ['', [Validators.required, Validators.min(1)]],
      fp: [0.85, [Validators.min(0.1), Validators.max(1.0)]],
      tipo: ['electrodomestico']
    });
  }

  onSubmit() {
    if (this.loadsForm.valid) {
      const nuevoConsumo: Consumo = {
        nombre: this.loadsForm.value.nombre,
        ambiente: this.loadsForm.value.ambiente,
        potencia_w: this.loadsForm.value.potencia_w,
        fp: this.loadsForm.value.fp,
        tipo: this.loadsForm.value.tipo
      };
      
      this.consumos.update(consumos => [...consumos, nuevoConsumo]);
      this.loadsForm.reset({
        fp: 0.85,
        tipo: 'electrodomestico'
      });
    }
  }

  removeConsumo(index: number) {
    this.consumos.update(consumos => 
      consumos.filter((_, i) => i !== index)
    );
  }

  getConsumos(): Consumo[] {
    return this.consumos();
  }
}
