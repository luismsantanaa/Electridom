# 🔧 Configuración de Entorno - Calculadora Eléctrica RD

## 📋 Información General

**Versión:** 1.0  
**Fecha:** Enero 2025  
**Historia de Usuario:** HU-CONF-01  
**Estado:** Implementado  

## 🎯 Objetivo

Establecer un sistema robusto de configuración de entorno con validación estricta, perfiles diferenciados y defaults seguros para los despliegues `dev/stage/prod`.

---

## 🏗️ Arquitectura de Configuración

### **Componentes Principales**

1. **Validación Estricta** - `src/config/env.validation.ts`
2. **Configuración Modular** - `src/config/env.config.ts`
3. **Perfiles de Ambiente** - Configuración específica por entorno
4. **Archivo de Ejemplo** - `env.example` documentado

### **Flujo de Validación**

```
.env → ConfigModule → validate() → EnvironmentVariables → App
```

---

## 📁 Estructura de Archivos

```
src/config/
├── env.validation.ts    # Esquema de validación con class-validator
├── env.config.ts        # Configuración modular por secciones
└── index.ts            # Exportaciones centralizadas

docs/
└── CONFIGURATION.md    # Esta documentación

env.example             # Plantilla de variables de entorno
```

---

## 🔧 Variables de Entorno

### **Variables Obligatorias**

| Variable | Tipo | Descripción | Ejemplo |
|----------|------|-------------|---------|
| `NODE_ENV` | enum | Ambiente de ejecución | `development` |
| `PORT` | number | Puerto del servidor | `3000` |
| `JWT_SECRET` | string | Clave secreta JWT | `super-secret-key` |
| `JWT_EXPIRES_IN` | string | Expiración JWT | `24h` |
| `DATABASE_HOST` | string | Host de BD | `localhost` |
| `DATABASE_PORT` | number | Puerto de BD | `3306` |
| `DATABASE_USERNAME` | string | Usuario de BD | `electridom` |
| `DATABASE_PASSWORD` | string | Contraseña de BD | `password` |
| `DATABASE_NAME` | string | Nombre de BD | `electridom` |

### **Variables Opcionales**

| Variable | Tipo | Default | Descripción |
|----------|------|---------|-------------|
| `LOG_LEVEL` | enum | `info` | Nivel de logging |
| `API_KEY` | string | - | Clave para endpoints admin |
| `CORS_ORIGIN` | string | `*` | Origen CORS |
| `SSL_KEY_PATH` | string | - | Ruta clave SSL |
| `SSL_CERT_PATH` | string | - | Ruta certificado SSL |
| `RATE_LIMIT_TTL` | number | `60` | TTL rate limiting |
| `RATE_LIMIT_LIMIT` | number | `100` | Límite rate limiting |
| `SWAGGER_TITLE` | string | `Calculadora Eléctrica RD API` | Título Swagger |
| `SWAGGER_DESCRIPTION` | string | `API para cálculos...` | Descripción Swagger |
| `SWAGGER_VERSION` | string | `2.0.0` | Versión Swagger |

---

## 🌍 Perfiles de Ambiente

### **Development (development)**

```bash
NODE_ENV=development
LOG_LEVEL=debug
CORS_ORIGIN=*
DATABASE_SYNCHRONIZE=true
DATABASE_LOGGING=true
```

**Características:**
- ✅ Logging detallado (debug)
- ✅ CORS abierto (*)
- ✅ Sincronización automática de BD
- ✅ Logging de queries SQL
- ✅ Seeds automáticos

### **Staging (staging)**

```bash
NODE_ENV=staging
LOG_LEVEL=info
CORS_ORIGIN=https://staging.calculadora-electrica.com
DATABASE_SYNCHRONIZE=false
DATABASE_LOGGING=false
```

**Características:**
- ✅ Logging informativo
- ✅ CORS restringido a staging
- ✅ Sin sincronización automática
- ✅ Sin logging de SQL
- ✅ Configuración similar a producción

### **Production (production)**

```bash
NODE_ENV=production
LOG_LEVEL=warn
CORS_ORIGIN=https://calculadora-electrica.com
DATABASE_SYNCHRONIZE=false
DATABASE_LOGGING=false
SSL_KEY_PATH=/etc/ssl/private/server.key
SSL_CERT_PATH=/etc/ssl/certs/server.crt
```

**Características:**
- ✅ Logging mínimo (warn/error)
- ✅ CORS restringido a dominio
- ✅ Sin sincronización automática
- ✅ SSL habilitado
- ✅ Máxima seguridad

---

## 🔒 Validación de Seguridad

### **Validación Estricta**

La aplicación **falla al arrancar** si faltan variables críticas:

```typescript
// Ejemplo de error de validación
❌ Configuración de entorno inválida:
JWT_SECRET must be a string; DATABASE_HOST must be a string

💡 Asegúrate de que todas las variables requeridas estén definidas en tu archivo .env
```

### **Variables Críticas Validadas**

1. **JWT_SECRET** - Obligatorio y no puede ser default
2. **DATABASE_*** - Todas las variables de conexión
3. **NODE_ENV** - Debe ser enum válido
4. **PORT** - Debe ser número válido

### **Defaults Seguros**

- **Development:** Configuración permisiva para desarrollo
- **Staging:** Configuración balanceada
- **Production:** Configuración restrictiva

---

## 🚀 Configuración por Ambiente

### **Development**

```bash
# .env.development
NODE_ENV=development
PORT=3000
LOG_LEVEL=debug
JWT_SECRET=dev-secret-key-change-in-production
JWT_EXPIRES_IN=24h
DATABASE_HOST=localhost
DATABASE_PORT=3306
DATABASE_USERNAME=electridom
DATABASE_PASSWORD=electridom
DATABASE_NAME=electridom
CORS_ORIGIN=*
```

### **Staging**

```bash
# .env.staging
NODE_ENV=staging
PORT=3000
LOG_LEVEL=info
JWT_SECRET=staging-secret-key-change-in-production
JWT_EXPIRES_IN=24h
DATABASE_HOST=staging-db.example.com
DATABASE_PORT=3306
DATABASE_USERNAME=staging_user
DATABASE_PASSWORD=secure_password
DATABASE_NAME=electridom_staging
CORS_ORIGIN=https://staging.calculadora-electrica.com
```

### **Production**

```bash
# .env.production
NODE_ENV=production
PORT=3000
LOG_LEVEL=warn
JWT_SECRET=super-secure-production-key-256-bits
JWT_EXPIRES_IN=24h
DATABASE_HOST=prod-db.example.com
DATABASE_PORT=3306
DATABASE_USERNAME=prod_user
DATABASE_PASSWORD=very_secure_password
DATABASE_NAME=electridom_production
CORS_ORIGIN=https://calculadora-electrica.com
SSL_KEY_PATH=/etc/ssl/private/server.key
SSL_CERT_PATH=/etc/ssl/certs/server.crt
```

---

## 🔧 Configuración de Módulos

### **ConfigModule Setup**

```typescript
ConfigModule.forRoot({
  isGlobal: true,
  load: [
    envConfig,
    jwtConfig,
    databaseConfig,
    securityConfig,
    rateLimitConfig,
    swaggerConfig
  ],
  validate, // Validación estricta
})
```

### **Uso en Servicios**

```typescript
@Injectable()
export class MyService {
  constructor(
    private configService: ConfigService,
  ) {}

  getDatabaseConfig() {
    return {
      host: this.configService.get('database.host'),
      port: this.configService.get('database.port'),
      // ...
    };
  }
}
```

---

## 🧪 Testing de Configuración

### **Validación Automática**

```bash
# Test de validación de configuración
npm run test:config

# Test de variables de entorno
npm run test:env
```

### **Scripts de Validación**

```json
{
  "scripts": {
    "validate:env": "node scripts/validate-env.js",
    "test:config": "jest --testPathPattern=config",
    "check:env": "npm run validate:env && npm run test:config"
  }
}
```

---

## 🚨 Procedimientos de Incidencia

### **Error de Validación**

**Síntoma:** Aplicación no arranca con error de validación

**Solución:**
1. Verificar archivo `.env` existe
2. Comprobar variables obligatorias
3. Validar tipos de datos
4. Revisar formato de valores

### **Configuración Incorrecta**

**Síntoma:** Comportamiento inesperado en runtime

**Solución:**
1. Verificar perfil de ambiente
2. Comprobar valores por defecto
3. Validar configuración específica
4. Revisar logs de configuración

---

## 📊 Monitoreo y Logs

### **Logs de Configuración**

```typescript
// Al arrancar la aplicación
🌍 Environment: DEVELOPMENT
📝 Log Level: DEBUG
💾 Database: MariaDb (electridom)
🔒 Security: Helmet + Rate Limiting + CORS enabled
```

### **Métricas de Configuración**

- ✅ Variables validadas al arranque
- ✅ Configuración por ambiente aplicada
- ✅ Defaults seguros configurados
- ✅ Validación estricta habilitada

---

## 🔄 Migración desde Configuración Anterior

### **Cambios Requeridos**

1. **Renombrar variables:**
   - `DB_HOST` → `DATABASE_HOST`
   - `DB_PORT` → `DATABASE_PORT`
   - `DB_USER` → `DATABASE_USERNAME`
   - `DB_PASS` → `DATABASE_PASSWORD`
   - `DB_NAME` → `DATABASE_NAME`

2. **Agregar variables obligatorias:**
   - `JWT_SECRET` (obligatorio)
   - `NODE_ENV` (obligatorio)

3. **Actualizar archivo .env:**
   ```bash
   # Copiar env.example
   cp env.example .env
   
   # Ajustar valores según ambiente
   ```

---

## 📚 Referencias

### **Documentación Relacionada**

- [Historia de Usuario HU-CONF-01](../UserHistory-Electridom/HU-CONF-01.md)
- [Validación de Entorno](../src/config/env.validation.ts)
- [Configuración Modular](../src/config/env.config.ts)
- [Plantilla de Variables](../env.example)

### **Bibliotecas Utilizadas**

- **@nestjs/config:** ^3.1.1 - Configuración de NestJS
- **class-validator:** ^0.14.0 - Validación de esquemas
- **class-transformer:** ^0.5.1 - Transformación de objetos

### **Estándares Cumplidos**

- ✅ **12-Factor App** - Configuración en entorno
- ✅ **OWASP Security** - Validación de configuración
- ✅ **NestJS Best Practices** - ConfigModule patterns

---

## 🎖️ Certificación de Cumplimiento

**Esta implementación certifica:**

✅ **Criterio 1:** Validación estricta en arranque  
✅ **Criterio 2:** Perfiles dev/stage/prod diferenciados  
✅ **Criterio 3:** Defaults seguros configurados  
✅ **Criterio 4:** Documentación completa  
✅ **Criterio 5:** Validación automatizada  

**Implementación verificada el:** Enero 2025  
**Desarrollador:** Equipo Calculadora Eléctrica RD  
**Review de Configuración:** ✅ Aprobado

---

## 📞 Soporte

Para consultas sobre configuración o reportar problemas:

- **Equipo de Desarrollo:** calculadora-electrica-dev@team.com
- **DevOps:** devops@calculadora-electrica.com
- **Documentación:** [GitHub Issues](https://github.com/luismsantanaa/ElectricCalculator2.0/issues)

---

**📄 Documento controlado - No modificar sin autorización del equipo de DevOps**
