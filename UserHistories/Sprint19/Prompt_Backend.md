# Sprint 19 – Backend (NestJS)
## Objetivo
Validar protecciones contra normativa y preparar **exportación de diagrama unifilar** (JSON base).

## Entregables
- Validador de protecciones por circuito.
- `UnifilarExportService` que genere JSON con nodos: acometida, tablero, protecciones y circuitos.
- Seeds con **símbolos IEC/UNE** (mapeo lógico).

## Endpoints
- `GET /api/export/unifilar/:projectId` → JSON del unifilar básico (sin PDF).
- `GET /api/protections/validate/:projectId` → Lista de advertencias/errores por circuito.

## Esquema JSON Unifilar (simplificado)
```json
{
  "projectId": 123,
  "service": {"voltage": "120/240V", "phases": "1F+N"},
  "mainPanel": {
    "id": 1,
    "symbols": ["main-breaker"],
    "circuits": [
      {
        "id": 10,
        "phase": "A",
        "breakerAmp": 20,
        "differential": "GFCI",
        "loadVA": 1500,
        "symbolRefs": ["mcb", "gfci"]
      }
    ]
  }
}
```
