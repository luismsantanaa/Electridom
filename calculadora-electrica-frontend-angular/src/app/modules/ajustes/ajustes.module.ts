import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { AjustesPage } from './pages/ajustes/ajustes.page';

const routes: Routes = [
  {
    path: '',
    component: AjustesPage
  }
];

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    AjustesPage
  ]
})
export class AjustesModule { }
