# 🚀 Electridom - Calculadora Eléctrica RD

Sistema completo para cálculos eléctricos residenciales, comerciales e industriales según normativas NEC 2023 y RIE RD.

## 📊 Estado del Proyecto

**✅ Sprint 1-17 Completados (100%) + Error 500 Solucionado (100%)**

- Backend NestJS completo con motor de cálculos eléctricos
- Frontend Angular 20 con template moderno
- Integración de IA con OpenAI
- Servicios de cálculo avanzados (Sprint 16)
- IA Explicativa y Validación Normativa (Sprint 17)
- Monorepo configurado y funcional
- CI/CD pipeline operativo
- Base de datos sincronizada
- Sistema de logging mejorado con Pino
- 162 tests de cálculo pasando
- Endpoint de creación de proyectos funcionando correctamente

## 🏗️ Arquitectura

```
Electridom/
├── calculadora-electrica-backend/    # API NestJS
├── calculadora-electrica-frontend/   # Angular 20
├── docs/                            # Documentación
├── scripts/                         # Scripts de utilidad
└── docker-compose.yml              # Orquestación Docker
```

## 🐳 Despliegue con Docker (Recomendado)

### Prerrequisitos

- Docker Desktop
- Docker Compose

### Instalación Rápida

1. **Clonar el repositorio:**

```bash
git clone <repository-url>
cd Electridom
```

2. **Ejecutar script de configuración:**

```powershell
# Windows PowerShell
.\scripts\docker-setup.ps1
```

O manualmente:

```bash
# Crear archivo .env
cp env.example .env
# Editar .env y configurar OPENAI_API_KEY

# Construir y ejecutar
docker-compose up -d
```

### URLs de Acceso

- **Frontend:** http://localhost
- **Backend API:** http://localhost:3000
- **API Docs:** http://localhost:3000/api/docs
- **Adminer (DB):** http://localhost:8080
- **Prometheus:** http://localhost:9090

### Comandos Útiles

```bash
# Ver logs
docker-compose logs -f

# Detener servicios
docker-compose down

# Reconstruir
docker-compose build --no-cache

# Verificar estado
docker-compose ps
```

## 🛠️ Desarrollo Local

### Backend (NestJS)

```bash
cd calculadora-electrica-backend

# Instalar dependencias
npm install

# Configurar variables de entorno
cp env.example .env
# Editar .env con tus configuraciones

# Ejecutar migraciones
npm run migration:run

# Ejecutar seeds
npm run seed

# Iniciar en desarrollo
npm run start:dev
```

### Frontend (Angular)

```bash
cd calculadora-electrica-frontend

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm start
```

## 🔧 Configuración

### Variables de Entorno

Crear archivo `.env` en la raíz del proyecto:

```env
# OpenAI Configuration
OPENAI_API_KEY=your-openai-api-key-here
OPENAI_MODEL=gpt-4o-mini

# Database Configuration
DATABASE_HOST=mariadb
DATABASE_PORT=3306
DATABASE_USERNAME=electridom
DATABASE_PASSWORD=electridom
DATABASE_NAME=electridom

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=900s

# Application Configuration
NODE_ENV=production
PORT=3000
CORS_ORIGIN=*
```

## 📚 Documentación

- [API Documentation](http://localhost:3000/api/docs) - Swagger UI
- [Estado del Proyecto](ESTADO_PROYECTO.md) - Estado detallado
- [Configuración](docs/CONFIGURATION.md) - Guías de configuración
- [Testing](docs/TESTING.md) - Guías de testing
- [CI/CD](docs/CI_CD_PIPELINE.md) - Pipeline de integración continua

## �� Testing

```bash
# Backend tests
cd calculadora-electrica-backend
npm run test:unit
npm run test:e2e

# Frontend tests
cd calculadora-electrica-frontend
npm run test
```

## 📊 Métricas y Monitoreo

- **Prometheus:** http://localhost:9090
- **Health Checks:** http://localhost:3000/api/health
- **Métricas:** http://localhost:3000/api/metrics

## 🔒 Seguridad

- JWT RS256 con rotación de claves
- Rate limiting configurado
- CORS configurado
- Headers de seguridad
- Validación de entrada con AJV

## 🚀 Funcionalidades

### Backend

- ✅ Motor de cálculos eléctricos completo
- ✅ API RESTful con documentación Swagger
- ✅ Autenticación JWT RS256 + JWKS
- ✅ Integración con OpenAI
- ✅ Base de datos MariaDB con migraciones
- ✅ Métricas Prometheus
- ✅ Health checks
- ✅ Rate limiting
- ✅ Auditoría completa

### Frontend

- ✅ Angular 20 con Standalone Components
- ✅ Template Datta Able moderno
- ✅ Componentes de IA integrados
- ✅ Upload de archivos Excel
- ✅ Validación client-side
- ✅ Responsive design
- ✅ Lazy loading

### IA Integration

- ✅ Análisis inteligente de cálculos
- ✅ Procesamiento de archivos Excel
- ✅ Prompts especializados
- ✅ Guardrails de seguridad

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

**🎉 ¡Electridom está listo para producción!**
