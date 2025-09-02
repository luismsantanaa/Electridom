import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

export interface UnifilarNode {
  id: string;
  type: string;
  label: string;
  position: { x: number; y: number };
  properties: Record<string, any>;
}

export interface UnifilarService {
  voltage: number;
  phases: number;
  amperage: number;
  type: string;
}

export interface UnifilarMainPanel {
  id: string;
  label: string;
  type: string;
  amperage: number;
  circuits: string[];
  position: { x: number; y: number };
}

export interface UnifilarCircuit {
  id: string;
  label: string;
  loadVA: number;
  voltage: number;
  currentA: number;
  conductorGauge: string;
  breakerAmp: number;
  differentialType: string;
  areaType: string;
  position: { x: number; y: number };
  connections: string[];
}

export interface UnifilarExport {
  projectId: number;
  projectName: string;
  service: UnifilarService;
  mainPanel: UnifilarMainPanel;
  circuits: UnifilarCircuit[];
  nodes: UnifilarNode[];
  metadata: {
    version: string;
    generatedAt: string;
    standards: string[];
  };
}

@Component({
  selector: 'app-unifilar-export',
  templateUrl: './unifilar-export.component.html',
  styleUrls: ['./unifilar-export.component.scss']
})
export class UnifilarExportComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  @Input() projectId: number | null = null;
  
  unifilarData: UnifilarExport | null = null;
  loading = false;
  error: string | null = null;
  exportFormat: 'full' | 'simplified' = 'full';
  
  constructor(private http: HttpClient) {}
  
  ngOnInit(): void {
    if (this.projectId) {
      this.loadUnifilarData();
    }
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  /**
   * Carga los datos del diagrama unifilar
   */
  loadUnifilarData(): void {
    if (!this.projectId) return;
    
    this.loading = true;
    this.error = null;
    
    const endpoint = this.exportFormat === 'simplified' 
      ? `${environment.apiUrl}/export/unifilar/${this.projectId}/simplified`
      : `${environment.apiUrl}/export/unifilar/${this.projectId}`;
    
    this.http.get<UnifilarExport>(endpoint)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.unifilarData = data;
          this.loading = false;
        },
        error: (err) => {
          this.error = this.getErrorMessage(err);
          this.loading = false;
        }
      });
  }
  
  /**
   * Cambia el formato de exportación
   */
  onFormatChange(): void {
    this.loadUnifilarData();
  }
  
  /**
   * Descarga el diagrama unifilar como JSON
   */
  downloadUnifilar(): void {
    if (!this.unifilarData) return;
    
    const dataStr = JSON.stringify(this.unifilarData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `unifilar_${this.unifilarData.projectName}_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    URL.revokeObjectURL(link.href);
  }
  
  /**
   * Valida el diagrama unifilar
   */
  validateUnifilar(): void {
    if (!this.projectId) return;
    
    this.loading = true;
    this.error = null;
    
    this.http.get<{ isValid: boolean; errors: string[] }>(`${environment.apiUrl}/export/unifilar/${this.projectId}/validate`)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          if (result.isValid) {
            alert('✅ El diagrama unifilar es válido');
          } else {
            alert(`❌ El diagrama unifilar tiene errores:\n${result.errors.join('\n')}`);
          }
          this.loading = false;
        },
        error: (err) => {
          this.error = this.getErrorMessage(err);
          this.loading = false;
        }
      });
  }
  
  /**
   * Obtiene el icono para el tipo de circuito
   */
  getCircuitIcon(circuit: UnifilarCircuit): string {
    if (circuit.differentialType === 'GFCI') return 'fas fa-shield-alt text-warning';
    if (circuit.differentialType === 'AFCI') return 'fas fa-bolt text-info';
    return 'fas fa-plug text-primary';
  }
  
  /**
   * Obtiene el color del badge para el tipo diferencial
   */
  getDifferentialBadgeClass(differentialType: string): string {
    switch (differentialType) {
      case 'GFCI': return 'bg-warning';
      case 'AFCI': return 'bg-info';
      case 'NONE': return 'bg-secondary';
      default: return 'bg-secondary';
    }
  }
  
  /**
   * Obtiene el texto para el tipo diferencial
   */
  getDifferentialText(differentialType: string): string {
    switch (differentialType) {
      case 'GFCI': return 'GFCI';
      case 'AFCI': return 'AFCI';
      case 'NONE': return 'Sin Diferencial';
      default: return differentialType;
    }
  }
  
  /**
   * Obtiene el color del badge para el área
   */
  getAreaBadgeClass(areaType: string): string {
    const areaColors: Record<string, string> = {
      'banio': 'bg-danger',
      'cocina': 'bg-warning',
      'dormitorio': 'bg-info',
      'sala': 'bg-success',
      'exteriores': 'bg-dark',
      'lavanderia': 'bg-primary'
    };
    return areaColors[areaType] || 'bg-secondary';
  }
  
  /**
   * Limpia el error
   */
  clearError(): void {
    this.error = null;
  }
  
  /**
   * Obtiene el mensaje de error
   */
  private getErrorMessage(error: any): string {
    if (error.error?.message) {
      return error.error.message;
    }
    if (error.message) {
      return error.message;
    }
    return 'Error desconocido al cargar el diagrama unifilar';
  }
}
