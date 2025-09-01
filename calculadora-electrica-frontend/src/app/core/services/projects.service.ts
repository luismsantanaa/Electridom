import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Project {
  id: string;
  name: string;
  description?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
  createdAt: string;
  updatedAt: string;
  metadata?: any;
}

export interface ProjectQuery {
  page: number;
  pageSize: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  status?: string;
}

export interface ProjectResponse {
  data: Project[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface CreateProjectRequest {
  name: string;
  description?: string;
  metadata?: any;
}

export interface UpdateProjectRequest {
  name?: string;
  description?: string;
  status?: string;
  metadata?: any;
}

@Injectable({
  providedIn: 'root'
})
export class ProjectsService {
  private readonly apiUrl = `${environment.apiUrl}/v1/projects`;

  constructor(private http: HttpClient) {}

  /**
   * Obtiene la lista de proyectos con paginación y filtros
   */
  list(query: ProjectQuery): Observable<ProjectResponse> {
    let params = new HttpParams()
      .set('page', query.page.toString())
      .set('pageSize', query.pageSize.toString());

    if (query.sortBy) {
      params = params.set('sortBy', query.sortBy);
    }
    if (query.sortOrder) {
      params = params.set('sortOrder', query.sortOrder);
    }
    if (query.search) {
      params = params.set('search', query.search);
    }
    if (query.status) {
      params = params.set('status', query.status);
    }

    return this.http.get<ProjectResponse>(this.apiUrl, { params });
  }

  /**
   * Obtiene un proyecto por ID
   */
  getById(id: string): Observable<Project> {
    return this.http.get<Project>(`${this.apiUrl}/${id}`);
  }

  /**
   * Crea un nuevo proyecto
   */
  create(project: CreateProjectRequest): Observable<Project> {
    return this.http.post<Project>(this.apiUrl, project);
  }

  /**
   * Actualiza un proyecto existente
   */
  update(id: string, project: UpdateProjectRequest): Observable<Project> {
    return this.http.put<Project>(`${this.apiUrl}/${id}`, project);
  }

  /**
   * Elimina un proyecto
   */
  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  /**
   * Cambia el estado de un proyecto
   */
  changeStatus(id: string, status: string): Observable<Project> {
    return this.http.patch<Project>(`${this.apiUrl}/${id}/status`, { status });
  }

  /**
   * Obtiene estadísticas de proyectos
   */
  getStats(): Observable<{
    total: number;
    active: number;
    inactive: number;
    archived: number;
  }> {
    return this.http.get<{
      total: number;
      active: number;
      inactive: number;
      archived: number;
    }>(`${this.apiUrl}/stats`);
  }

  /**
   * Función para usar con el DataGrid
   */
  getDataGridDataSource() {
    return (query: any) => this.list(query).toPromise();
  }
}
