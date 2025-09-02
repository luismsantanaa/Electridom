# Sprint 17 — IA Explicativa + Validación Normativa
**Objetivo**: Integrar un asistente IA que explique decisiones de cálculo, sugiera alternativas y añada validadores normativos determinísticos con referencias.

## Alcance Técnico
### Backend (NestJS)
- `IaModule` con `ExplainService`:
  - Genera explicaciones por circuito (por qué ese calibre/curva, por qué GFCI/AFCI, por qué upsizing).
  - Sugiere alternativas (dividir/trasladar cargas, cambiar curva/calibre) con pros/contras.
  - Usa plantillas de prompt en `backend/prompts/ia/*.md` (crear).
- `ValidationModule` determinístico:
  - Motor de reglas a partir de seeds `rules_normativas.json`.
  - Endpoint `GET /calculos/:id/validaciones` con severidades y referencias.
- Endpoints:
  - `POST /ia/recomendar/:calcId`
  - `GET  /calculos/:id/circuitos/:cId/explicacion`
- Dataset de pruebas y tests de regresión.

### Frontend (Angular)
- Módulo `asistente`:
  - Panel lateral de advertencias/violaciones.
  - Recomendaciones IA con acciones sugeridas → generan “propuestas” (no aplican cambios sin confirmación).
- Reporte PDF con narrativa (resumen ejecutivo, explicación por circuito, apéndice de parámetros).

## Criterios de Aceptación
1. Endpoints IA y validaciones responden para resultados generados en Sprint 16.
2. La UI muestra alertas, recomendaciones y permite crear/descargar reporte con narrativa.
3. Tests básicos del motor de reglas y del ExplainService con datasets de ejemplo.

## Instrucciones para Cursor
1. Crear `IaModule` y `ValidationModule` sin romper el pipeline del Sprint 16.
2. Plantillas de prompt en `backend/prompts/ia/` (al menos 2: general y por circuito).
3. Exponer referencias normativas desde seeds para citarlas en respuestas IA y validaciones.
