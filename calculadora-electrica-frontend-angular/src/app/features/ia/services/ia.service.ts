import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface SystemConfig {
  voltage: number;
  phases: number;
  frequency: number;
}

export interface Environment {
  nombre: string;
  area_m2: number;
  tipo: string;
}

export interface Consumption {
  nombre: string;
  ambiente: string;
  potencia_w: number;
  tipo: string;
}

export interface CalcRequest {
  system: SystemConfig;
  superficies: Environment[];
  consumos: Consumption[];
  model?: string;
  temperature?: number;
}

export interface ExplainRequest {
  question: string;
  context?: string;
  model?: string;
  temperature?: number;
}

export interface CalcResponse {
  summary: string;
  calculations: {
    demand: {
      total_va: string;
      diversified_va: string;
      current_a: string;
    };
    conductors: {
      main_feeder: string;
      branch_circuits: string;
    };
    protections: {
      main_breaker: string;
      branch_breakers: string;
    };
  };
  compliance: {
    status: 'compliant' | 'non_compliant' | 'warning';
    issues: string[];
    recommendations: string[];
  };
  safety: {
    level: 'high' | 'medium' | 'low';
    concerns: string[];
  };
  references: {
    normative: string;
    tables: string;
  };
  metadata: {
    correlationId: string;
    provider: string;
    model: string;
    duration: number;
    tokensUsed: number;
  };
}

export interface StreamResponse {
  content: string;
  done: boolean;
  model: string;
  provider: string;
  correlationId?: string;
}

export interface ProviderInfo {
  current: {
    name: string;
    models: string[];
  };
  available: Array<{
    name: string;
    available: boolean;
    models: string[];
  }>;
  timestamp: string;
}

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  currentProvider: string;
  availableProviders: number;
  timestamp: string;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class IaService {
  private readonly apiUrl = 'http://localhost:3000/api/llm';

  constructor(private http: HttpClient) {}

  /**
   * Realizar cálculo eléctrico con IA
   */
  calculate(request: CalcRequest): Observable<CalcResponse> {
    return this.http.post<CalcResponse>(`${this.apiUrl}/calc`, request);
  }

  /**
   * Obtener explicación técnica con streaming
   */
  explain(request: ExplainRequest): Observable<StreamResponse> {
    return new Observable((observer) => {
      const eventSource = new EventSource(`${this.apiUrl}/explain`);

      eventSource.onmessage = (event) => {
        if (event.data === '[DONE]') {
          observer.complete();
          eventSource.close();
          return;
        }

        try {
          const data: StreamResponse = JSON.parse(event.data);
          observer.next(data);
        } catch (error) {
          observer.error(error);
        }
      };

      eventSource.onerror = (error) => {
        observer.error(error);
        eventSource.close();
      };

      // Enviar la solicitud POST
      this.http.post(`${this.apiUrl}/explain`, request).subscribe({
        error: (error) => observer.error(error)
      });

      return () => {
        eventSource.close();
      };
    });
  }

  /**
   * Obtener información de proveedores
   */
  getProviderInfo(): Observable<ProviderInfo> {
    return this.http.get<ProviderInfo>(`${this.apiUrl}/provider`);
  }

  /**
   * Verificar estado del servicio
   */
  getHealth(): Observable<HealthStatus> {
    return this.http.get<HealthStatus>(`${this.apiUrl}/health`);
  }

  /**
   * Método para explicación con streaming usando fetch
   */
  explainWithFetch(request: ExplainRequest): Observable<StreamResponse> {
    return new Observable((observer) => {
      fetch(`${this.apiUrl}/explain`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(request)
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const reader = response.body?.getReader();
          if (!reader) {
            throw new Error('No response body available');
          }

          const decoder = new TextDecoder();
          let buffer = '';

          const processStream = () => {
            reader
              .read()
              .then(({ done, value }) => {
                if (done) {
                  observer.complete();
                  return;
                }

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                  if (line.startsWith('data: ')) {
                    const data = line.slice(6);

                    if (data === '[DONE]') {
                      observer.complete();
                      return;
                    }

                    try {
                      const parsed: StreamResponse = JSON.parse(data);
                      observer.next(parsed);
                    } catch (error) {
                      console.warn('Error parsing stream data:', error);
                    }
                  }
                }

                processStream();
              })
              .catch((error) => {
                observer.error(error);
              });
          };

          processStream();
        })
        .catch((error) => {
          observer.error(error);
        });
    });
  }
}
