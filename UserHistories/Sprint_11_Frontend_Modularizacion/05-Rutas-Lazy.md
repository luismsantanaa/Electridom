# Rutas Lazy (Angular 19 ejemplo)

// app.routes.ts (ejemplo conceptual)
export const routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  { path: 'dashboard', loadChildren: () => import('./features/dashboard/routes').then(m => m.DASHBOARD_ROUTES) },
  { path: 'proyectos', loadChildren: () => import('./features/proyectos/routes').then(m => m.PROYECTOS_ROUTES) },
  { path: 'calculos', loadChildren: () => import('./features/calculos/routes').then(m => m.CALCULOS_ROUTES) },
  { path: 'exportaciones', loadChildren: () => import('./features/exportaciones/routes').then(m => m.EXPORTACIONES_ROUTES) },
  { path: '**', redirectTo: 'dashboard' }
];
