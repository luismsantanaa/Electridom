# Sprint 16 — Núcleo de Cálculos (Backend + Frontend)
**Objetivo**: Implementar el pipeline de cálculo eléctrico completo para proyectos residenciales: asignación lógica de circuitos, dimensionamiento de conductores y protecciones, balanceo por fases, caída de tensión, chequeo de Icc vs IR, reglas GFCI/AFCI/RCD, selectividad básica y exportación técnica.

## Alcance Técnico
### Backend (NestJS + TypeScript + MariaDB)
Crear/ajustar módulos y servicios:
- `CalculosModule` con servicios:
  - `CircuitAllocatorService`: agrupa cargas en circuitos (IUG/TUG/IUE/TUE), respeta límites VA/circuito y crea “panel schedule” preliminar; balanceo por fases si aplica.
  - `ConductorSizerService`: determina calibre por corriente de diseño y factores de corrección (temperatura/agrupamiento).
  - `ProtectionSelectorService`: selecciona protección (MCB/MCCB) y curva (B/C/D) y aplica banderas GFCI/AFCI/RCD por uso.
  - `VoltageDropService`: calcula VD en derivaciones y alimentadores, propone upsizing si excede límites objetivo (ej. 3% derivación, 5% total).
  - `ShortCircuitService`: estima Icc simplificado en punto de carga, valida IR ≥ Icc.
  - `SelectivityService`: heurística de coordinación básica entre protecciones aguas arriba/abajo.
  - `ValidationService`: checks agregados (OK/KO) por circuito y tablero.
- Endpoints REST:
  - `POST /calculos/proyecto/:id/run`: ejecuta todo el pipeline; guarda snapshot.
  - `GET  /calculos/proyecto/:id`: retorna última corrida con `PanelScheduleDTO`.
- Semillas de tablas en `backend/seeds/normas/*.json` (ver carpeta en este sprint). Crear servicios/Repos para exponer estas tablas y parametrizaciones.
- Unit tests mínimos para cada servicio con casos representativos.

### Frontend (Angular 19/20 con signals)
- Módulo `calculos` con página Panel Schedule:
  - Grid paginado y filtrable de circuitos con: tipo, VA/W, corriente, fase, %uso, conductor, breaker, flags (GFCI/AFCI/RCD), VD OK/KO, IR≥Icc OK/KO, alertas de selectividad.
  - Botones: “Recalcular” y “Ver cambios” (diff simple).
  - Exportación PDF/Excel desde UI.

## Criterios de Aceptación
1. Dados “ambientes + cargas” de ejemplo, el sistema genera un panel schedule balanceado sin sobrecargar circuitos.
2. Cada circuito muestra conductor y protección coherentes y verificados contra VD e IR≥Icc.
3. Se aplican banderas GFCI/AFCI/RCD por ambiente/uso según seeds de normas.
4. Exporta Panel Schedule a PDF/Excel.
5. API y UI documentadas (README).

## Archivos a crear/modificar
- Backend:
  - `src/modules/calculos/*.ts` servicios listados.
  - `src/modules/normas/*.ts` para leer seeds.
  - `test/calculos/*.spec.ts` unit tests.
- Frontend:
  - `src/app/modules/calculos/*` página y servicios REST.
- Utils:
  - Postman/Insomnia collection (opcional) en `utils/`.

## Datos de ejemplo y seeds
Importar JSON en `backend/seeds/normas/` y exponer vía `NormasService`. Permitir override por DB.

## Instrucciones para Cursor
1. Crear archivos según estructura anterior, **no borrar** contenido existente.
2. Implementar TODOs mínimos con tipados claros (DTOs/Interfaces).
3. Proveer scripts NPM: `seed:normas`, `test`, `lint`, `start:dev`.
4. Entregar documentación de endpoints y esquema de datos en `README.md`.

