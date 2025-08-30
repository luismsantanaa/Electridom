# Cursor — Plan de Ejecución Sprint 8
## Contexto
- Frontend: Angular 19 + Signals + Datta-Able Angular Lite.
- Backend: NestJS + TypeScript + MariaDB.
- Objetivos: IA (fase 1), menú modular consistente, `AppDataGrid` reusable y listado de **Proyectos** paginado.

## Estructura de carpetas (crear/ajustar)
- calculadora-electrica-frontend/
  - src/app/shared/ui/app-data-grid/
  - src/app/shared/components/confirm-dialog/
  - src/app/core/services/{projects,ai}/
  - src/app/modules/{proyectos,calculos,planos,exportar,normativas,utilidades,ajustes}/
- calculadora-electrica-backend/
  - src/modules/{ai,projects}/
  - src/common/{dto,interceptors,guards}/
  - prisma/typeorm/ (según ORM) seeds y migraciones

## Pasos (orden sugerido)
1. **Menú y rutas**: Sidebar por módulos con RBAC visible; Breadcrumbs + Title per-route.
2. **`AppDataGrid`**: crear componente reusable con paginación server-side, orden, filtros y acciones.
3. **Proyectos (list)**: integrar `AppDataGrid` con `ProjectsApi` y endpoints de backend.
4. **IA (fase 1)**: endpoints `/ai/evaluate` y `/ai/suggestions` (provider mock) + panel lateral en detalle de proyecto.
5. **Semillas**: cargar 20–50 proyectos para validar paginación.
6. **Pruebas**: unit tests mínimos para `AppDataGrid`, `ProjectsApi`, `AiService` (mock).

## Comandos
- Frontend: `npm run start` en carpeta FE.
- Backend: `npm run start:dev` en carpeta BE.
- BD: correr migraciones y seeds provistos.
