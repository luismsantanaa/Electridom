import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class CalcApiService {
  private http = inject(HttpClient);
  baseUrl = '/api';
  loading = signal(false);
  lastError = signal<string | null>(null);

  private async call<T>(method: string, url: string, body?: any): Promise<T> {
    this.loading.set(true);
    this.lastError.set(null);
    try {
      const req = method === 'GET'
        ? this.http.get<T>(`${this.baseUrl}${url}`)
        : this.http.post<T>(`${this.baseUrl}${url}`, body);
      return await req.toPromise();
    } catch (e: any) {
      this.lastError.set(e?.message ?? 'Error');
      throw e;
    } finally {
      this.loading.set(false);
    }
  }

  previewRooms(payload: any){ return this.call('POST','/calc/rooms/preview', payload); }
  previewDemand(payload: any){ return this.call('POST','/calc/demand/preview', payload); }
  previewCircuits(payload: any){ return this.call('POST','/calc/circuits/preview', payload); }
  previewFeeder(payload: any){ return this.call('POST','/calc/feeder/preview', payload); }
  previewGrounding(payload: any){ return this.call('POST','/calc/grounding/preview', payload); }
  getReport(payload: any, type: 'pdf'|'xlsx'){ return this.call('POST',`/calc/report?type=${type}`, payload) as any; }
}
