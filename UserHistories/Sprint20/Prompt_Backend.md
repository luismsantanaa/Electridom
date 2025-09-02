# Sprint 20 – Backend (NestJS)
## Objetivo
Integrar **IA (Eléctridom)** para cálculo automático de **asignación de circuitos** y **protecciones** desde superficies/consumos.

## Endpoints
- `POST /api/ia/calculate` → Body con `projectId` o payload completo.
- `GET /api/ia/result/:projectId` → Último resultado almacenado de IA.

## Contratos
### Request
```json
{
  "projectId": 123,
  "inputs": {
    "superficies": [{"nombre": "Sala", "area_m2": 18}],
    "consumos": [{"equipo": "Nevera", "ambiente": "Cocina", "w": 300}]
  }
}
```
### Response
```json
{
  "projectId": 123,
  "circuits": [ { "id": 10, "area": "Cocina", "loadVA": 1800, "conductorGauge": "2.0 mm2" } ],
  "protections": [ { "circuitId": 10, "breakerAmp": 20, "differential": "GFCI" } ],
  "explanations": ["Se agruparon cargas residenciales generales en 1800 VA por circuito."]
}
```

## Tareas
1. Cliente IA (HTTP) configurable por `.env` (endpoint, apiKey).
2. Servicio `IAService` que transforma datos internos → prompt IA → normaliza respuesta.
3. Persistir resultados en tablas `circuit`/`protection`.
4. Manejo de errores y timeouts.
