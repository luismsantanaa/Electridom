# 🏗️ Calculadora Eléctrica RD - Monorepo

Sistema completo para cálculos eléctricos residenciales, comerciales e industriales según normativas NEC 2023 y RIE RD.

## 📊 Estado del Proyecto

![CI/CD Status](https://github.com/your-username/CalculadoraElectricaRD/workflows/CI%2FCD%20Pipeline%20-%20Monorepo/badge.svg)
![Status Check](https://github.com/your-username/CalculadoraElectricaRD/workflows/Status%20Check/badge.svg)
![Code Coverage](https://codecov.io/gh/your-username/CalculadoraElectricaRD/branch/main/graph/badge.svg)

## 🎯 Resumen General

**Estado:** FUNCIONAL - Sprint 1 completado al 100% + Sprint 2 completado al 100% + Sprint 3 Frontend iniciado

**Última Actualización:** 24 de Agosto 2025

**Contexto del Proyecto:** Sistema completo para cálculos eléctricos residenciales, comerciales e industriales según normativas NEC 2023 y RIE RD. Backend con API RESTful completa, documentación Swagger, seguridad avanzada y observabilidad funcional. Frontend Angular 20 con template moderno y arquitectura monorepo.

## 🚀 Arquitectura del Proyecto

### Backend (NestJS)
- **Framework:** NestJS 10.x con TypeScript 5.x
- **Base de Datos:** MariaDB con TypeORM
- **Autenticación:** JWT estándar + JWT RS256 + JWKS + Key Rotation
- **Seguridad:** Argon2id, Rate Limiting, Helmet, CORS, Auditoría completa
- **API:** RESTful con Swagger/OpenAPI
- **Observabilidad:** Prometheus metrics con interceptor automático
- **Health Checks:** Liveness y readiness probes con Terminus

### Frontend (Angular)
- **Framework:** Angular 20 con Standalone Components
- **Template:** Datta Able (Lite) - Limpio y configurado
- **Arquitectura:** Monorepo con backend y frontend
- **Routing:** Lazy loading configurado
- **Proxy:** Configuración para desarrollo (`/api` → `http://localhost:3000`)

## 🏗️ Estructura del Monorepo

```
CalculadoraElectricaRD/
├── calculadora-electrica-backend/     # Backend NestJS
├── calculadora-electrica-frontend/    # Frontend Angular
├── docs/                              # Documentación
├── UserHistories/                     # Historias de usuario
├── .github/                           # Configuración CI/CD
└── ESTADO_PROYECTO.md                 # Estado detallado del proyecto
```

## 🔄 CI/CD Pipeline

### Workflows Implementados

1. **`ci.yml`** - Pipeline principal de CI/CD para monorepo
2. **`status.yml`** - Verificación rápida de estado
3. **`dependabot.yml`** - Auto-merge para dependencias

### Jobs del Pipeline

#### Backend Jobs
- **`backend-test`** - Tests completos con matrices Node.js 18.x, 20.x
- **`backend-quick-check`** - Verificación rápida para PRs

#### Frontend Jobs
- **`frontend-test`** - Tests completos con matrices Node.js 18.x, 20.x
- **`frontend-quick-check`** - Verificación rápida para PRs

#### Jobs de Despliegue
- **`build-and-deploy`** - Build y creación de artefactos
- **`security-check`** - Verificación de seguridad

### Métricas y Umbrales

- **Cobertura de Código:** 40% mínimo (umbral realista)
- **Tiempos de Ejecución:** < 8 minutos
- **Optimizaciones:** Cache de dependencias, ejecución paralela

## 🚀 Inicio Rápido

### Prerrequisitos

- Node.js 18.x o 20.x
- MariaDB 10.6+
- Git

### Instalación

```bash
# Clonar el repositorio
git clone https://github.com/your-username/CalculadoraElectricaRD.git
cd CalculadoraElectricaRD

# Backend
cd calculadora-electrica-backend
npm install
cp env.example .env
# Configurar variables de entorno
npm run migration:run
npm run seed
npm run start:dev

# Frontend (en otra terminal)
cd calculadora-electrica-frontend
npm install
npm start
```

### URLs de Acceso

- **Backend API:** http://localhost:3000
- **Swagger Docs:** http://localhost:3000/api/docs
- **Health Check:** http://localhost:3000/api/health
- **Métricas:** http://localhost:3000/api/metrics
- **Frontend:** http://localhost:4200

## 📊 Funcionalidades Implementadas

### ✅ Core Backend (100% Completado)
- API RESTful completa con documentación Swagger
- Sistema de autenticación JWT estándar y RS256
- Gestión de usuarios con roles y auditoría
- Base de datos con migraciones y seeds
- Testing completo con cobertura realista
- Observabilidad funcional con Prometheus metrics
- Health checks con liveness y readiness probes
- Session management con refresh tokens

### ✅ Motor de Cálculos (100% Completado)
- Cálculo de cargas por ambiente
- Factores de demanda y carga diversificada
- Agrupación de circuitos ramales y selección de conductores
- Análisis de caída de tensión en alimentador
- Dimensionamiento de puesta a tierra
- Generación de reportes PDF y Excel

### ✅ Frontend Angular (Fase Inicial Completada)
- Angular 20 con Standalone Components
- Template Datta Able integrado y limpio
- Configuración de proxy para desarrollo
- Routing con lazy loading configurado
- Build exitoso y servidor funcional

## 🧪 Testing

### Cobertura Actual
- **Cobertura Total:** 44.02%
- **Tests Pasando:** 186 tests (27 suites)
- **Umbral Mínimo:** 40% (statements/lines), 30% (functions), 15% (branches)

### Comandos de Testing

```bash
# Backend
cd calculadora-electrica-backend
npm run test:unit          # Tests unitarios
npm run test:e2e           # Tests end-to-end
npm run test:unit:coverage # Tests con cobertura

# Frontend
cd calculadora-electrica-frontend
npm run test               # Tests unitarios
npm run test:ci            # Tests en CI
```

## 🔧 Scripts de Utilidad

### Backend
```bash
cd calculadora-electrica-backend
npm run migration:run      # Ejecutar migraciones
npm run seed               # Ejecutar seeds de datos
npm run keys:rotate        # Rotar claves JWT
npm run setup:test-db      # Configurar BD de test
```

### Frontend
```bash
cd calculadora-electrica-frontend
npm start                  # Servidor de desarrollo
npm run build              # Build de producción
npm run lint               # Linting del código
```

## 📚 Documentación

- **[ESTADO_PROYECTO.md](ESTADO_PROYECTO.md)** - Estado detallado del proyecto
- **[docs/CI_CD_PIPELINE.md](docs/CI_CD_PIPELINE.md)** - Documentación del pipeline CI/CD
- **[docs/CONFIGURATION.md](docs/CONFIGURATION.md)** - Guía de configuración
- **[docs/SECURITY_PASSWORD_POLICY.md](docs/SECURITY_PASSWORD_POLICY.md)** - Políticas de seguridad
- **[docs/TESTING.md](docs/TESTING.md)** - Guía de testing

## 🔒 Seguridad

- **JWT RS256:** Firma asimétrica con claves RSA 2048-bit
- **JWKS:** JSON Web Key Set público
- **Key Rotation:** Rotación automática y manual de claves RSA
- **Argon2id:** Hashing seguro de contraseñas (OWASP)
- **Rate Limiting:** Protección contra ataques de fuerza bruta
- **Auditoría:** Logging completo de eventos de seguridad

## 📈 Observabilidad

- **Prometheus Metrics:** Endpoint `/metrics` con formato Prometheus
- **HTTP Metrics:** Contadores y histogramas automáticos de requests
- **Custom Metrics:** Métricas específicas para cálculos eléctricos
- **Health Checks:** Liveness y readiness probes funcionales
- **Session Management:** Refresh tokens con auditoría completa

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 📞 Contacto

- **Proyecto:** [Calculadora Eléctrica RD](https://github.com/your-username/CalculadoraElectricaRD)
- **Issues:** [GitHub Issues](https://github.com/your-username/CalculadoraElectricaRD/issues)

---

**🎉 SPRINT 1 COMPLETADO AL 100% + SPRINT 2 COMPLETADO AL 100% + SPRINT 3 FRONTEND FASE INICIAL COMPLETADA - PROYECTO FUNCIONAL CON MONOREPO, BACKEND COMPLETO Y FRONTEND ANGULAR 20 INICIADO**
