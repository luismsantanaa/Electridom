# Sprint 18 – Frontend (Angular 19)
## Objetivo
Visualizar y recalcular **protecciones por circuito**: breaker y diferencial (GFCI/AFCI).

## Entregables
- Módulo `protections` con `ProtectionsComponent`.
- Servicio `protections.service.ts` contra endpoints del backend.
- Tabla con columnas: Circuito, Carga (VA), Conductor, Breaker propuesto, Diferencial propuesto, Notas.
- Acción “Recalcular” por circuito y para el proyecto completo.

## Flujo UI
1. Usuario abre Proyecto → pestaña “Protecciones”.
2. Carga tabla con `GET /api/protections/project/:projectId`.
3. Botón “Recalcular todas” → `POST /api/protections/recalculate`.
4. Edición manual opcional con validaciones (guardado con PATCH futuro).

## Criterios de aceptación
- La tabla refleja cambios tras recalcular.
- Errores del backend se muestran como toasts.
