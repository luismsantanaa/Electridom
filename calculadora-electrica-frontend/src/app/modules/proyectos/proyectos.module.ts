import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from '../../shared/shared.module';

// Components
import { ProjectListPage } from './pages/project-list/project-list.page';
import { ProjectDetailPage } from './pages/project-detail/project-detail.page';
import { ProjectEditPage } from './pages/project-edit/project-edit.page';

// Guards
import { AuthGuard } from '../../core/guards/auth.guard';

const routes: Routes = [
  {
    path: '',
    component: ProjectListPage,
    canActivate: [AuthGuard]
  },
  {
    path: ':id',
    component: ProjectDetailPage,
    canActivate: [AuthGuard]
  },
  {
    path: ':id/edit',
    component: ProjectEditPage,
    canActivate: [AuthGuard]
  }
];

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    SharedModule,
    RouterModule.forChild(routes),
    ProjectListPage,
    ProjectDetailPage,
    ProjectEditPage
  ]
})
export class ProyectosModule { }
