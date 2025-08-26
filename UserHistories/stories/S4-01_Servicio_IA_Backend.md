# S4-01 — Servicio de Integración IA (NestJS)
**Fecha:** 2025-08-25
**Objetivo:** `AiAdvisorService` que consuma OpenAI API: explicar resultados, sugerir mejoras, responder preguntas.

## Criterios
- `POST /ai/analyze` recibe: input original + output del cálculo.
- Respuesta: `summary` + `recommendations[]` (estructura JSON).
- Rate limiting y auditoría (reusar Sprint 1).
- `.env`: OPENAI_API_KEY, OPENAI_MODEL, AI_TIMEOUT_MS.

## Entregables
- Servicio + controlador + DTOs + ≥10 tests unitarios.
- Métricas de latencia y conteo de tokens.
