# Backend Sprint 9
## Endpoints nuevos
- Proyectos: `POST /projects`, `PUT /projects/:id`, `DELETE /projects/:id`
- Exportaciones: `GET /exports`, `GET /exports/:id/download`, `DELETE /exports/:id`
- Normativas: `GET /normatives?page&pageSize&q&source`

## RBAC
- Decorator `@Roles('admin','editor','viewer')`
- Guard global de roles + middleware JWT.
- Matriz de permisos por módulo/acción documentada.

## Performance
- Índices compuestos en tablas con filtros habituales.
- Cache con TTL para listados de alta demanda.
- EXPLAIN en consultas clave y métricas de latencia.
