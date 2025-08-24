import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface CalcRoomsRequest {
  system: {
    voltage: number;
    phases: number;
    frequency?: number;
  };
  superficies: Array<{
    nombre: string;
    area_m2: number;
  }>;
  consumos: Array<{
    nombre: string;
    ambiente: string;
    potencia_w: number;
    fp?: number;
    tipo?: string;
  }>;
}

export interface CalcRoomsResponse {
  ambientes: Array<{
    nombre: string;
    area_m2: number;
    carga_va: number;
    fp: number;
    observaciones: string;
  }>;
  totales: {
    carga_total_va: number;
    carga_diversificada_va: number;
    corriente_total_a: number;
    tension_v: number;
    phases: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class CalcApiService {
  private readonly apiBase = '/api';

  constructor(private http: HttpClient) {}

  // Cálculo de cargas por ambiente
  calcRoomsPreview(data: CalcRoomsRequest): Observable<CalcRoomsResponse> {
    return this.http.post<CalcRoomsResponse>(`${this.apiBase}/calc/rooms/preview`, data);
  }

  // Factores de demanda
  calcDemandPreview(data: any): Observable<any> {
    return this.http.post(`${this.apiBase}/calc/demand/preview`, data);
  }

  // Circuitos ramales
  calcCircuitsPreview(data: any): Observable<any> {
    return this.http.post(`${this.apiBase}/calc/circuits/preview`, data);
  }

  // Análisis de caída de tensión
  calcFeederPreview(data: any): Observable<any> {
    return this.http.post(`${this.apiBase}/calc/feeder/preview`, data);
  }

  // Puesta a tierra
  calcGroundingPreview(data: any): Observable<any> {
    return this.http.post(`${this.apiBase}/calc/grounding/preview`, data);
  }

  // Generación de reportes
  generateReport(data: any, type: 'pdf' | 'xlsx'): Observable<Blob> {
    return this.http.post(`${this.apiBase}/calc/report?type=${type}`, data, {
      responseType: 'blob'
    });
  }
}
