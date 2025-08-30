import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Project, ProjectInput, ProjectListResponse, ProjectListQuery } from '../../../shared/types/project.types';

// Interfaces legacy mantenidas para compatibilidad
export interface LegacyProject {
  id: string;
  name: string;
  owner: string;
  apparentPowerKVA: number;
  circuits: number;
  updatedAt: string;
  createdAt: string;
  description?: string;
  status: 'active' | 'archived' | 'draft';
}

export interface ListProjectsQuery {
  page: number;
  pageSize: number;
  sort?: string;
  order?: 'asc' | 'desc';
  q?: string;
}

export interface GridResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CreateProjectDto {
  name: string;
  owner: string;
  apparentPowerKVA: number;
  circuits: number;
  description?: string;
}

export interface UpdateProjectDto {
  name?: string;
  owner?: string;
  apparentPowerKVA?: number;
  circuits?: number;
  description?: string;
  status?: 'active' | 'archived' | 'draft';
}

@Injectable({
  providedIn: 'root'
})
export class ProjectsService {
  private apiUrl = `${environment.apiUrl}/projects`;

  constructor(private http: HttpClient) { }

  // Métodos legacy mantenidos para compatibilidad
  list(params: ListProjectsQuery): Observable<GridResponse<LegacyProject>> {
    let httpParams = new HttpParams()
      .set('page', params.page.toString())
      .set('pageSize', params.pageSize.toString());

    if (params.sort) {
      httpParams = httpParams.set('sort', params.sort);
    }
    if (params.order) {
      httpParams = httpParams.set('order', params.order);
    }
    if (params.q) {
      httpParams = httpParams.set('q', params.q);
    }

    return this.http.get<GridResponse<LegacyProject>>(this.apiUrl, { params: httpParams });
  }

  // ===== SPRINT 9: MÉTODOS CRUD COMPLETOS =====
  
  listProjects(params: ProjectListQuery): Observable<ProjectListResponse> {
    let httpParams = new HttpParams()
      .set('page', (params.page || 1).toString())
      .set('pageSize', (params.pageSize || 20).toString());

    if (params.sort) {
      httpParams = httpParams.set('sort', params.sort);
    }
    if (params.order) {
      httpParams = httpParams.set('order', params.order);
    }
    if (params.q) {
      httpParams = httpParams.set('q', params.q);
    }
    if (params.includeArchived !== undefined) {
      httpParams = httpParams.set('includeArchived', params.includeArchived.toString());
    }

    return this.http.get<ProjectListResponse>(this.apiUrl, { params: httpParams });
  }

  createSimpleProject(project: ProjectInput): Observable<Project> {
    return this.http.post<Project>(`${this.apiUrl}/simple`, project);
  }

  updateProject(id: string, project: ProjectInput): Observable<Project> {
    return this.http.put<Project>(`${this.apiUrl}/${id}`, project);
  }

  deleteProject(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getById(id: string): Observable<Project> {
    return this.http.get<Project>(`${this.apiUrl}/${id}`);
  }

  create(project: CreateProjectDto): Observable<Project> {
    return this.http.post<Project>(this.apiUrl, project);
  }

  update(id: string, project: UpdateProjectDto): Observable<Project> {
    return this.http.put<Project>(`${this.apiUrl}/${id}`, project);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  archive(id: string): Observable<Project> {
    return this.http.patch<Project>(`${this.apiUrl}/${id}/archive`, {});
  }

  restore(id: string): Observable<Project> {
    return this.http.patch<Project>(`${this.apiUrl}/${id}/restore`, {});
  }
}
