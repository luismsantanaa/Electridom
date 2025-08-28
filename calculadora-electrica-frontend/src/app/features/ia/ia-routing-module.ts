import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ChatIaComponent } from './components/chat-ia/chat-ia.component';
import { CalculosIaComponent } from './components/calculos-ia/calculos-ia.component';
import { DashboardCargasComponent } from './components/dashboard-cargas/dashboard-cargas.component';
import { UnifilarSvgComponent } from './components/unifilar-svg/unifilar-svg.component';
import { ExportReportsComponent } from './components/export-reports/export-reports.component';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'chat',
    pathMatch: 'full'
  },
  {
    path: 'chat',
    component: ChatIaComponent,
    title: 'Chat IA - Electridom'
  },
  {
    path: 'calculos',
    component: CalculosIaComponent,
    title: 'Cálculos IA - Electridom'
  },
  {
    path: 'dashboard',
    component: DashboardCargasComponent,
    title: 'Dashboard de Cargas - Electridom'
  },
  {
    path: 'unifilar',
    component: UnifilarSvgComponent,
    title: 'Diagrama Unifilar - Electridom'
  },
  {
    path: 'export',
    component: ExportReportsComponent,
    title: 'Exportar Reportes - Electridom'
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class IaRoutingModule {}
