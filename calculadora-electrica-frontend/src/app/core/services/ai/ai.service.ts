import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface AiEvaluation {
  score: number;
  alerts: Alert[];
  hints: string[];
}

export interface Alert {
  code: string;
  severity: 'info' | 'warn' | 'error';
  message: string;
}

export interface AiSuggestion {
  id: string;
  title: string;
  description: string;
  type: 'optimization' | 'safety' | 'efficiency' | 'compliance';
  priority: 'low' | 'medium' | 'high';
  impact: string;
}

export interface EvaluateProjectDto {
  projectId: string;
}

@Injectable({
  providedIn: 'root'
})
export class AiService {
  private apiUrl = `${environment.apiUrl}/ai`;

  constructor(private http: HttpClient) { }

  evaluateProject(projectId: string): Observable<AiEvaluation> {
    return this.http.post<AiEvaluation>(`${this.apiUrl}/evaluate`, { projectId });
  }

  getSuggestions(projectId: string): Observable<{ suggestions: AiSuggestion[] }> {
    return this.http.get<{ suggestions: AiSuggestion[] }>(`${this.apiUrl}/suggestions`, {
      params: { projectId }
    });
  }

  // Método para obtener el estado de salud del servicio de IA
  getHealth(): Observable<{ status: string; provider: string }> {
    return this.http.get<{ status: string; provider: string }>(`${this.apiUrl}/health`);
  }

  // Método para obtener el proveedor actual de IA
  getProvider(): Observable<{ provider: string; model?: string }> {
    return this.http.get<{ provider: string; model?: string }>(`${this.apiUrl}/provider`);
  }
}
