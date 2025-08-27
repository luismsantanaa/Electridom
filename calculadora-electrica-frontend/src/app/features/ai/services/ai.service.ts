import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { 
  AnalyzeRequest, 
  AnalyzeResponse, 
  IngestExcelResponse 
} from '../interfaces/ai.interface';

// Interfaces para manejo de errores
interface ApiError {
  message?: string;
  error?: {
    message?: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class AiService {
  private readonly apiUrl = 'http://localhost:3000/api/ai';
  private http = inject(HttpClient);

  /**
   * Analiza un cálculo eléctrico con IA
   */
  analyzeCalculation(request: AnalyzeRequest): Observable<AnalyzeResponse> {
    const headers = this.getAuthHeaders();
    
    return this.http.post<AnalyzeResponse>(`${this.apiUrl}/analyze`, request, { headers })
      .pipe(
        map(response => this.validateAnalyzeResponse(response)),
        catchError(error => this.handleError(error, 'Error al analizar cálculo'))
      );
  }

  /**
   * Ingesta un archivo Excel
   */
  ingestExcel(file: File): Observable<IngestExcelResponse> {
    const headers = this.getAuthHeaders();
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<IngestExcelResponse>(`${this.apiUrl}/ingest/excel`, formData, { headers })
      .pipe(
        catchError(error => this.handleError(error, 'Error al procesar archivo Excel'))
      );
  }

  /**
   * Obtiene headers de autenticación
   */
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('access_token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  /**
   * Valida la respuesta del análisis
   */
  private validateAnalyzeResponse(response: unknown): AnalyzeResponse {
    if (!response || typeof (response as AnalyzeResponse).summary !== 'string') {
      throw new Error('Respuesta de análisis inválida');
    }

    const analyzeResponse = response as AnalyzeResponse;
    if (!Array.isArray(analyzeResponse.recommendations)) {
      analyzeResponse.recommendations = [];
    }

    return analyzeResponse;
  }

  /**
   * Maneja errores de la API
   */
  private handleError(error: ApiError, defaultMessage: string): Observable<never> {
    let errorMessage = defaultMessage;

    if (error.error?.message) {
      errorMessage = error.error.message;
    } else if (error.message) {
      errorMessage = error.message;
    }

    console.error('AI Service Error:', error);
    return throwError(() => new Error(errorMessage));
  }
}
