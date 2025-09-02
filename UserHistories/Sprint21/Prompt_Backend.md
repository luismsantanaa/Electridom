# Sprint 21 – Backend (NestJS)
## Objetivo
Implementar **exportación avanzada** del **diagrama unifilar** a **PDF y JSON** con protecciones y balance de fases, listo para entrega al cliente.

## Endpoints
- `GET /api/export/unifilar/advanced/:projectId?format=pdf|json`

## Tareas
1. Servicio `UnifilarAdvancedExportService`:
   - Generar JSON completo (layout, símbolos, conexiones, fases).
   - Generar PDF usando una lib Node (p.ej., pdfkit) o servicio headless.
2. Optimizar consultas y reunir datos: proyecto, tablero(s), circuitos, protecciones.
3. Pruebas de rendimiento con 200+ circuitos.

## Esquema JSON (resumen)
```json
{
  "projectId": 123,
  "panels": [{
    "id": 1,
    "phaseMap": {"A":[10,14], "B":[11,15], "C":[12,16]},
    "circuits": [
      {"id":10,"breaker":20,"diff":"GFCI","symbols":["mcb","gfci"]}
    ]
  }],
  "render": {"symbols":"IEC","orientation":"vertical"}
}
```
