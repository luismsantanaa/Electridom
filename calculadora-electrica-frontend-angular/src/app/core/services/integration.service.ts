import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, switchMap, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ProjectsService, CreateProjectRequest } from './projects.service';
import { ResultadosService, ResultadoModelado } from './resultados.service';

export interface ProjectCreationData {
  projectName: string;
  description: string;
  surfaces: Array<{
    environment: string;
    areaM2: number;
  }>;
  consumptions: Array<{
    name: string;
    environment: string;
    watts: number;
  }>;
  opciones: {
    tensionV: number;
    monofasico: boolean;
  };
  computeNow: boolean;
}

export interface IntegrationFlowResult {
  projectId: number;
  projectName: string;
  status: string;
  results?: ResultadoModelado;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class IntegrationService {

  constructor(
    private http: HttpClient,
    private projectsService: ProjectsService,
    private resultadosService: ResultadosService
  ) {}

  /**
   * HU13.1 - Crear proyecto end-to-end
   * Crea un proyecto completo con superficies y consumos
   */
  createProjectEndToEnd(data: ProjectCreationData): Observable<IntegrationFlowResult> {
    console.log('🚀 Iniciando flujo end-to-end:', data);

    return this.http.post<any>(`${environment.apiUrl}/v1/projects`, data).pipe(
      tap(response => console.log('✅ Proyecto creado:', response)),
      switchMap(project => {
        const result: IntegrationFlowResult = {
          projectId: project.id,
          projectName: project.projectName,
          status: project.status
        };

        // Si se solicitó cálculo inmediato, obtener resultados
        if (data.computeNow && project.status === 'COMPLETED') {
          return this.resultadosService.getResultados(project.id).pipe(
            tap(results => {
              result.results = results;
              console.log('✅ Resultados obtenidos:', results);
            }),
            switchMap(() => [result])
          );
        }

        return [result];
      })
    );
  }

  /**
   * HU13.2 - Flujo de cálculos
   * Ejecuta el cálculo completo para un proyecto existente
   */
  executeCalculationFlow(projectId: number): Observable<IntegrationFlowResult> {
    console.log('🧮 Ejecutando flujo de cálculos para proyecto:', projectId);

    return this.http.post<any>(`${environment.apiUrl}/v1/projects/${projectId}/compute`, {}).pipe(
      tap(response => console.log('✅ Cálculo ejecutado:', response)),
      switchMap(() => this.resultadosService.getResultados(projectId)),
      tap(results => console.log('✅ Resultados del cálculo:', results)),
      switchMap(results => [{
        projectId,
        projectName: results.proyecto.nombre,
        status: 'COMPLETED',
        results
      }])
    );
  }

  /**
   * HU13.3 - Visualización integrada
   * Obtiene datos completos para visualización
   */
  getIntegratedVisualizationData(projectId: number): Observable<{
    project: any;
    results: ResultadoModelado;
    statistics: any;
  }> {
    console.log('📊 Obteniendo datos para visualización integrada:', projectId);

    return this.resultadosService.getResultados(projectId).pipe(
      switchMap(results => {
        const statistics = this.resultadosService.getEstadisticas(results);
        
        return [{
          project: {
            id: results.proyecto.id,
            name: results.proyecto.nombre,
            type: results.proyecto.tipo_instalacion
          },
          results,
          statistics
        }];
      })
    );
  }

  /**
   * HU13.4 - Exportación real
   * Prepara datos para exportación con información completa
   */
  prepareExportData(projectId: number): Observable<{
    project: any;
    results: ResultadoModelado;
    exportData: any;
  }> {
    console.log('📄 Preparando datos para exportación:', projectId);

    return this.resultadosService.getResultados(projectId).pipe(
      switchMap(results => {
        const exportData = {
          projectInfo: {
            id: results.proyecto.id,
            name: results.proyecto.nombre,
            type: results.proyecto.tipo_instalacion,
            voltage: results.proyecto.tension_sistema,
            phases: results.proyecto.fases,
            powerFactor: results.proyecto.factor_potencia
          },
          summary: results.resumen,
          circuits: results.circuitos,
          statistics: this.resultadosService.getEstadisticas(results),
          exportDate: new Date().toISOString(),
          exportVersion: '1.0'
        };

        return [{
          project: exportData.projectInfo,
          results,
          exportData
        }];
      })
    );
  }

  /**
   * Verificar estado de integración
   */
  checkIntegrationStatus(): Observable<{
    backend: boolean;
    database: boolean;
    services: string[];
  }> {
    return this.http.get<any>(`${environment.apiUrl}/health`).pipe(
      switchMap(health => {
        const status = {
          backend: health.status === 'ok',
          database: health.details?.database?.status === 'up',
          services: Object.keys(health.details || {}).filter(key => 
            health.details[key]?.status === 'up'
          )
        };
        return [status];
      })
    );
  }

  /**
   * Obtener proyectos disponibles para integración
   */
  getAvailableProjects(): Observable<any[]> {
    return this.http.get<any>(`${environment.apiUrl}/v1/projects`).pipe(
      switchMap(response => [response.data || []])
    );
  }
}
