import { Component, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
@Component({ selector:'app-ai-panel', standalone:true, template:`<h3>Asistente IA</h3>` })
export class AiPanelComponent {
  private http = inject(HttpClient);
  loading = signal(false);
  async ask(payload:any){
    this.loading.set(true);
    try{ return await this.http.post('/api/ai/analyze', payload).toPromise(); }
    finally{ this.loading.set(false); }
  }
}
