# AGENTS.md - Calculadora Eléctrica RD

## MCP Tools - Uso Obligatorio

**IMPORTANTE**: Usa los siguientes MCP tools según su funcionalidad cuando sea necesario:

- **codegraph**: Para explorar y entender la estructura del código, dependencias, y relaciones entre archivos. Úsalo antes de hacer cambios significativos.
- **context7**: Para obtener documentación actualizada sobre librerías y frameworks (React, NestJS, FastAPI, etc.). Úsalo cuando necesites verificar APIs o patrones.
- **engram**: Para guardar y recuperar contexto del proyecto, decisiones arquitectónicas, y estado actual. Úsalo para mantener memoria entre sesiones.
- **playwright**: Para testing E2E del frontend React. Úsalo cuando necesites verificar flujos de usuario completos.

## Estructura del Monorepo

```
CalculadoraElectricaRD/
├── calculadora-electrica-backend/    # NestJS 10 + TypeScript + PostgreSQL
├── calculadora-electrica-frontend/   # React 19 + Vite + TypeScript
├── plan-service/                     # Python 3.12 + FastAPI
├── docker-compose.yml               # Orquestación unificada
└── docs/                           # Documentación
```

## Comandos de Desarrollo

### Backend (NestJS)

```bash
cd calculadora-electrica-backend
npm install
npm run migration:run    # Ejecutar migraciones PostgreSQL
npm run seed            # Cargar datos iniciales
npm run start:dev       # Servidor desarrollo (puerto 3000)
npm run test:unit       # Tests unitarios
npm run test:e2e        # Tests E2E (requiere DB)
```

### Frontend (React 19 + Vite)

```bash
cd calculadora-electrica-frontend
npm install
npm run dev              # Servidor desarrollo (puerto 4200, proxy a :3000)
npm run build            # Build producción
npm run lint             # Linting
npm run test             # Tests Vitest
```

### Plan Service (Python FastAPI)

```bash
cd plan-service
pip install -r requirements/dev.txt
uvicorn app.main:app --reload --port 8000
pytest tests/ --cov=app
ruff check app/ tests/
```

## Docker Compose

### Servicios Principales

- **PostgreSQL 16 + PostGIS**: Puerto 5432
- **Redis**: Puerto 6379 (Celery broker)
- **MinIO**: Puerto 9000 (API), 9001 (Console)
- **Plan Service**: Puerto 8000
- **Celery Worker**: Procesamiento asíncrono

### Comandos Útiles

```bash
docker compose up -d              # Iniciar todos los servicios
docker compose logs -f            # Ver logs
docker compose down -v            # Detener y remover volúmenes
```

## URLs de Desarrollo

- **Frontend React**: http://localhost:4200
- **Backend API**: http://localhost:3000
- **API Docs**: http://localhost:3000/api/docs
- **Plan Service**: http://localhost:8000
- **Plan Service Docs**: http://localhost:8000/docs
- **MinIO Console**: http://localhost:9001
- **Adminer (PostgreSQL)**: http://localhost:8081
- **Prometheus**: http://localhost:9090

## Variables de Entorno Críticas

### Backend (.env)

```env
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=electridom
DATABASE_PASSWORD=electridom
DATABASE_NAME=electridom
JWT_SECRET=your-secret-key
OPENAI_API_KEY=your-openai-key
PLAN_SERVICE_URL=http://localhost:8000
```

### Plan Service (plan-service/.env)

```env
DATABASE_URL=postgresql+asyncpg://electridom:electridom@localhost:5432/electridom_plans
REDIS_URL=redis://localhost:6379/0
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=electridom
MINIO_SECRET_KEY=electridom123
```

## Estado Actual del Proyecto (Julio 2026)

### Migración V2 Completada ✅

- ✅ **Fase 0**: Infraestructura completada (plan-service, Docker Compose, CI/CD)
- ✅ **Fase 1**: Migración MariaDB → PostgreSQL completada
- ✅ **Fase 2**: Plan Service endpoints funcionales
- ✅ **Fase 3**: Pipeline DXF completo (parser, polígonos, clasificador)
- ✅ **Fase 4**: Pipeline PDF completo (vectorial, raster, OCR, mixed)
- ✅ **Fase 5**: Frontend React 19 + Vite + TypeScript (auth, calculadora, proyectos)
- ✅ **Fase 6**: Visualización Interactiva (Fabric.js visor 2D, D3.js gráficas, editor)
- ✅ **Fase 7**: AI/ML fallback (OpenAI Vision), documentación

### Deuda Técnica Conocida

- Backend build desactivado en CI (imports rotos en seeds.service.ts)
- E2E tests desactivados (crypto error en Node.js 18.x)
- Frontend linting con errores preexistentes (no bloquea V2)
- mypy type checking en plan-service (continue-on-error)
- YOLOv8 opcional no implementado (requiere dataset etiquetado)
- Pruebas de usabilidad con usuarios reales pendientes

## Testing Strategy

### Backend

```bash
# Tests unitarios (rápidos, sin DB)
npm run test:unit

# Tests E2E (requiere PostgreSQL corriendo)
npm run setup:test-db-complete
npm run test:e2e

# Coverage (threshold: 35%)
npm run test:unit:coverage
```

### Plan Service

```bash
# Tests con coverage
pytest tests/ --cov=app --cov-report=term-missing

# Linting
ruff check app/ tests/

# Type checking (opcional, strict mode)
mypy app/ --ignore-missing-imports
```

### Frontend

```bash
# Linting
npm run lint

# Build verification
npm run build

# Tests (Vitest)
npm run test

# Tests con coverage
npm run test:coverage
```

## Convenciones de Código

### Backend (NestJS)

- Usar DTOs con class-validator para validación
- Services para lógica de negocio, Controllers para HTTP
- TypeORM entities con decoradores
- JWT RS256 para autenticación

### Frontend (React)

- Functional components con hooks
- TypeScript estricto
- Tailwind CSS para estilos
- Zustand para state management global
- React Query para server state
- Proxy config para API calls en desarrollo

### Plan Service (Python)

- FastAPI con Pydantic v2 para schemas
- SQLAlchemy async para DB
- Celery para tareas asíncronas
- Type hints obligatorios (mypy strict)

## CI/CD Pipeline

El pipeline corre en GitHub Actions para branches `main` y `develop`:

1. **Backend Test**: Lint + Unit tests + Coverage (Node.js 18.x, 20.x)
2. **Frontend Test**: Lint + Build (Node.js 20.x, 22.x)
3. **Plan Service Test**: Lint + Tests + Docker build (Python 3.12)
4. **Build & Deploy**: Solo en `main` (actualmente parcial)

## Notas Importantes

- El proyecto completó la migración V2 en Julio 2026
- Frontend migrado de Angular 20 a React 19
- Base de datos migrada de MariaDB a PostgreSQL 16
- Plan Service es el microservicio Python para procesamiento de planos PDF/DXF
- Usar `engram` para guardar decisiones arquitectónicas importantes
- Consultar `context7` antes de usar APIs de librerías para verificar sintaxis actual
- Usar `codegraph` para entender dependencias antes de refactorizar
- Usar `playwright` para testing E2E del frontend cuando sea necesario

## Documentación Adicional

- `ESTADO_PROYECTO.md`: Estado detallado del proyecto
- `docs/plan_ejecucion_migracion_v2.md`: Plan de migración V2 (completado)
- `docs/db_migration_audit.md`: Auditoría de migración DB
- `UserHistories/`: Historias de usuario y especificaciones
