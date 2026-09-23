# scripts/

Scripts de infraestructura del monorepo que aún se usan en runtime.

| Archivo | Uso |
|---------|-----|
| `init-multiple-databases.sh` | Montado en PostgreSQL (`docker-compose`) para crear DBs adicionales y PostGIS en el primer arranque |

Scripts de desarrollo diario: `infrastructure/scripts/` (`start-dev.ps1`, `stop-dev.ps1`).
`start-dev.ps1` libera puertos 3000/4200/8000, arranca backend + plan-service, **espera `/api/health`** y luego abre el frontend.
Usa el `.venv` de plan-service para uvicorn. Timeout configurable: `-BackendTimeoutSec 180`.
Scripts de backend (migraciones, seeds, tests): `backend/scripts/`.
