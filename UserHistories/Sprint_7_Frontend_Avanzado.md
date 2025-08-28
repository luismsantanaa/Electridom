# Sprint 7 — Frontend avanzado (Angular 20 con Signals) + UX de IA
**Duración sugerida:** 1–2 semanas  
**Objetivo:** Integrar UX de IA (chat/explicación y cálculos JSON), dashboards eléctricos, formularios dinámicos y primeras exportaciones (PDF/Excel/SVG).

---

## Alcance (Done Criteria del Sprint)
- [ ] Módulo `IaModule` en Angular con servicio a `/ia/*`, soporte SSE para streaming de texto.
- [ ] Vistas: **Chat IA** (explicación), **Cálculos IA** (JSON → UI), **Dashboard de cargas** (gráficos), **Formularios dinámicos** (superficies/consumos).
- [ ] Generación básica de **unifilar SVG**.
- [ ] Exportación de **reporte PDF** y **Excel**.
- [ ] Tests unitarios y de integración.

---

## Historias de Usuario

### US7.1 – Servicio de IA en Angular (SSE + REST)
**Como** usuario, **quiero** ver respuestas de explicación en streaming y resultados de cálculo en JSON **para** validar decisiones.

---

### US7.2 – Chat IA (explicaciones) + UI
**Como** usuario, **quiero** conversar con Eléctridom para entender normas y decisiones.

---

### US7.3 – Formulario dinámico (superficies y consumos)
**Como** usuario, **quiero** capturar ambientes, áreas y consumos **para** alimentar cálculos.

---

### US7.4 – Dashboard de cargas y materiales
**Como** usuario, **quiero** ver gráficos de cargas y listas de materiales/Protecciones.

---

### US7.5 – Unifilar SVG básico + export
**Como** usuario, **quiero** un diagrama unifilar básico **para** incluir en reportes.

---

### US7.6 – Exportaciones PDF y Excel
**Como** usuario, **quiero** descargar el reporte y planilla de materiales.

---

## Entregables
- `IaModule` con servicios y componentes listados.
- Pruebas unitarias y de integración.
- Guía de uso en `docs/Frontend_IA.md`.
