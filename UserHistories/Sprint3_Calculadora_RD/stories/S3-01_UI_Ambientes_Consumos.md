# S3-01 — UI de Ambientes y Consumos (Angular 19 + Signals)
**Fecha:** 2025-08-23
**Objetivo:** Formularios con signals para capturar `superficies` y `consumos` (según `schemas/input.schema.json`).

## Criterios de Aceptación
- CRUD de ambientes y consumos con validaciones (requerido, rangos, tipos).
- Estado global con signals + persistencia en localStorage.
- Botón **Validar y Previsualizar** (POST `/calc/rooms/preview`).

## Entregables
- `rooms-form`, `loads-form`, `summary-panel`.
- `CalcApiService` con manejo de loading/errores.
- ≥ 15 tests unitarios.
