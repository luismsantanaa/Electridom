import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { NormativesService } from '../../../../core/services/normatives/normatives.service';
import { AppDataGridComponent, ColumnDef, ActionDef, GridParams, GridResponse } from '../../../../shared/ui/app-data-grid/app-data-grid.component';
import { Normative, NormativeSource } from '../../../../shared/types/normative.types';

@Component({
  selector: 'app-normative-list',
  standalone: true,
  imports: [CommonModule, FormsModule, AppDataGridComponent],
  templateUrl: './normative-list.page.html',
  styleUrls: ['./normative-list.page.scss']
})
export class NormativeListPage implements OnInit {

  sources = [
    { value: '', label: 'Todas las fuentes' },
    { value: NormativeSource.RIE, label: 'RIE' },
    { value: NormativeSource.NEC, label: 'NEC' },
    { value: NormativeSource.REBT, label: 'REBT' }
  ];

  columns: ColumnDef[] = [
    { key: 'code', header: 'Código', sortable: true },
    { key: 'description', header: 'Descripción', sortable: true },
    { key: 'source', header: 'Fuente', sortable: true },
    { key: 'lastUpdated', header: 'Última actualización', sortable: true }
  ];

  actions: ActionDef[] = [
    {
      label: 'Ver',
      icon: 'eye',
      onClick: (row: any) => this.viewNormative(row)
    }
  ];

  constructor(private normativesService: NormativesService) {}

  ngOnInit(): void {
  }

  fetch(params: GridParams): Observable<GridResponse<Normative>> {
    return this.normativesService.listNormatives(params);
  }

  viewNormative(normative: Normative): void {
    // Implementar vista detallada de normativa
    console.log('Ver normativa:', normative);
  }
}
