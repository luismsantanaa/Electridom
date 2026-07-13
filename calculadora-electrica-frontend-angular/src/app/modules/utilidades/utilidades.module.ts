import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { UtilidadesPage } from './pages/utilidades/utilidades.page';

const routes: Routes = [
  {
    path: '',
    component: UtilidadesPage
  }
];

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    UtilidadesPage
  ]
})
export class UtilidadesModule { }
