import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { CalculosPage } from './pages/calculos/calculos.page';

const routes: Routes = [
  {
    path: '',
    component: CalculosPage
  }
];

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    CalculosPage
  ]
})
export class CalculosModule { }
