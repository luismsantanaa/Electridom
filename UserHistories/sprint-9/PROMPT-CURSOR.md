# Cursor — Plan de Ejecución Sprint 9
## Objetivos
- Extender grids y CRUD, políticas de roles y mejoras de rendimiento.

## Pasos
1. **CRUD Proyectos**: formularios crear/editar con validaciones; reglas de negocio (nombre único, evitar eliminar con exportaciones activas).
2. **Grids adicionales**:
   - Normativas: lectura/búsqueda por fuente (RIE/NEC/REBT).
   - Exportaciones: historial con descarga y eliminación de registro.
3. **RBAC**: roles admin/editor/viewer; guards FE, `@Roles()` en BE; ocultar acciones no permitidas.
4. **Performance**: índices DB, cache TTL en listados, revisión de lazy-loading y pesos de chunks.

## Comandos
- Ejecutar migraciones y seeds ampliados.
- Correr tests unitarios y scripts de benchmark simples.
