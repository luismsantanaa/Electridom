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
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.component').then((c) => c.DashboardComponent)
      },
      {
        path: 'ia',
        loadChildren: () => import('./features/ia/ia-module').then((m) => m.IaModule)
      },
      {
        path: 'proyectos',
        loadChildren: () => import('./modules/proyectos/proyectos.module').then((m) => m.ProyectosModule)
      },
      {
        path: 'calculos',
        loadChildren: () => import('./modules/calculos/calculos.module').then((m) => m.CalculosModule)
      },
      {
        path: 'planos',
        loadChildren: () => import('./modules/planos/planos.module').then((m) => m.PlanosModule)
      },
      {
        path: 'exportar',
        loadChildren: () => import('./modules/exportar/exportar.module').then((m) => m.ExportarModule)
      },
      {
        path: 'proyectos/:id/resultados',
        loadComponent: () => import('./features/exportaciones/resultados.component').then((c) => c.ResultadosComponent)
      },
      {
        path: 'normativas',
        loadChildren: () => import('./modules/normativas/normativas.module').then((m) => m.NormativasModule)
      },
      {
        path: 'utilidades',
        loadChildren: () => import('./modules/utilidades/utilidades.module').then((m) => m.UtilidadesModule)
      },
      {
        path: 'ajustes',
        loadChildren: () => import('./modules/ajustes/ajustes.module').then((m) => m.AjustesModule)
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
