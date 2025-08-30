# Rutas y Menú Angular (Sprint 8)
## Módulos (lazy)
- /proyectos → list, detail/:id, edit/:id
- /calculos
- /planos
- /exportar
- /normativas
- /utilidades
- /ajustes

## Sidebar (RBAC visible)
- Mostrar ítems según rol: admin, editor, viewer.
- Breadcrumbs y PageTitle por ruta.

## Ejemplo de route module (proyectos-routing.module.ts)
```ts
const routes: Routes = [
  { path: '', component: ProjectListPage, canActivate: [AuthGuard] },
  { path: 'detail/:id', component: ProjectDetailPage, canActivate: [AuthGuard] },
  { path: 'edit/:id', component: ProjectEditPage, canActivate: [AuthGuard, RoleGuard], data: { roles: ['admin','editor'] } },
];
```