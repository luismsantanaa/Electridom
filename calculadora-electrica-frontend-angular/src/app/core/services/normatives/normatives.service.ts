import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { 
  Normative, 
  NormativeListResponse, 
  NormativeListQuery 
} from '../../../shared/types/normative.types';

@Injectable({
  providedIn: 'root'
})
export class NormativesService {
  private apiUrl = `${environment.apiUrl}/normatives`;

  constructor(private http: HttpClient) { }

  listNormatives(params: NormativeListQuery): Observable<NormativeListResponse> {
    let httpParams = new HttpParams()
      .set('page', (params.page || 1).toString())
      .set('pageSize', (params.pageSize || 10).toString());

    if (params.q) {
      httpParams = httpParams.set('q', params.q);
    }
    if (params.source) {
      httpParams = httpParams.set('source', params.source);
    }

    return this.http.get<NormativeListResponse>(this.apiUrl, { params: httpParams });
  }
}
