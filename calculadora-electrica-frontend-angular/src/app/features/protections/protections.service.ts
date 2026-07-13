import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Protection {
  id: number;
  circuitId: number;
  breakerAmp: number;
  breakerType: string;
  differentialType: string;
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CircuitProtection {
  id: number;
  loadVA: number;
  conductorGauge: string;
  areaType: string;
  phase: number;
  voltage: number;
  currentA: number;
  protection?: Protection;
}

export interface RecalculateProtectionsRequest {
  projectId: number;
}

@Injectable({
  providedIn: 'root'
})
export class ProtectionsService {
  private apiUrl = `${environment.apiUrl}/protections`;
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private errorSubject = new BehaviorSubject<string | null>(null);

  public loading$ = this.loadingSubject.asObservable();
  public error$ = this.errorSubject.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * Obtiene la protección de un circuito específico
   */
  getProtectionByCircuitId(circuitId: number): Observable<Protection> {
    return this.http.get<Protection>(`${this.apiUrl}/${circuitId}`);
  }

  /**
   * Obtiene todas las protecciones de un proyecto
   */
  getProtectionsByProjectId(projectId: number): Observable<CircuitProtection[]> {
    this.setLoading(true);
    this.clearError();

    return new Observable((observer) => {
      this.http.get<CircuitProtection[]>(`${this.apiUrl}/project/${projectId}`).subscribe({
        next: (data) => {
          this.setLoading(false);
          observer.next(data);
          observer.complete();
        },
        error: (error) => {
          this.setLoading(false);
          this.setError(this.getErrorMessage(error));
          observer.error(error);
        }
      });
    });
  }

  /**
   * Recalcula todas las protecciones de un proyecto
   */
  recalculateProtections(projectId: number): Observable<Protection[]> {
    this.setLoading(true);
    this.clearError();

    const request: RecalculateProtectionsRequest = { projectId };

    return new Observable((observer) => {
      this.http.post<Protection[]>(`${this.apiUrl}/recalculate`, request).subscribe({
        next: (data) => {
          this.setLoading(false);
          observer.next(data);
          observer.complete();
        },
        error: (error) => {
          this.setLoading(false);
          this.setError(this.getErrorMessage(error));
          observer.error(error);
        }
      });
    });
  }

  /**
   * Crea una nueva protección
   */
  createProtection(protection: Omit<Protection, 'id' | 'createdAt' | 'updatedAt'>): Observable<Protection> {
    this.setLoading(true);
    this.clearError();

    return new Observable((observer) => {
      this.http.post<Protection>(this.apiUrl, protection).subscribe({
        next: (data) => {
          this.setLoading(false);
          observer.next(data);
          observer.complete();
        },
        error: (error) => {
          this.setLoading(false);
          this.setError(this.getErrorMessage(error));
          observer.error(error);
        }
      });
    });
  }

  /**
   * Actualiza una protección existente
   */
  updateProtection(id: number, protection: Partial<Protection>): Observable<Protection> {
    this.setLoading(true);
    this.clearError();

    return new Observable((observer) => {
      this.http.post<Protection>(`${this.apiUrl}/${id}`, protection).subscribe({
        next: (data) => {
          this.setLoading(false);
          observer.next(data);
          observer.complete();
        },
        error: (error) => {
          this.setLoading(false);
          this.setError(this.getErrorMessage(error));
          observer.error(error);
        }
      });
    });
  }

  /**
   * Elimina una protección
   */
  deleteProtection(id: number): Observable<void> {
    this.setLoading(true);
    this.clearError();

    return new Observable((observer) => {
      this.http.delete<void>(`${this.apiUrl}/${id}`).subscribe({
        next: () => {
          this.setLoading(false);
          observer.next();
          observer.complete();
        },
        error: (error) => {
          this.setLoading(false);
          this.setError(this.getErrorMessage(error));
          observer.error(error);
        }
      });
    });
  }

  /**
   * Obtiene el tipo de diferencial requerido según el área
   */
  getDifferentialTypeForArea(areaType: string): string {
    const normalizedAreaType = areaType.toLowerCase().trim();

    if (['banio', 'cocina', 'lavanderia', 'exteriores'].includes(normalizedAreaType)) {
      return 'GFCI';
    }

    if (['dormitorio', 'estudio', 'sala'].includes(normalizedAreaType)) {
      return 'AFCI';
    }

    return 'NONE';
  }

  /**
   * Obtiene la ampacidad del conductor según el calibre
   */
  getConductorAmpacity(conductorGauge: string): number {
    const ampacityTable: { [key: string]: number } = {
      '1.5 mm2': 15,
      '2.0 mm2': 20,
      '3.5 mm2': 30,
      '5.5 mm2': 50,
      '8.0 mm2': 70
    };

    return ampacityTable[conductorGauge] || 20;
  }

  /**
   * Calcula la corriente del circuito
   */
  calculateCircuitCurrent(loadVA: number, voltage: number): number {
    return Math.ceil(loadVA / voltage);
  }

  /**
   * Selecciona el breaker apropiado
   */
  selectBreaker(currentA: number, ampacityA: number): number {
    const standardBreakers = [15, 20, 25, 30, 40, 50, 60];

    // Buscar el breaker estándar más cercano que sea >= corriente y <= ampacidad
    for (const breaker of standardBreakers) {
      if (breaker >= currentA && breaker <= ampacityA) {
        return breaker;
      }
    }

    // Si no hay breaker estándar apropiado, usar el más cercano permitido por ampacidad
    const validBreakers = standardBreakers.filter((b) => b <= ampacityA);
    if (validBreakers.length === 0) {
      return Math.min(ampacityA, 20);
    }

    // Retornar el breaker más cercano a la corriente
    return validBreakers.reduce((prev, curr) => (Math.abs(curr - currentA) < Math.abs(prev - currentA) ? curr : prev));
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
    if (error.error?.message) {
      return error.error.message;
    }
    if (error.message) {
      return error.message;
    }
    return 'Error desconocido al procesar la solicitud';
  }
}
