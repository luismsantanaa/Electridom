# Sprint 19 – Frontend (Angular 19)
## Objetivo
Visualizar **validaciones de protecciones** y permitir descargar el **unifilar JSON**.

## Entregables
- `ProtectionsValidationComponent` con lista de advertencias.
- Botón “Exportar unifilar (JSON)” que consume `/api/export/unifilar/:projectId` y descarga archivo.
- Iconografía IEC renderizada en células de tabla (mapeo básico).

## Criterios de aceptación
- Si hay inconsistencias (p.ej. breaker > ampacidad), se muestran en UI.
- Descargar JSON funciona y contiene los circuitos esperados.
