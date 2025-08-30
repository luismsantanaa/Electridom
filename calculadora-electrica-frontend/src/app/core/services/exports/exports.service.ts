import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { 
  Export, 
  ExportListResponse, 
  ExportListQuery,
  CreateExportRequest 
} from '../../../shared/types/export.types';

@Injectable({
  providedIn: 'root'
})
export class ExportsService {
  private apiUrl = `${environment.apiUrl}/exports`;

  constructor(private http: HttpClient) { }

  listExports(params: ExportListQuery): Observable<ExportListResponse> {
    let httpParams = new HttpParams()
      .set('page', (params.page || 1).toString())
      .set('pageSize', (params.pageSize || 10).toString());

    return this.http.get<ExportListResponse>(this.apiUrl, { params: httpParams });
  }

  createExport(request: CreateExportRequest): Observable<void> {
    return this.http.post<void>(this.apiUrl, request);
  }

  downloadExport(id: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${id}/download`, { 
      responseType: 'blob' 
    });
  }

  deleteExport(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
