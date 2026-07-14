# Análisis de Arquitectura de Monorepo
## Calculadora Eléctrica RD

**Fecha:** 14 de julio de 2026  
**Estado:** Análisis completo con recomendaciones

---

## 1. Estructura Actual

```
CalculadoraElectricaRD/
├── calculadora-electrica-backend/    # NestJS 10 + TypeScript + PostgreSQL
├── calculadora-electrica-frontend/   # React 19 + Vite + TypeScript
├── plan-service/                     # Python 3.12 + FastAPI
├── docker-compose.yml               # Orquestación unificada
├── docs/                           # Documentación
├── src/                           # ⚠️ Código legacy (5 archivos Angular)
└── ...
```

### Problemas Identificados

1. **Código Legacy en Root**: La carpeta `src/` contiene 5 archivos legacy de Angular que no se usan (migrados a React)
2. **Naming Inconsistente**: 
   - `calculadora-electrica-backend` (prefijo "calculadora-electrica-")
   - `calculadora-electrica-frontend` (prefijo "calculadora-electrica-")
   - `plan-service` (sin prefijo)
3. **Falta de Estructura Clara**: No hay separación entre:
   - Aplicaciones (apps)
   - Librerías compartidas (libs)
   - Configuración compartida
   - Herramientas y scripts

---

## 2. Mejores Prácticas de Monorepo

### 2.1 Patrones Comunes

#### Patrón A: Apps + Libs (Nx Style)
```
monorepo/
├── apps/
│   ├── backend/           # NestJS
│   ├── frontend/          # React
│   └── plan-service/      # FastAPI
├── libs/
│   ├── shared-types/      # Tipos TypeScript compartidos
│   ├── api-client/        # Cliente HTTP compartido
│   └── ui-components/     # Componentes UI reutilizables
├── tools/                 # Scripts y herramientas
└── config/                # Configuración compartida
```

**Ventajas:**
- Separación clara entre aplicaciones y código compartido
- Fácil escalar con nuevas aplicaciones
- Permite compartir código entre servicios
- Mejor para equipos grandes

**Desventajas:**
- Requiere migración significativa
- Puede ser overkill para proyectos pequeños
- Complejidad adicional en configuración

#### Patrón B: Services + Shared (Microservicios)
```
monorepo/
├── services/
│   ├── backend/
│   ├── plan-service/
│   └── notification-service/
├── frontend/
├── shared/
│   ├── types/
│   ├── utils/
│   └── config/
└── infrastructure/
    ├── docker/
    └── k8s/
```

**Ventajas:**
- Claridad en arquitectura de microservicios
- Fácil de entender para equipos distribuidos
- Escalable horizontalmente

**Desventajas:**
- Similar al Patrón A pero más enfocado en servicios
- Puede ser confuso si hay múltiples frontends

#### Patrón C: Flat Structure (Actual con limpieza)
```
monorepo/
├── backend/               # NestJS
├── frontend/              # React
├── plan-service/          # FastAPI
├── shared/                # Código compartido (nuevo)
├── infrastructure/        # Docker, CI/CD, scripts
└── docs/
```

**Ventajas:**
- Simple y directo
- Fácil de entender
- Mínimo cambio requerido
- Bueno para proyectos pequeños-medios

**Desventajas:**
- Puede volverse desordenado si crece mucho
- Menos escalable que los otros patrones

### 2.2 Recomendaciones de la Industria

Según la investigación en monorepo.tools, Nx, y Turborepo:

1. **Separación Clara**: Apps vs Libs vs Config
2. **Naming Consistente**: Usar nombres descriptivos sin prefijos redundantes
3. **Código Compartido**: Crear paquetes/librerías para código común
4. **Independencia de Servicios**: Cada servicio debe poder desplegarse independientemente
5. **Documentación Centralizada**: Toda la documentación en un solo lugar
6. **CI/CD Unificado**: Pipeline que maneje todos los servicios

---

## 3. Análisis Específico para CalculadoraEléctricaRD

### 3.1 Estado Actual del Proyecto

- **Tamaño del Proyecto**: Mediano (3 servicios principales)
- **Equipo**: 1-2 desarrolladores (basado en commits)
- **Complejidad**: Moderada (backend + frontend + microservicio Python)
- **Código Compartido**: Mínimo (solo tipos y configuración)
- **Madurez**: Proyecto en desarrollo activo, migración V2 completada

### 3.2 Evaluación de Patrones

| Criterio | Patrón A (Apps+Libs) | Patrón B (Services+Shared) | Patrón C (Flat) |
|----------|----------------------|----------------------------|-----------------|
| Complejidad de Migración | Alta | Media | Baja |
| Escalabilidad | Alta | Alta | Media |
| Facilidad de Uso | Media | Media | Alta |
| Overhead de Configuración | Alto | Medio | Bajo |
| Adecuación para este proyecto | ❌ Overkill | ⚠️ Posible | ✅ Recomendado |

### 3.3 Recomendación: Patrón C Mejorado

Dado el tamaño del proyecto y el equipo, **recomiendo el Patrón C (Flat Structure) con mejoras**:

```
CalculadoraElectricaRD/
├── backend/                    # NestJS (renombrado de calculadora-electrica-backend)
├── frontend/                   # React (renombrado de calculadora-electrica-frontend)
├── plan-service/               # FastAPI (sin cambios)
├── shared/                     # NUEVO: Código compartido
│   ├── types/                  # Tipos TypeScript/Python compartidos
│   ├── api-contracts/          # Contratos de API (OpenAPI specs)
│   └── utils/                  # Utilidades comunes
├── infrastructure/             # NUEVO: Infraestructura
│   ├── docker/                 # Dockerfiles y compose
│   ├── ci-cd/                  # GitHub Actions, scripts
│   └── scripts/                # Scripts de desarrollo
├── docs/                       # Documentación (sin cambios)
├── tests/                      # NUEVO: Tests E2E e integración
│   ├── e2e/
│   └── integration/
└── .github/                    # Configuración GitHub (sin cambios)
```

---

## 4. Plan de Trabajo Propuesto

### Fase 1: Limpieza Inmediata (1-2 horas)

**Objetivo**: Eliminar código legacy y archivos innecesarios

- [ ] Eliminar carpeta `src/` (código Angular legacy)
- [ ] Eliminar `docker-compose.yml.backup`
- [ ] Eliminar `mariadb-custom.cnf` (migración a PostgreSQL completada)
- [ ] Eliminar `ollama-minimal.env` y `ollama.env` (si no se usan)
- [ ] Revisar y limpiar archivos sueltos en root:
  - `test-project.json`
  - `prometheus.yml` (¿se usa?)

**Comandos:**
```bash
# Eliminar código legacy
rm -rf src/

# Eliminar archivos innecesarios
rm docker-compose.yml.backup
rm mariadb-custom.cnf
rm test-project.json

# Revisar si se usan
rm ollama-minimal.env ollama.env  # Solo si no están referenciados
```

### Fase 2: Renombrado de Carpetas (2-3 horas)

**Objetivo**: Naming consistente y limpio

**Cambios:**
1. `calculadora-electrica-backend` → `backend`
2. `calculadora-electrica-frontend` → `frontend`
3. `plan-service` → `services/plan-service` (opcional, ver nota)

**Nota sobre plan-service**: 
- Opción A: Mover a `services/plan-service` para consistencia futura
- Opción B: Dejar en root como `plan-service` (más simple)

**Recomendación**: Opción B (dejar en root) por simplicidad, a menos que planees agregar más servicios Python.

**Pasos:**
```bash
# Renombrar carpetas
mv calculadora-electrica-backend backend
mv calculadora-electrica-frontend frontend

# Actualizar referencias en:
# - docker-compose.yml
# - .github/workflows/*.yml
# - AGENTS.md
# - README.md
# - scripts/*.sh
# - package.json (si hay workspaces)
```

**Archivos a actualizar:**
- `docker-compose.yml`: Cambiar paths de contexto
- `.github/workflows/*.yml`: Actualizar paths en jobs
- `AGENTS.md`: Actualizar estructura del proyecto
- `README.md`: Actualizar estructura y comandos
- `start-dev.ps1` y `stop-dev.ps1`: Actualizar paths
- Cualquier script que referencie las carpetas antiguas

### Fase 3: Crear Estructura Compartida (4-6 horas)

**Objetivo**: Preparar para código compartido entre servicios

**Crear estructura:**
```bash
mkdir -p shared/types
mkdir -p shared/api-contracts
mkdir -p shared/utils
```

**Contenido inicial:**

1. **shared/types/**: Tipos compartidos entre backend y frontend
   ```typescript
   // shared/types/project.types.ts
   export interface Project {
     id: string;
     name: string;
     status: 'ACTIVE' | 'ARCHIVED' | 'DRAFT';
     // ...
   }
   ```

2. **shared/api-contracts/**: Especificaciones OpenAPI
   ```yaml
   # shared/api-contracts/backend-api.yaml
   openapi: 3.0.0
   info:
     title: Calculadora Eléctrica API
     version: 1.0.0
   ```

3. **shared/utils/**: Utilidades comunes
   ```typescript
   // shared/utils/validation.ts
   export const validateEmail = (email: string): boolean => {
     // ...
   }
   ```

**Configuración:**
- Crear `shared/package.json` si es TypeScript
- Crear `shared/pyproject.toml` si es Python
- Configurar workspaces en package.json root (si aplica)

### Fase 4: Reorganizar Infraestructura (3-4 horas)

**Objetivo**: Centralizar configuración de infraestructura

**Crear estructura:**
```bash
mkdir -p infrastructure/docker
mkdir -p infrastructure/ci-cd
mkdir -p infrastructure/scripts
```

**Mover archivos:**
```bash
# Docker
mv docker-compose.yml infrastructure/docker/
mv prometheus.yml infrastructure/docker/  # Si se usa

# CI/CD
mv .github infrastructure/ci-cd/  # Opcional, puede quedarse en root

# Scripts
mv scripts/* infrastructure/scripts/
mv start-dev.ps1 infrastructure/scripts/
mv stop-dev.ps1 infrastructure/scripts/
```

**Nota**: Algunos prefieren dejar `docker-compose.yml` en root para facilidad de uso. Es una decisión de preferencia.

### Fase 5: Actualizar Documentación (2-3 horas)

**Objetivo**: Reflejar la nueva estructura en toda la documentación

**Archivos a actualizar:**
- [ ] `README.md`: Estructura del proyecto, comandos de inicio
- [ ] `AGENTS.md`: Estructura actualizada
- [ ] `docs/ESTADO_PROYECTO.md`: Actualizar estructura
- [ ] `docs/plan_ejecucion_migracion_v2.md`: Si referencia estructura antigua
- [ ] Comentarios en código que mencionen paths

### Fase 6: Pruebas y Validación (2-3 horas)

**Objetivo**: Asegurar que todo funciona después de la reorganización

**Checklist:**
- [ ] Backend arranca correctamente: `cd backend && npm run start:dev`
- [ ] Frontend arranca correctamente: `cd frontend && npm run dev`
- [ ] Plan Service arranca correctamente: `cd plan-service && uvicorn app.main:app --reload`
- [ ] Docker Compose funciona: `docker-compose up`
- [ ] Scripts de inicio funcionan: `.\infrastructure\scripts\start-dev.ps1`
- [ ] CI/CD pipeline pasa (si existe)
- [ ] Tests unitarios pasan en cada servicio
- [ ] Tests E2E pasan (si existen)

---

## 5. Cronograma Estimado

| Fase | Duración | Prioridad | Dependencias |
|------|----------|-----------|--------------|
| Fase 1: Limpieza | 1-2 horas | 🔴 Alta | Ninguna |
| Fase 2: Renombrado | 2-3 horas | 🔴 Alta | Fase 1 |
| Fase 3: Shared | 4-6 horas | 🟡 Media | Fase 2 |
| Fase 4: Infraestructura | 3-4 horas | 🟡 Media | Fase 2 |
| Fase 5: Documentación | 2-3 horas | 🟢 Baja | Fases 2-4 |
| Fase 6: Pruebas | 2-3 horas | 🔴 Alta | Todas |

**Total estimado**: 14-21 horas (2-3 días de trabajo)

---

## 6. Riesgos y Mitigaciones

### Riesgo 1: Romper referencias en CI/CD
**Mitigación**: Buscar y reemplazar exhaustivamente, probar en branch antes de merge

### Riesgo 2: Confusión del equipo con nuevos paths
**Mitigación**: Documentación clara, comunicar cambios, crear script de migración

### Riesgo 3: Perder historial de git
**Mitigación**: Usar `git mv` en lugar de `mv` para preservar historial

### Riesgo 4: Docker Compose no funciona
**Mitigación**: Actualizar todos los paths en docker-compose.yml, probar localmente

---

## 7. Recomendación Final

### ¿Reorganizar ahora o después?

**Recomendación**: Ejecutar **Fase 1 (Limpieza)** y **Fase 2 (Renombrado)** ahora, dejar el resto para después.

**Razones:**
1. **Fase 1 y 2 son críticas**: Eliminan código muerto y mejoran la claridad inmediatamente
2. **Fases 3-6 pueden esperar**: No son urgentes, se pueden hacer incrementalmente
3. **ROI inmediato**: Limpieza + renombrado = 80% del beneficio con 30% del esfuerzo
4. **Menor riesgo**: Cambios menores, más fáciles de revertir si algo sale mal

### Plan Mínimo Viable (PMV)

**Ejecutar solo Fases 1 y 2:**
1. Eliminar `src/` y archivos legacy
2. Renombrar `calculadora-electrica-backend` → `backend`
3. Renombrar `calculadora-electrica-frontend` → `frontend`
4. Actualizar referencias en docker-compose.yml, scripts, y documentación básica
5. Probar que todo funciona

**Tiempo**: 4-6 horas  
**Beneficio**: Estructura más limpia y clara sin gran inversión

---

## 8. Comandos de Migración (PMV)

```bash
# Fase 1: Limpieza
cd "D:\My Repos\Git Repos\CalculadoraElectricaRD"
Remove-Item -Recurse -Force src/
Remove-Item docker-compose.yml.backup
Remove-Item mariadb-custom.cnf
Remove-Item test-project.json

# Fase 2: Renombrado (usar git mv para preservar historial)
git mv calculadora-electrica-backend backend
git mv calculadora-electrica-frontend frontend

# Actualizar docker-compose.yml
# (editar manualmente o con script)

# Actualizar scripts
# (editar start-dev.ps1 y stop-dev.ps1)

# Commit
git add .
git commit -m "refactor: reorganize project structure - rename services and remove legacy code"
```

---

## 9. Conclusión

La estructura actual es **funcional pero puede mejorarse**. La reorganización propuesta sigue las mejores prácticas de la industria y prepara el proyecto para escalar.

**Recomendación inmediata**:
1. ✅ Ejecutar Fases 1 y 2 (limpieza + renombrado)
2. ⏸️ Dejar Fases 3-6 para cuando haya más tiempo o necesidad
3. 📝 Documentar los cambios en README.md y AGENTS.md

**Beneficios esperados**:
- Estructura más clara y mantenible
- Naming consistente
- Sin código legacy
- Preparado para crecer

---

**¿Proceder con el Plan Mínimo Viable (Fases 1 y 2)?**
