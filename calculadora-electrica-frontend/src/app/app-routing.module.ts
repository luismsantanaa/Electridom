import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

// project import
import { AdminComponent } from './theme/layout/admin/admin.component';
import { GuestComponent } from './theme/layout/guest/guest.component';

const routes: Routes = [
  {
    path: '',
    component: AdminComponent,
    children: [
      {
        path: '',
        redirectTo: 'calc',
        pathMatch: 'full'
      },
      {
        path: 'calc',
        loadComponent: () => import('./features/calc/pages/calc.page').then((c) => c.CalcPage)
      }
    ]
  },
  {
    path: 'login',
    component: GuestComponent,
    children: [
      {
        path: '',
        loadComponent: () => import('./features/auth/pages/login.page').then((c) => c.LoginPage)
      }
    ]
  },
  {
    path: 'register',
    component: GuestComponent,
    children: [
      {
        path: '',
        loadComponent: () => import('./features/auth/pages/register.page').then((c) => c.RegisterPage)
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
