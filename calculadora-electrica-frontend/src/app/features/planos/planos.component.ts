import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SafePipe } from '../../core/pipes/safe.pipe';

@Component({
  selector: 'app-planos',
  standalone: true,
  imports: [CommonModule, FormsModule, SafePipe],
  template: `
    <div class="planos-container">
      <!-- Header -->
      <div class="page-header">
        <h2>
          <i class="fas fa-drafting-compass me-2"></i>
          Carga de Planos
        </h2>
        <p class="text-muted">Carga y visualización de planos de planta para proyectos eléctricos</p>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading()" class="loading-container">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Cargando...</span>
        </div>
        <p class="mt-3">Procesando plano...</p>
      </div>

      <!-- Error State -->
      <div *ngIf="error()" class="error-container">
        <div class="alert alert-danger">
          <i class="fas fa-exclamation-triangle me-2"></i>
          {{ error() }}
        </div>
      </div>

      <!-- Main Content -->
      <div *ngIf="!loading() && !error()" class="planos-content">
        <!-- Upload Section -->
        <div class="upload-section">
          <div class="card">
            <div class="card-header">
              <h5>
                <i class="fas fa-upload me-2"></i>
                Cargar Plano
              </h5>
            </div>
            <div class="card-body">
              <div
                class="upload-area"
                (dragover)="onDragOver($event)"
                (dragleave)="onDragLeave($event)"
                (drop)="onDrop($event)"
                [class.drag-over]="isDragOver()"
              >
                <div class="upload-content">
                  <i class="fas fa-cloud-upload-alt fa-3x text-primary mb-3"></i>
                  <h5>Arrastra y suelta tu plano aquí</h5>
                  <p class="text-muted">o</p>
                  <input type="file" #fileInput (change)="onFileSelected($event)" accept=".pdf,.jpg,.jpeg,.png,.dwg" class="d-none" />
                  <button class="btn btn-primary" (click)="fileInput.click()">
                    <i class="fas fa-folder-open me-2"></i>
                    Seleccionar Archivo
                  </button>
                  <div class="mt-3">
                    <small class="text-muted">Formatos soportados: PDF, JPG, PNG, DWG (máx. 10MB)</small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Plano Preview -->
        <div *ngIf="planoCargado()" class="plano-preview">
          <div class="card">
            <div class="card-header d-flex justify-content-between align-items-center">
              <h5>
                <i class="fas fa-eye me-2"></i>
                Vista Previa del Plano
              </h5>
              <div class="btn-group">
                <button class="btn btn-sm btn-outline-primary" (click)="zoomIn()">
                  <i class="fas fa-search-plus"></i>
                </button>
                <button class="btn btn-sm btn-outline-primary" (click)="zoomOut()">
                  <i class="fas fa-search-minus"></i>
                </button>
                <button class="btn btn-sm btn-outline-secondary" (click)="resetZoom()">
                  <i class="fas fa-expand"></i>
                </button>
              </div>
            </div>
            <div class="card-body">
              <div class="plano-container" #planoContainer>
                <img
                  *ngIf="planoCargado()?.tipo === 'imagen'"
                  [src]="planoCargado()?.url"
                  [alt]="planoCargado()?.nombre"
                  [style.transform]="'scale(' + zoomLevel() + ')'"
                  class="plano-image"
                />
                <iframe *ngIf="planoCargado()?.tipo === 'pdf'" [src]="planoCargado()?.url | safe" class="plano-pdf"></iframe>
              </div>
            </div>
          </div>
        </div>

        <!-- Plano Info -->
        <div *ngIf="planoCargado()" class="plano-info">
          <div class="card">
            <div class="card-header">
              <h5>
                <i class="fas fa-info-circle me-2"></i>
                Información del Plano
              </h5>
            </div>
            <div class="card-body">
              <div class="row">
                <div class="col-md-6">
                  <p>
                    <strong>Nombre:</strong>
                    {{ planoCargado()?.nombre }}
                  </p>
                  <p>
                    <strong>Tipo:</strong>
                    {{ planoCargado()?.tipo.toUpperCase() }}
                  </p>
                  <p>
                    <strong>Tamaño:</strong>
                    {{ planoCargado()?.tamano }}
                  </p>
                </div>
                <div class="col-md-6">
                  <p>
                    <strong>Fecha de carga:</strong>
                    {{ planoCargado()?.fechaCarga | date: 'medium' }}
                  </p>
                  <p>
                    <strong>Zoom:</strong>
                    {{ (zoomLevel() * 100).toFixed(0) }}%
                  </p>
                  <p>
                    <strong>Estado:</strong>
                    <span class="badge bg-success">Cargado</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Annotations Section -->
        <div *ngIf="planoCargado()" class="annotations-section">
          <div class="card">
            <div class="card-header">
              <h5>
                <i class="fas fa-map-marker-alt me-2"></i>
                Anotaciones del Plano
              </h5>
            </div>
            <div class="card-body">
              <div class="annotations-tools mb-3">
                <button class="btn btn-sm btn-outline-primary me-2" (click)="addAnnotation('panel')">
                  <i class="fas fa-bolt me-1"></i>
                  Panel
                </button>
                <button class="btn btn-sm btn-outline-success me-2" (click)="addAnnotation('outlet')">
                  <i class="fas fa-plug me-1"></i>
                  Toma
                </button>
                <button class="btn btn-sm btn-outline-warning me-2" (click)="addAnnotation('light')">
                  <i class="fas fa-lightbulb me-1"></i>
                  Luminaria
                </button>
                <button class="btn btn-sm btn-outline-info me-2" (click)="addAnnotation('switch')">
                  <i class="fas fa-toggle-on me-1"></i>
                  Interruptor
                </button>
                <button class="btn btn-sm btn-outline-danger" (click)="clearAnnotations()">
                  <i class="fas fa-trash me-1"></i>
                  Limpiar
                </button>
              </div>

              <div class="annotations-list">
                <div *ngFor="let annotation of annotations(); trackBy: trackByAnnotation" class="annotation-item">
                  <div class="annotation-icon">
                    <i [class]="getAnnotationIcon(annotation.tipo)"></i>
                  </div>
                  <div class="annotation-content">
                    <strong>{{ annotation.tipo | titlecase }}</strong>
                    <small class="text-muted d-block">{{ annotation.descripcion }}</small>
                  </div>
                  <div class="annotation-actions">
                    <button class="btn btn-sm btn-outline-secondary" (click)="editAnnotation(annotation)">
                      <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" (click)="removeAnnotation(annotation.id)">
                      <i class="fas fa-trash"></i>
                    </button>
                  </div>
                </div>

                <div *ngIf="annotations().length === 0" class="text-center text-muted py-4">
                  <i class="fas fa-map-marker-alt fa-2x mb-2"></i>
                  <p>No hay anotaciones en el plano</p>
                  <small>Usa las herramientas arriba para agregar elementos eléctricos</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./planos.component.css']
})
export class PlanosComponent implements OnInit {
  loading = signal<boolean>(false);
  error = signal<string | null>(null);
  isDragOver = signal<boolean>(false);
  zoomLevel = signal<number>(1);

  planoCargado = signal<{
    nombre: string;
    tipo: 'imagen' | 'pdf';
    url: string;
    tamano: string;
    fechaCarga: Date;
  } | null>(null);

  annotations = signal<
    Array<{
      id: string;
      tipo: 'panel' | 'outlet' | 'light' | 'switch';
      descripcion: string;
      x: number;
      y: number;
    }>
  >([]);

  constructor() {}

  ngOnInit(): void {}

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver.set(false);

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.processFile(files[0]);
    }
  }

  onFileSelected(event: Event): void {
    const target = event.target as HTMLInputElement;
    const files = target.files;
    if (files && files.length > 0) {
      this.processFile(files[0]);
    }
  }

  private processFile(file: File): void {
    this.loading.set(true);
    this.error.set(null);

    // Validar tipo de archivo
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      this.error.set('Tipo de archivo no soportado. Use PDF, JPG o PNG.');
      this.loading.set(false);
      return;
    }

    // Validar tamaño (10MB)
    if (file.size > 10 * 1024 * 1024) {
      this.error.set('El archivo es demasiado grande. Máximo 10MB.');
      this.loading.set(false);
      return;
    }

    // Simular procesamiento
    setTimeout(() => {
      const url = URL.createObjectURL(file);
      const tipo = file.type === 'application/pdf' ? 'pdf' : 'imagen';

      this.planoCargado.set({
        nombre: file.name,
        tipo: tipo,
        url: url,
        tamano: this.formatFileSize(file.size),
        fechaCarga: new Date()
      });

      this.loading.set(false);
    }, 1000);
  }

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  zoomIn(): void {
    this.zoomLevel.update((level) => Math.min(level + 0.2, 3));
  }

  zoomOut(): void {
    this.zoomLevel.update((level) => Math.max(level - 0.2, 0.2));
  }

  resetZoom(): void {
    this.zoomLevel.set(1);
  }

  addAnnotation(tipo: 'panel' | 'outlet' | 'light' | 'switch'): void {
    const descripcion = prompt(`Descripción para ${tipo}:`);
    if (descripcion) {
      this.annotations.update((anns) => [
        ...anns,
        {
          id: Date.now().toString(),
          tipo,
          descripcion,
          x: Math.random() * 100,
          y: Math.random() * 100
        }
      ]);
    }
  }

  editAnnotation(annotation: any): void {
    const descripcion = prompt('Nueva descripción:', annotation.descripcion);
    if (descripcion) {
      this.annotations.update((anns) => anns.map((ann) => (ann.id === annotation.id ? { ...ann, descripcion } : ann)));
    }
  }

  removeAnnotation(id: string): void {
    this.annotations.update((anns) => anns.filter((ann) => ann.id !== id));
  }

  clearAnnotations(): void {
    if (confirm('¿Estás seguro de que quieres limpiar todas las anotaciones?')) {
      this.annotations.set([]);
    }
  }

  getAnnotationIcon(tipo: string): string {
    const icons = {
      panel: 'fas fa-bolt',
      outlet: 'fas fa-plug',
      light: 'fas fa-lightbulb',
      switch: 'fas fa-toggle-on'
    };
    return icons[tipo as keyof typeof icons] || 'fas fa-map-marker-alt';
  }

  trackByAnnotation(index: number, annotation: any): string {
    return annotation.id;
  }
}
