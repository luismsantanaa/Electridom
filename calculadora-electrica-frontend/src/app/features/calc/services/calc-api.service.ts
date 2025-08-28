import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, throwError, tap, switchMap, map } from 'rxjs';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

// Interfaces para los datos
export interface Environment {
  nombre: string;
  area_m2: number;
}

export interface Consumption {
  nombre: string;
  ambiente: string;
  potencia_w: number;
  fp?: number;
  tipo?: 'iluminacion' | 'toma_general' | 'electrodomestico' | 'climatizacion' | 'especial';
}

export interface SystemConfig {
  voltage?: number;
  phases?: 1 | 3;
  frequency?: number;
}

export interface CalculationInput {
  system?: SystemConfig;
  superficies: Environment[];
  consumos: Consumption[];
  [key: string]: unknown;
}

export interface CalculationResult {
  ambientes: Array<{
    nombre: string;
    area_m2: number;
    carga_va: number;
    fp: number;
    observaciones?: string;
  }>;
  totales: {
    carga_total_va: number;
    carga_diversificada_va: number;
    corriente_total_a: number;
    tension_v: number;
    phases: number;
  };
  [key: string]: unknown;
}

// Interfaces para los resultados de cada endpoint
export interface DemandResult {
  ambientes: Array<{
    nombre: string;
    factor_demanda: number;
    carga_diversificada_va: number;
    observaciones?: string;
  }>;
  totales: {
    carga_total_va: number;
    carga_diversificada_va: number;
    factor_demanda_promedio: number;
  };
}

export interface CircuitsResult {
  circuitos: Array<{
    nombre: string;
    ambiente: string;
    carga_va: number;
    corriente_a: number;
    conductor: string;
    proteccion: string;
    observaciones?: string;
  }>;
  totales: {
    total_circuitos: number;
    carga_total_va: number;
    corriente_total_a: number;
  };
}

export interface FeederResult {
  alimentador: {
    carga_total_va: number;
    corriente_total_a: number;
    conductor: string;
    proteccion: string;
    caida_tension: number;
    observaciones?: string;
  };
  totales: {
    potencia_instalada_kw: number;
    potencia_diversificada_kw: number;
    factor_demanda: number;
  };
}

export interface GroundingResult {
  puesta_tierra: {
    resistencia_maxima: number;
    conductor: string;
    electrodo: string;
    longitud: number;
    observaciones?: string;
  };
  totales: {
    corriente_falla: number;
    tension_tierra: number;
  };
}

export interface FullCalculationResult {
  roomsResult: CalculationResult;
  demandResult: DemandResult;
  circuitsResult: CircuitsResult;
  feederResult: FeederResult;
  groundingResult: GroundingResult;
  [key: string]: unknown;
}

@Injectable({ providedIn: 'root' })
export class CalcApiService {
  private http = inject(HttpClient);
  private ajv = new Ajv({ allErrors: true });
  
  // Signals para estado global
  loading = signal(false);
  lastError = signal<string | null>(null);
  lastResult = signal<CalculationResult | null>(null);
  
  // Signals para resultados de cada endpoint
  lastDemandResult = signal<DemandResult | null>(null);
  lastCircuitsResult = signal<CircuitsResult | null>(null);
  lastFeederResult = signal<FeederResult | null>(null);
  lastGroundingResult = signal<GroundingResult | null>(null);
  lastFullResult = signal<FullCalculationResult | null>(null);

  baseUrl = '/api';

  constructor() {
    addFormats(this.ajv);
  }

  // Validación con schema
  private validateInput(data: unknown): boolean {
    const inputSchema = {
      type: 'object',
      required: ['superficies', 'consumos'],
      properties: {
        system: {
          type: 'object',
          properties: {
            voltage: { type: 'number', default: 120 },
            phases: { type: 'integer', enum: [1, 3], default: 1 },
            frequency: { type: 'number', default: 60 }
          }
        },
        superficies: {
          type: 'array',
          items: {
            type: 'object',
            required: ['nombre', 'area_m2'],
            properties: {
              nombre: { type: 'string', minLength: 1 },
              area_m2: { type: 'number', minimum: 0.1 }
            }
          }
        },
        consumos: {
          type: 'array',
          items: {
            type: 'object',
            required: ['nombre', 'ambiente', 'potencia_w'],
            properties: {
              nombre: { type: 'string' },
              ambiente: { type: 'string' },
              potencia_w: { type: 'number', minimum: 1 },
              fp: { type: 'number', minimum: 0.1, maximum: 1.0 },
              tipo: {
                type: 'string',
                enum: ['iluminacion', 'toma_general', 'electrodomestico', 'climatizacion', 'especial'],
                default: 'electrodomestico'
              }
            }
          }
        }
      }
    };

    const validate = this.ajv.compile(inputSchema);
    const isValid = validate(data);
    
    if (!isValid) {
      console.error('Validation errors:', validate.errors);
      throw new Error(`Datos inválidos: ${validate.errors?.map(e => e.message).join(', ')}`);
    }
    
    return true;
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Error desconocido';
    
    if (error.error instanceof ErrorEvent) {
      // Error del cliente
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Error del servidor
      errorMessage = `Error ${error.status}: ${error.error?.message || error.message}`;
    }
    
    this.lastError.set(errorMessage);
    return throwError(() => new Error(errorMessage));
  }

  private setLoading(loading: boolean): void {
    this.loading.set(loading);
    if (loading) {
      this.lastError.set(null);
    }
  }

  // Método principal para preview de rooms
  previewRooms(payload: CalculationInput): Observable<CalculationResult> {
    try {
      this.validateInput(payload);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error de validación desconocido';
      this.lastError.set(errorMessage);
      return throwError(() => error);
    }

    this.setLoading(true);
    
    return this.http.post<CalculationResult>(`${this.baseUrl}/calc/rooms/preview`, payload).pipe(
      tap(result => {
        this.lastResult.set(result);
        this.setLoading(false);
      }),
      catchError(error => {
        this.setLoading(false);
        return this.handleError(error);
      })
    );
  }

  // Métodos para el flujo completo de cálculo (CE-01 → CE-05)
  previewDemand(payload: CalculationInput): Observable<DemandResult> {
    try {
      this.validateInput(payload);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error de validación desconocido';
      this.lastError.set(errorMessage);
      return throwError(() => error);
    }

    this.setLoading(true);
    
    return this.http.post<DemandResult>(`${this.baseUrl}/calc/demand/preview`, payload).pipe(
      tap(result => {
        this.lastDemandResult.set(result);
        this.setLoading(false);
      }),
      catchError(error => {
        this.setLoading(false);
        return this.handleError(error);
      })
    );
  }

  previewCircuits(payload: CalculationInput): Observable<CircuitsResult> {
    try {
      this.validateInput(payload);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error de validación desconocido';
      this.lastError.set(errorMessage);
      return throwError(() => error);
    }

    this.setLoading(true);
    
    return this.http.post<CircuitsResult>(`${this.baseUrl}/calc/circuits/preview`, payload).pipe(
      tap(result => {
        this.lastCircuitsResult.set(result);
        this.setLoading(false);
      }),
      catchError(error => {
        this.setLoading(false);
        return this.handleError(error);
      })
    );
  }

  previewFeeder(payload: CalculationInput): Observable<FeederResult> {
    try {
      this.validateInput(payload);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error de validación desconocido';
      this.lastError.set(errorMessage);
      return throwError(() => error);
    }

    this.setLoading(true);
    
    return this.http.post<FeederResult>(`${this.baseUrl}/calc/feeder/preview`, payload).pipe(
      tap(result => {
        this.lastFeederResult.set(result);
        this.setLoading(false);
      }),
      catchError(error => {
        this.setLoading(false);
        return this.handleError(error);
      })
    );
  }

  previewGrounding(payload: CalculationInput): Observable<GroundingResult> {
    try {
      this.validateInput(payload);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error de validación desconocido';
      this.lastError.set(errorMessage);
      return throwError(() => error);
    }

    this.setLoading(true);
    
    return this.http.post<GroundingResult>(`${this.baseUrl}/calc/grounding/preview`, payload).pipe(
      tap(result => {
        this.lastGroundingResult.set(result);
        this.setLoading(false);
      }),
      catchError(error => {
        this.setLoading(false);
        return this.handleError(error);
      })
    );
  }

  // Método para ejecutar el flujo completo de cálculo
  executeFullCalculation(payload: CalculationInput): Observable<FullCalculationResult> {
    this.setLoading(true);
    this.clearAllResults();
    
    return this.previewRooms(payload).pipe(
      switchMap(roomsResult => 
        this.previewDemand(payload).pipe(
          map(demandResult => ({ roomsResult, demandResult }))
        )
      ),
      switchMap(({ roomsResult, demandResult }) => 
        this.previewCircuits(payload).pipe(
          map(circuitsResult => ({ roomsResult, demandResult, circuitsResult }))
        )
      ),
      switchMap(({ roomsResult, demandResult, circuitsResult }) => 
        this.previewFeeder(payload).pipe(
          map(feederResult => ({ roomsResult, demandResult, circuitsResult, feederResult }))
        )
      ),
      switchMap(({ roomsResult, demandResult, circuitsResult, feederResult }) => 
        this.previewGrounding(payload).pipe(
          map(groundingResult => ({
            roomsResult,
            demandResult,
            circuitsResult,
            feederResult,
            groundingResult
          }))
        )
      ),
      tap(fullResult => {
        this.lastFullResult.set(fullResult);
        this.setLoading(false);
      }),
      catchError(error => {
        this.setLoading(false);
        return this.handleError(error);
      })
    );
  }

  getReport(payload: CalculationInput, type: 'pdf' | 'xlsx'): Observable<Blob> {
    try {
      this.validateInput(payload);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error de validación desconocido';
      this.lastError.set(errorMessage);
      return throwError(() => error);
    }

    this.setLoading(true);
    
    return this.http.post(`${this.baseUrl}/calc/report?type=${type}`, payload, { 
      responseType: 'blob' 
    }).pipe(
      tap(() => {
        this.setLoading(false);
        console.log(`Reporte ${type.toUpperCase()} generado exitosamente`);
      }),
      catchError(error => {
        this.setLoading(false);
        return this.handleError(error);
      })
    );
  }

  // Método para descargar el archivo
  downloadReport(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  // Método para generar nombre de archivo
  generateReportFilename(type: 'pdf' | 'xlsx', calculationType: 'basic' | 'full' = 'basic'): string {
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const typeLabel = calculationType === 'full' ? 'completo' : 'basico';
    return `calculadora_electrica_${typeLabel}_${timestamp}.${type}`;
  }

  // Métodos de utilidad
  clearError(): void {
    this.lastError.set(null);
  }

  clearResult(): void {
    this.lastResult.set(null);
  }

  clearAllResults(): void {
    this.lastResult.set(null);
    this.lastDemandResult.set(null);
    this.lastCircuitsResult.set(null);
    this.lastFeederResult.set(null);
    this.lastGroundingResult.set(null);
    this.lastFullResult.set(null);
  }
}
