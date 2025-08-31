# Tareas Técnicas – Sprint 11

- Limpiar contenido demo del template.
- Crear rutas lazy para: /dashboard, /proyectos, /calculos, /exportaciones.
- Crear **DataGrid** reusable (standalone component) con:
  - Inputs: columns, dataSourceFn(query), pageSize, actions[].
  - Outputs: onView(id), onEdit(id), onDelete(id).
- Servicio `ProjectsService` con método `list(query)`.
- Integrar variables de entorno para baseUrl API.
