# Calculadora Eléctrica RD - Backend API

<p align="center">
  <img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" />
  <br>
  <strong>API REST para Cálculos Eléctricos según Normas RIE RD/NEC</strong>
</p>

<p align="center">
  <a href="https://nestjs.com" target="_blank"><img src="https://img.shields.io/badge/NestJS-10.0-red.svg" alt="NestJS" /></a>
  <a href="https://www.typescriptlang.org" target="_blank"><img src="https://img.shields.io/badge/TypeScript-5.0-blue.svg" alt="TypeScript" /></a>
  <a href="https://mariadb.org" target="_blank"><img src="https://img.shields.io/badge/MariaDB-11.0-orange.svg" alt="MariaDB" /></a>
  <a href="https://typeorm.io" target="_blank"><img src="https://img.shields.io/badge/TypeORM-0.3-green.svg" alt="TypeORM" /></a>
  <a href="https://swagger.io" target="_blank"><img src="https://img.shields.io/badge/Swagger-4.0-brightgreen.svg" alt="Swagger" /></a>
  <a href="https://github.com/your-username/calculadora-electrica-backend/actions" target="_blank"><img src="https://github.com/your-username/calculadora-electrica-backend/workflows/CI%2FCD%20Pipeline/badge.svg" alt="CI/CD Status" /></a>
  <a href="https://codecov.io/gh/your-username/calculadora-electrica-backend" target="_blank"><img src="https://codecov.io/gh/your-username/calculadora-electrica-backend/branch/main/graph/badge.svg" alt="Code Coverage" /></a>
</p>

## 🎯 **Descripción**

API REST completa para la **Calculadora Eléctrica de República Dominicana** desarrollada con NestJS, TypeORM y MariaDB. El sistema implementa cálculos eléctricos residenciales según las normas **RIE RD** (Reglamento de Instalaciones Eléctricas) y **NEC** (National Electrical Code).

## ✅ **Estado del Proyecto**

- **Funcionalidad Core**: ✅ **100% Implementada**
- **Seguridad Básica**: ✅ **100% Implementada** (Fase 1)
- **Documentación API**: ✅ **100% Implementada**
- **Testing**: ✅ **100% Completado** - Todos los tests pasando (186 tests, 27 suites) con cobertura 44.02%
- **CI/CD Pipeline**: ✅ **100% Implementado** - GitHub Actions con matrices Node LTS y umbral de cobertura realista

## 🚀 **Características Principales**

### **⚡ Cálculos Eléctricos**

- **Motor de reglas data-driven** para normas RIE RD/NEC
- **Cálculo de potencia demandada** por ambiente
- **Distribución automática de circuitos** (ILU/TOM)
- **Validación de superficies y consumos**
- **Propuesta de circuitos** con calibres y breakers

### **📊 Gestión de Proyectos**

- **CRUD completo** de proyectos eléctricos
- **Versionado automático** con snapshots
- **Firma de reglas** para trazabilidad
- **Exportación de proyectos**

### **🧮 Motor de Reglas Normativas**

- **Reglas configurables** (RIE RD/NEC)
- **Cache optimizado** para performance
- **Administración completa** de reglas
- **Historial de cambios** con auditoría

### **🔐 Seguridad Implementada**

- **Rate limiting** global y específico
- **Helmet** para headers de seguridad
- **CORS restrictivo** configurable
- **Sistema de auditoría** completo
- **JWT con bcrypt** para autenticación

## 🛠️ **Tecnologías Utilizadas**

### **Framework y Lenguaje**

- **NestJS 10.x** - Framework de Node.js para aplicaciones escalables
- **TypeScript 5.x** - Tipado estático para mayor robustez

### **Base de Datos y ORM**

- **MariaDB 10.x** - Sistema de gestión de base de datos relacional
- **TypeORM 0.3.x** - ORM para TypeScript con soporte completo

### **Autenticación y Seguridad**

- **@nestjs/jwt** - Manejo de tokens JWT
- **@nestjs/passport** - Estrategias de autenticación
- **bcrypt** - Hashing seguro de contraseñas
- **@nestjs/throttler** - Rate limiting
- **helmet** - Headers de seguridad HTTP

### **Validación y Documentación**

- **class-validator** - Validación de DTOs
- **@nestjs/swagger** - Documentación automática de API

## 📦 **Módulos Implementados**

### **1. 🔐 AuthModule - Autenticación**

- `POST /auth/register` - Registro de usuarios
- `POST /auth/login` - Inicio de sesión con JWT
- `GET /auth/profile` - Perfil del usuario

### **2. ⚡ CalculosModule - Cálculos Eléctricos**

- `POST /v1/calculations/preview` - Preview de instalación eléctrica

### **3. 📊 ProjectsModule - Gestión de Proyectos**

- `POST /v1/projects` - Crear proyecto
- `GET /v1/projects` - Listar proyectos
- `POST /v1/projects/:id/versions` - Crear versión
- `GET /v1/projects/:id/export` - Exportar proyecto

### **4. 🧮 RulesModule - Motor de Reglas**

- `GET /v1/rules/active` - Obtener reglas activas
- `GET /v1/rules/:ruleSetId` - Reglas específicas

### **5. 🔧 RulesAdminModule - Administración**

- `POST /v1/rulesets` - Crear conjunto de reglas
- `PUT /v1/rulesets/:id/rules` - Actualizar reglas
- `POST /v1/rulesets/:id/publish` - Publicar reglas
- `GET /v1/rulesets/:idA/diff/:idB` - Comparar conjuntos

### **6. 👥 UsersModule - Usuarios**

- `GET /users` - Listar usuarios
- `PATCH /users/:id` - Actualizar usuario
- `POST /users/reset-password` - Reset contraseña

### **7. 🏠 AmbienteModule - Ambientes**

- CRUD completo de ambientes de instalación

### **8. 🔌 CargasModule - Cargas Eléctricas**

- CRUD completo de cargas eléctricas

### **9-11. Tipos\* - Catálogos**

- CRUD de tipos de instalación, ambientes y artefactos

## 🗄️ **Base de Datos**

### **Entidades Principales**

- **User** - Usuarios del sistema con roles
- **Project** - Proyectos eléctricos
- **ProjectVersion** - Versiones con snapshots
- **RuleSet** - Conjuntos de reglas normativas
- **NormRule** - Reglas individuales
- **AuditLog** - Logs de auditoría
- **Ambiente** - Ambientes de instalación
- **Cargas** - Cargas eléctricas

### **Migraciones**

- ✅ Todas las tablas creadas
- ✅ Índices optimizados
- ✅ Relaciones configuradas
- ✅ Datos iniciales (seeds)

## 🔒 **Seguridad Implementada**

### **✅ Fase 1: Seguridad Básica - COMPLETADA**

#### **Rate Limiting**

- **Global**: 100 requests/minuto
- **Auth Login**: 5 intentos/5 minutos
- **Auth Register**: 3 intentos/5 minutos

#### **Headers de Seguridad**

- **Helmet** configurado con CSP
- **CORS restrictivo** con origins configurables
- **Cookies seguras** preparadas

#### **Sistema de Auditoría**

- **AuditLog** con eventos críticos
- **Trazabilidad** de IP y User-Agent
- **TraceID** para seguimiento

#### **Autenticación**

- **JWT** con bcrypt
- **Roles**: ADMIN, CLIENTE, AUDITOR
- **Estados**: ACTIVO, INACTIVO, BLOQUEADO

## 📋 **Prerrequisitos**

- **Node.js** 20.x o superior
- **npm** 10.x o superior
- **MariaDB** 11.x o superior
- **Git** para clonar el repositorio

## 🚀 **Instalación Rápida**

### **1. Clonar Repositorio**

```bash
git clone https://github.com/luismsantanaa/CalculadoraElectrica_2.0.git
cd CalculadoraElectrica_2.0
```

### **2. Instalar Dependencias**

```bash
npm install
```

### **3. Configurar Variables de Entorno**

```bash
cp .env.example .env
```

Editar `.env`:

```env
# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=electridom
DB_PASS=electridom
DB_NAME=electridom

# Application
PORT=3000
API_PREFIX=api

# Security
THROTTLE_TTL=60
THROTTLE_LIMIT=100
AUTH_THROTTLE_LIMIT=5

# Rules Engine
RULE_CACHE_TTL_MS=60000
APPLY_MIGRATIONS_ON_STARTUP=true
```

### **4. Ejecutar Migraciones y Seeds**

```bash
npm run migration:run
npm run seed
```

### **5. Iniciar Desarrollo**

```bash
npm run start:dev
```

## 📖 **Documentación API**

- **Swagger UI**: http://localhost:3000/api/docs
- **API JSON**: http://localhost:3000/api/docs-json
- **Health Check**: http://localhost:3000/api

## 🧪 **Testing**

```bash
# Unit Tests
npm test

# E2E Tests
npm run test:e2e

# Coverage
npm run test:cov
```

## 🐳 **Docker**

### **Desarrollo**

```bash
docker-compose up -d
```

### **Producción**

```bash
docker build -t electridom-api .
docker run -p 3000:3000 electridom-api
```

## 📊 **Scripts Disponibles**

```bash
# Desarrollo
npm run start:dev          # Desarrollo con hot reload
npm run start:debug        # Desarrollo con debugger

# Producción
npm run build              # Construir aplicación
npm run start:prod         # Iniciar producción

# Base de Datos
npm run migration:generate # Generar migración
npm run migration:run      # Ejecutar migraciones
npm run seed               # Ejecutar seeds

# Testing
npm test                   # Unit tests
npm run test:e2e           # E2E tests
npm run test:cov           # Coverage

# Calidad
npm run lint               # ESLint
npm run format             # Prettier
```

## 🏗️ **Arquitectura**

```
src/
├── common/                 # Recursos compartidos
│   ├── entities/          # BaseAuditEntity
│   ├── services/          # AuditService
│   ├── guards/            # Guards de seguridad
│   └── interceptors/      # Interceptors
├── config/                # Configuraciones
├── modules/               # Módulos de negocio
│   ├── auth/             # Autenticación
│   ├── calculos/         # Cálculos eléctricos
│   ├── projects/         # Gestión de proyectos
│   ├── rules/            # Motor de reglas
│   ├── rules-admin/      # Administración de reglas
│   └── users/            # Gestión de usuarios
└── database/
    ├── migrations/        # Migraciones TypeORM
    └── seeds/            # Datos iniciales
```

## 📈 **Próximos Pasos**

### **Prioridad ALTA**

- [ ] Completar testing (e2e)
- [ ] Configuración de producción
- [ ] Monitoreo y logs

### **Prioridad MEDIA**

- [ ] Fase 2 de Seguridad (Argon2)
- [ ] RBAC avanzado
- [ ] Optimización de performance

### **Prioridad BAJA**

- [ ] Fase 3-4 de Seguridad
- [ ] Microservicios
- [ ] CI/CD avanzado

## 🤝 **Contribución**

1. Fork el proyecto
2. Crear rama feature (`git checkout -b feature/NuevaFuncionalidad`)
3. Commit cambios (`git commit -m 'feat: Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/NuevaFuncionalidad`)
5. Abrir Pull Request

## 📄 **Licencia**

Este proyecto está bajo la **Licencia MIT**. Ver el archivo `LICENSE` para más detalles.

## 🆘 **Soporte**

- **Documentación**: [Swagger UI](http://localhost:3000/api/docs)
- **Issues**: [GitHub Issues](https://github.com/luismsantanaa/CalculadoraElectrica_2.0/issues)
- **Estado del Proyecto**: [ESTADO_PROYECTO.md](./ESTADO_PROYECTO.md)

---

**⚡ Desarrollado con ❤️ para la comunidad eléctrica de República Dominicana**

_Cumpliendo con las normas RIE RD y NEC para instalaciones eléctricas seguras y eficientes._
