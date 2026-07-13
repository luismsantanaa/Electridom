import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';

// Components
import { NormativasPage } from './pages/normativas/normativas.page';
import { NormativeListPage } from './pages/normative-list/normative-list.page';

const routes: Routes = [
  {
    path: '',
    component: NormativasPage
  },
  {
    path: 'list',
    component: NormativeListPage
  }
];

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    SharedModule,
    RouterModule.forChild(routes),
    NormativasPage,
    NormativeListPage
  ]
})
export class NormativasModule { }
