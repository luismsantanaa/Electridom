import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface IASuperficie {
  nombre: string;
  area_m2: number;
}

export interface IAConsumo {
  equipo: string;
  ambiente: string;
  w: number;
}

export interface IACalculationRequest {
  projectId: number;
  inputs: {
    superficies: IASuperficie[];
    consumos: IAConsumo[];
  };
}

export interface IACircuit {
  id?: number;
  area: string;
  loadVA: number;
  conductorGauge: string;
  areaType: string;
  phase: number;
  voltage: number;
  currentA: number;
}

export interface IAProtection {
  circuitId: number;
  breakerAmp: number;
  differential: string;
  breakerType: string;
}

export interface IACalculationResponse {
  projectId: number;
  circuits: IACircuit[];
  protections: IAProtection[];
  explanations: string[];
  metadata: {
    model: string;
    timestamp: string;
    processingTime: number;
  };
}

export interface IAConfig {
  endpoint: string;
  apiKey: string;
  model: string;
  parameters: {
    temperature: number;
    top_p: number;
    max_tokens: number;
  };
  timeouts_ms: {
    request: number;
  };
  retry: {
    maxAttempts: number;
    backoffMs: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class IACalculationsService {
  private apiUrl = `${environment.apiUrl}/ia`;
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private errorSubject = new BehaviorSubject<string | null>(null);
  private lastResultSubject = new BehaviorSubject<IACalculationResponse | null>(null);

  public loading$ = this.loadingSubject.asObservable();
  public error$ = this.errorSubject.asObservable();
  public lastResult$ = this.lastResultSubject.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * Calcula circuitos y protecciones usando IA
   */
  calculateWithIA(request: IACalculationRequest): Observable<IACalculationResponse> {
    this.setLoading(true);
    this.clearError();

    return new Observable(observer => {
      this.http.post<IACalculationResponse>(`${this.apiUrl}/calculate`, request)
        .subscribe({
          next: (response) => {
            this.lastResultSubject.next(response);
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
   * Obtiene el último resultado de IA para un proyecto
   */
  getLastIAResult(projectId: number): Observable<IACalculationResponse | null> {
    this.setLoading(true);
    this.clearError();

    return new Observable(observer => {
      this.http.get<IACalculationResponse | null>(`${this.apiUrl}/result/${projectId}`)
        .subscribe({
          next: (response) => {
            if (response) {
              this.lastResultSubject.next(response);
            }
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
   * Obtiene la configuración de IA
   */
  getIAConfig(): Observable<IAConfig> {
    return this.http.get<IAConfig>(`${this.apiUrl}/config`);
  }

  /**
   * Limpia el último resultado
   */
  clearLastResult(): void {
    this.lastResultSubject.next(null);
  }

  /**
   * Obtiene el último resultado almacenado
   */
  getLastResult(): IACalculationResponse | null {
    return this.lastResultSubject.value;
  }

  /**
   * Calcula la carga total en VA para un conjunto de consumos
   */
  calculateTotalLoad(consumos: IAConsumo[]): number {
    return consumos.reduce((total, consumo) => total + consumo.w, 0);
  }

  /**
   * Agrupa consumos por ambiente
   */
  groupConsumosByAmbiente(consumos: IAConsumo[]): { [ambiente: string]: IAConsumo[] } {
    return consumos.reduce((groups, consumo) => {
      if (!groups[consumo.ambiente]) {
        groups[consumo.ambiente] = [];
      }
      groups[consumo.ambiente].push(consumo);
      return groups;
    }, {} as { [ambiente: string]: IAConsumo[] });
  }

  /**
   * Calcula la carga por ambiente
   */
  calculateLoadByAmbiente(consumos: IAConsumo[]): { [ambiente: string]: number } {
    const grouped = this.groupConsumosByAmbiente(consumos);
    const result: { [ambiente: string]: number } = {};

    for (const [ambiente, consumosAmbiente] of Object.entries(grouped)) {
      result[ambiente] = consumosAmbiente.reduce((total, consumo) => total + consumo.w, 0);
    }

    return result;
  }

  /**
   * Valida que las superficies y consumos coincidan
   */
  validateInputs(superficies: IASuperficie[], consumos: IAConsumo[]): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!superficies || superficies.length === 0) {
      errors.push('Se requieren superficies para el cálculo');
    }

    if (!consumos || consumos.length === 0) {
      errors.push('Se requieren consumos para el cálculo');
    }

    if (superficies && consumos) {
      const superficiesAreas = new Set(superficies.map(s => s.nombre.toLowerCase()));
      const consumosAmbientes = new Set(consumos.map(c => c.ambiente.toLowerCase()));

      const areasNoCoinciden = Array.from(consumosAmbientes).filter(ambiente => !superficiesAreas.has(ambiente));
      if (areasNoCoinciden.length > 0) {
        errors.push(`Los ambientes de consumos no coinciden con las superficies: ${areasNoCoinciden.join(', ')}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
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
    return 'Error desconocido en el cálculo con IA';
  }
}
