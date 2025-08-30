import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { PlanosPage } from './pages/planos/planos.page';

const routes: Routes = [
  {
    path: '',
    component: PlanosPage
  }
];

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    PlanosPage
  ]
})
export class PlanosModule { }
