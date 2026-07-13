import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';

// Components
import { ExportarPage } from './pages/exportar/exportar.page';
import { ExportListPage } from './pages/export-list/export-list.page';

const routes: Routes = [
  {
    path: '',
    component: ExportarPage
  },
  {
    path: 'list',
    component: ExportListPage
  }
];

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    SharedModule,
    RouterModule.forChild(routes),
    ExportarPage,
    ExportListPage
  ]
})
export class ExportarModule { }
