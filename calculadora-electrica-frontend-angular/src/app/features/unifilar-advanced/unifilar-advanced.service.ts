import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface UnifilarPanel {
  id: number;
  name: string;
  type: string;
  amperage: number;
  voltage: string;
  phases: number;
  phaseMap: { [phase: string]: number[] };
  circuits: UnifilarAdvancedCircuit[];
  symbols: string[];
  position: { x: number; y: number };
}

export interface UnifilarAdvancedCircuit {
  id: number;
  phase: string;
  breakerAmp: number;
  breakerType: string;
  differential: string;
  loadVA: number;
  conductorGauge: string;
  areaType: string;
  symbolRefs: string[];
  position: { x: number; y: number };
  connections: string[];
}

export interface PhaseBalance {
  totalLoad: { [phase: string]: number };
  maxImbalance: number;
  isBalanced: boolean;
  recommendations: string[];
}

export interface RenderConfig {
  symbols: 'IEC' | 'UNE' | 'NEMA';
  orientation: 'vertical' | 'horizontal';
  pageSize: 'A3' | 'A4' | 'Letter';
  margins: number;
  showGrid: boolean;
  showLabels: boolean;
}

export interface UnifilarAdvancedExport {
  projectId: number;
  projectName?: string;
  service: {
    voltage: string;
    phases: string;
    amperage: number;
    type: string;
  };
  panels: UnifilarPanel[];
  phaseBalance: PhaseBalance;
  render: RenderConfig;
  metadata: {
    version: string;
    generatedAt: string;
    totalCircuits: number;
    totalLoadVA: number;
  };
  symbols: {
    [key: string]: {
      name: string;
      description: string;
      category: string;
      iecCode?: string;
      uneCode?: string;
    };
  };
}

export interface ExportOptions {
  format: 'pdf' | 'json';
  includeMetadata?: boolean;
  includeSymbols?: boolean;
  pageSize?: 'A3' | 'A4' | 'Letter';
  orientation?: 'vertical' | 'horizontal';
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

@Injectable({
  providedIn: 'root'
})
export class UnifilarAdvancedService {
  private apiUrl = `${environment.apiUrl}/export/unifilar/advanced`;
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private errorSubject = new BehaviorSubject<string | null>(null);
  private lastExportSubject = new BehaviorSubject<UnifilarAdvancedExport | null>(null);

  public loading$ = this.loadingSubject.asObservable();
  public error$ = this.errorSubject.asObservable();
  public lastExport$ = this.lastExportSubject.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * Exporta el diagrama unifilar avanzado
   */
  exportAdvancedUnifilar(
    projectId: number,
    options: ExportOptions = { format: 'json' }
  ): Observable<UnifilarAdvancedExport | Blob> {
    this.setLoading(true);
    this.clearError();

    const params = new HttpParams()
      .set('format', options.format)
      .set('includeMetadata', options.includeMetadata?.toString() || 'true')
      .set('includeSymbols', options.includeSymbols?.toString() || 'true')
      .set('pageSize', options.pageSize || 'A3')
      .set('orientation', options.orientation || 'vertical');

    const endpoint = `${this.apiUrl}/${projectId}`;

    if (options.format === 'pdf') {
      // Para PDF, retornar como Blob
      return new Observable(observer => {
        this.http.get(endpoint, { params, responseType: 'blob' })
          .subscribe({
            next: (response: Blob) => {
              this.setLoading(false);
              observer.next(response);
              observer.complete();
            },
            error: (error) => {
              const errorMessage = this.getErrorMessage(error);
              this.setError(errorMessage);
              this.setLoading(false);
              observer.error(error);
            }
          });
      });
    } else {
      // Para JSON, retornar como objeto
      return new Observable(observer => {
        this.http.get<UnifilarAdvancedExport>(endpoint, { params })
          .subscribe({
            next: (response: UnifilarAdvancedExport) => {
              this.lastExportSubject.next(response);
              this.setLoading(false);
              observer.next(response);
              observer.complete();
            },
            error: (error) => {
              const errorMessage = this.getErrorMessage(error);
              this.setError(errorMessage);
              this.setLoading(false);
              observer.error(error);
            }
          });
      });
    }
  }

  /**
   * Valida el diagrama unifilar avanzado
   */
  validateAdvancedUnifilar(projectId: number): Observable<ValidationResult> {
    this.setLoading(true);
    this.clearError();

    return new Observable(observer => {
      this.http.get<ValidationResult>(`${this.apiUrl}/${projectId}/validate`)
        .subscribe({
          next: (response) => {
            this.setLoading(false);
            observer.next(response);
            observer.complete();
          },
          error: (error) => {
            const errorMessage = this.getErrorMessage(error);
            this.setError(errorMessage);
            this.setLoading(false);
            observer.error(error);
          }
        });
    });
  }

  /**
   * Obtiene el balance de fases
   */
  getPhaseBalance(projectId: number): Observable<PhaseBalance> {
    this.setLoading(true);
    this.clearError();

    return new Observable(observer => {
      this.http.get<PhaseBalance>(`${this.apiUrl}/${projectId}/phase-balance`)
        .subscribe({
          next: (response) => {
            this.setLoading(false);
            observer.next(response);
            observer.complete();
          },
          error: (error) => {
            const errorMessage = this.getErrorMessage(error);
            this.setError(errorMessage);
            this.setLoading(false);
            observer.error(error);
          }
        });
    });
  }

  /**
   * Descarga un archivo
   */
  downloadFile(data: Blob, filename: string): void {
    const url = window.URL.createObjectURL(data);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  /**
   * Descarga el JSON como archivo
   */
  downloadJSON(data: UnifilarAdvancedExport, projectId: number): void {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    this.downloadFile(blob, `unifilar-avanzado-proyecto-${projectId}.json`);
  }

  /**
   * Descarga el PDF como archivo
   */
  downloadPDF(data: Blob, projectId: number): void {
    this.downloadFile(data, `unifilar-avanzado-proyecto-${projectId}.pdf`);
  }

  /**
   * Calcula estadísticas del balance de fases
   */
  calculatePhaseBalanceStats(phaseBalance: PhaseBalance): {
    totalLoad: number;
    averageLoad: number;
    maxLoad: number;
    minLoad: number;
    imbalancePercentage: number;
    status: 'balanced' | 'warning' | 'critical';
  } {
    const loads = Object.values(phaseBalance.totalLoad);
    const totalLoad = loads.reduce((sum, load) => sum + load, 0);
    const averageLoad = totalLoad / loads.length;
    const maxLoad = Math.max(...loads);
    const minLoad = Math.min(...loads);
    const imbalancePercentage = ((maxLoad - minLoad) / maxLoad) * 100;

    let status: 'balanced' | 'warning' | 'critical' = 'balanced';
    if (imbalancePercentage > 20) {
      status = 'critical';
    } else if (imbalancePercentage > 10) {
      status = 'warning';
    }

    return {
      totalLoad,
      averageLoad,
      maxLoad,
      minLoad,
      imbalancePercentage,
      status
    };
  }

  /**
   * Obtiene el color del estado del balance
   */
  getPhaseBalanceColor(status: 'balanced' | 'warning' | 'critical'): string {
    switch (status) {
      case 'balanced':
        return 'success';
      case 'warning':
        return 'warning';
      case 'critical':
        return 'danger';
      default:
        return 'secondary';
    }
  }

  /**
   * Obtiene el último export realizado
   */
  getLastExport(): UnifilarAdvancedExport | null {
    return this.lastExportSubject.value;
  }

  /**
   * Limpia el último export
   */
  clearLastExport(): void {
    this.lastExportSubject.next(null);
  }

  /**
   * Obtiene el último export almacenado
   */
  getLastExportObservable(): Observable<UnifilarAdvancedExport | null> {
    return this.lastExport$;
  }

  private setLoading(loading: boolean): void {
    this.loadingSubject.next(loading);
  }

  private setError(error: string): void {
    this.errorSubject.next(error);
  }

  private clearError(): void {
    this.errorSubject.next(null);
  }

  private getErrorMessage(error: any): string {
    if (error.error && error.error.message) {
      return error.error.message;
    }
    if (error.message) {
      return error.message;
    }
    return 'Error desconocido en la exportación avanzada';
  }
}
