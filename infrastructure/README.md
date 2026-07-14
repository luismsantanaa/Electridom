# Infrastructure - Calculadora Eléctrica RD

Este directorio contiene la infraestructura y herramientas de desarrollo del monorepo.

## Estructura

```
infrastructure/
├── docker/              # Configuración Docker
│   ├── docker-compose.yml    # Orquestación de servicios
│   └── prometheus.yml        # Configuración de métricas
└── scripts/             # Scripts de desarrollo
    ├── start-dev.ps1         # Iniciar entorno de desarrollo
    └── stop-dev.ps1          # Detener entorno de desarrollo
```

## Uso

### Iniciar entorno de desarrollo

```powershell
.\infrastructure\scripts\start-dev.ps1
```

Esto inicia:
- Backend (NestJS) en puerto 3000
- Frontend (React) en puerto 4200
- Plan Service (FastAPI) en puerto 8000

### Detener entorno de desarrollo

```powershell
.\infrastructure\scripts\stop-dev.ps1
```

### Docker Compose

```bash
# Desde la raíz del proyecto
docker compose -f infrastructure/docker/docker-compose.yml up -d

# O crear un alias/symlink para mayor comodidad
```

## Notas

- **CI/CD**: Los workflows de GitHub Actions se mantienen en `.github/workflows/` (requisito de GitHub)
- **Docker Compose**: Las rutas en docker-compose.yml usan rutas relativas desde `infrastructure/docker/`
- **Scripts**: Los scripts de desarrollo calculan la ruta raíz automáticamente
