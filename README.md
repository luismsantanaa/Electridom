# 🚀 Calculadora Eléctrica RD - Electridom

Sistema completo para cálculos eléctricos residenciales, comerciales e industriales según normativas NEC 2023 y RIE RD, con reconocimiento automático de espacios desde planos PDF/DXF.

## 📊 Estado del Proyecto

**✅ Migración V2 Completada (100%) - Julio 2026**

### Arquitectura Actual

```
CalculadoraElectricaRD/
├── backend/                    # NestJS 10 + TypeScript + PostgreSQL
├── frontend/                   # React 19 + Vite + TypeScript
├── plan-service/                     # Python 3.12 + FastAPI (reconocimiento de planos)
├── docker-compose.yml               # Orquestación unificada
└── docs/                           # Documentación
```

### Componentes Principales

- ✅ **Backend NestJS**: Motor de cálculos eléctricos, API RESTful, autenticación JWT
- ✅ **Frontend React 19**: Interfaz moderna con Vite, visualización interactiva
- ✅ **Plan Service Python**: Reconocimiento automático de espacios desde planos PDF/DXF
- ✅ **Base de Datos**: PostgreSQL 16 + PostGIS (migrado desde MariaDB)
- ✅ **Procesamiento Asíncrono**: Celery + Redis
- ✅ **Almacenamiento**: MinIO (S3-compatible)
- ✅ **AI/ML**: OpenAI Vision API como fallback para planos complejos

## 🎯 Funcionalidades

### Cálculos Eléctricos (Backend)

- ✅ Cálculo de cargas por ambiente (CE-01)
- ✅ Factores de demanda y carga diversificada (CE-02)
- ✅ Agrupación de circuitos ramales (CE-03)
- ✅ Análisis de caída de tensión y alimentadores (CE-04)
- ✅ Puesta a tierra y conductores de protección (CE-05)
- ✅ Generación de reportes PDF y Excel (CE-06)

### Reconocimiento de Planos (Plan Service)

- ✅ Pipeline DXF: Parser ezdxf + reconstrucción de polígonos + clasificación
- ✅ Pipeline PDF: Vectorial (PyMuPDF), Raster (OpenCV + OCR), Mixed
- ✅ Detección automática de tipo de PDF
- ✅ Clasificación de espacios con ML
- ✅ Fallback a OpenAI Vision para planos de baja calidad
- ✅ Procesamiento asíncrono con Celery

### Frontend React

- ✅ Autenticación JWT con refresh automático
- ✅ Dashboard y gestión de proyectos
- ✅ Calculadora eléctrica con 5 pasos (CE-01 a CE-05)
- ✅ Visor 2D de planos con Fabric.js (zoom/pan, polígonos, tooltips)
- ✅ Gráficas interactivas con D3.js (treemap, bubble chart)
- ✅ Editor de espacios detectados (verificar, corregir, dividir, unir)
- ✅ Flujo completo: upload → procesamiento → revisión → cálculo

## 🐳 Despliegue con Docker

### Prerrequisitos

- Docker Desktop
- Docker Compose v2

### Instalación Rápida

```bash
# Clonar repositorio
git clone <repository-url>
cd CalculadoraElectricaRD

# Configurar variables de entorno
cp env.example .env
# Editar .env con tus configuraciones (OPENAI_API_KEY, etc.)

# Levantar todos los servicios
docker compose up -d

# Ver logs
docker compose logs -f
```

### URLs de Acceso

- **Frontend React:** http://localhost:4200
- **Backend API:** http://localhost:3000
- **API Docs (Swagger):** http://localhost:3000/api/docs
- **Plan Service:** http://localhost:8000
- **Plan Service Docs:** http://localhost:8000/docs
- **MinIO Console:** http://localhost:9001
- **PostgreSQL Adminer:** http://localhost:8081
- **Prometheus:** http://localhost:9090

### Servicios Docker

- PostgreSQL 16 + PostGIS (puerto 5432)
- Redis (puerto 6379)
- MinIO (puertos 9000, 9001)
- Plan Service (puerto 8000)
- Celery Worker
- Backend NestJS (puerto 3000)
- Frontend React (puerto 4200)

## 🛠️ Desarrollo Local

### Backend (NestJS)

```bash
cd backend

# Instalar dependencias
npm install

# Configurar variables de entorno
cp env.example .env

# Ejecutar migraciones PostgreSQL
npm run migration:run

# Cargar datos iniciales
npm run seed

# Iniciar en desarrollo
npm run start:dev

# Tests
npm run test:unit
npm run test:e2e
```

### Frontend (React 19 + Vite)

```bash
cd frontend

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo (puerto 4200)
npm run dev

# Build producción
npm run build

# Tests
npm run test

# Linting
npm run lint
```

### Plan Service (Python FastAPI)

```bash
cd plan-service

# Crear entorno virtual
python -m venv venv
source venv/bin/activate  # Linux/Mac
# o: venv\Scripts\activate  # Windows

# Instalar dependencias
pip install -r requirements/dev.txt

# Configurar variables de entorno
cp .env.example .env

# Ejecutar migraciones
alembic upgrade head

# Iniciar en desarrollo
uvicorn app.main:app --reload --port 8000

# Tests
pytest tests/ --cov=app

# Linting
ruff check app/ tests/
```

## 🔧 Configuración

### Variables de Entorno

#### Backend (.env)

```env
# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=electridom
DATABASE_PASSWORD=electridom
DATABASE_NAME=electridom

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=900s

# OpenAI
OPENAI_API_KEY=your-openai-api-key
OPENAI_MODEL=gpt-4o-mini

# Plan Service
PLAN_SERVICE_URL=http://localhost:8000

# Application
NODE_ENV=development
PORT=3000
CORS_ORIGIN=http://localhost:4200
```

#### Plan Service (.env)

```env
# Database
DATABASE_URL=postgresql+asyncpg://electridom:electridom@localhost:5432/electridom_plans

# Redis (Celery broker)
REDIS_URL=redis://localhost:6379/0

# MinIO
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=electridom
MINIO_SECRET_KEY=electridom123

# OpenAI (fallback para planos complejos)
OPENAI_API_KEY=your-openai-api-key
OPENAI_VISION_MODEL=gpt-4o-mini
OPENAI_VISION_MAX_DAILY=5
```

## 📚 Documentación

- [Estado del Proyecto](ESTADO_PROYECTO.md) - Estado detallado y métricas
- [Plan de Migración V2](docs/plan_ejecucion_migracion_v2.md) - Plan completo de migración
- [Configuración](docs/CONFIGURATION.md) - Guías de configuración
- [Testing](docs/TESTING.md) - Guías de testing
- [CI/CD](docs/CI_CD_PIPELINE.md) - Pipeline de integración continua
- [Manual de Usuario](docs/MANUAL_USUARIO.md) - Guía de usuario
- [API Documentation](http://localhost:3000/api/docs) - Swagger UI

## 🧪 Testing

### Backend

```bash
cd backend

# Tests unitarios
npm run test:unit

# Tests E2E (requiere PostgreSQL corriendo)
npm run setup:test-db-complete
npm run test:e2e

# Coverage
npm run test:unit:coverage
```

### Plan Service

```bash
cd plan-service

# Tests con coverage
pytest tests/ --cov=app --cov-report=term-missing

# Linting
ruff check app/ tests/

# Type checking (opcional)
mypy app/ --ignore-missing-imports
```

### Frontend

```bash
cd frontend

# Tests
npm run test

# Coverage
npm run test:coverage

# Linting
npm run lint
```

## 📊 Métricas y Monitoreo

- **Prometheus:** http://localhost:9090
- **Health Checks Backend:** http://localhost:3000/api/health
- **Health Checks Plan Service:** http://localhost:8000/health
- **Health Checks AI:** http://localhost:8000/health/ai
- **Métricas Backend:** http://localhost:3000/api/metrics

## 🔒 Seguridad

- JWT RS256 con rotación de claves
- Rate limiting configurado
- CORS configurado
- Headers de seguridad
- Validación de entrada con class-validator
- Argon2id para hashing de contraseñas
- Auditoría completa de acciones

## 🚀 Flujo de Trabajo

### Cálculo Manual

1. Usuario accede al frontend (http://localhost:4200)
2. Inicia sesión con credenciales
3. Navega a "Calculadora"
4. Completa los 5 pasos:
   - CE-01: Habitaciones y cargas
   - CE-02: Factores de demanda
   - CE-03: Circuitos ramales
   - CE-04: Alimentadores y caída de tensión
   - CE-05: Puesta a tierra
5. Descarga reportes PDF/Excel

### Cálculo desde Plano

1. Usuario sube plano PDF/DXF en "Planos"
2. Sistema procesa automáticamente (Celery)
3. Visor muestra espacios detectados con polígonos
4. Usuario revisa y corrige espacios (editor)
5. Usuario confirma espacios → "Enviar a calculadora"
6. Espacios se mapean a inputs del motor de cálculo
7. Usuario completa cálculo y descarga reportes

## 📈 Roadmap

### ✅ Completado (Migración V2)

- [x] Fase 0: Infraestructura (Docker Compose, CI/CD)
- [x] Fase 1: Migración MariaDB → PostgreSQL
- [x] Fase 2: Plan Service (FastAPI + Celery + MinIO)
- [x] Fase 3: Pipeline DXF
- [x] Fase 4: Pipeline PDF
- [x] Fase 5: Frontend React 19
- [x] Fase 6: Visualización Interactiva (Fabric.js + D3.js)
- [x] Fase 7: AI/ML (OpenAI Vision fallback)

### Próximos Pasos

- [ ] Pruebas de usabilidad con usuarios reales
- [ ] YOLOv8 para detección de habitaciones (opcional)
- [ ] Dark mode en frontend
- [ ] Code splitting para reducir bundle size
- [ ] Deploy a staging/producción

## 🤝 Contribución

1. Fork el proyecto
2. Crear rama feature (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 🆘 Soporte

Para soporte técnico o preguntas:

- Crear un issue en GitHub
- Revisar la documentación en `/docs`
- Verificar el estado del proyecto en `ESTADO_PROYECTO.md`

---

**🎉 ¡Migración V2 Completada! Sistema funcional con reconocimiento automático de planos, cálculos eléctricos completos, y visualización interactiva.**
