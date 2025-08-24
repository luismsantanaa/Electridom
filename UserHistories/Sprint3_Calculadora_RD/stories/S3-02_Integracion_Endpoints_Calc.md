# S3-02 — Integración con Endpoints de Cálculo
**Objetivo:** Flujo CE‑01→CE‑05: `/calc/rooms/preview` → `/calc/demand/preview` → `/calc/circuits/preview` → `/calc/feeder/preview` → `/calc/grounding/preview`.

## Criterios
- Validación previa del payload con schema en cliente.
- Manejo de errores/toasts y retry simple.
- Tablas de resultados por ambiente y totales.

## Entregables
- Métodos en `CalcApiService` y `results-view`.
- Tests unitarios con stubs HTTP.
