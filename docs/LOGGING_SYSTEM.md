# Sistema de Logging Mejorado - Electridom

## 📋 Resumen Ejecutivo

Se ha implementado un sistema de logging completo y robusto para el proyecto Electridom, reemplazando el sistema básico anterior con una solución enterprise-grade que facilita la identificación y resolución de errores.

## 🎯 Objetivos Cumplidos

- ✅ **Centralización**: Un solo servicio de logging para toda la aplicación
- ✅ **Estructuración**: Logs en formato JSON con metadatos consistentes
- ✅ **Persistencia**: Logs guardados en archivos con rotación automática
- ✅ **Correlación**: Trace IDs y Request IDs para seguir requests completos
- ✅ **Sanitización**: Datos sensibles automáticamente ocultos
- ✅ **Performance**: Logging asíncrono sin impacto en rendimiento
- ✅ **Monitoreo**: Métricas y alertas automáticas

## 🏗️ Arquitectura del Sistema

### Backend (NestJS)

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Controllers   │───▶│  Interceptors    │───▶│  Logger Service │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │                        │
                                ▼                        ▼
                       ┌──────────────────┐    ┌─────────────────┐
                       │   Pino Logger    │    │   File Output   │
                       └──────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌──────────────────┐
                       │  Console Output  │
                       └──────────────────┘
```

### Frontend (Angular)

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Components    │───▶│  Logger Service  │───▶│  Console Logs   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │                        │
                                ▼                        ▼
                       ┌──────────────────┐    ┌─────────────────┐
                       │ HTTP Interceptor │    │ Backend Logs    │
                       └──────────────────┘    └─────────────────┘
```

## 🔧 Componentes Implementados

### 1. AppLoggerService (Backend)

**Ubicación**: `src/common/services/logger.service.ts`

**Características**:

- Logger centralizado usando Pino
- Métodos especializados por tipo de log
- Sanitización automática de datos sensibles
- Configuración por environment
- Logs a archivo y consola

**Métodos principales**:

```typescript
// Logs básicos
log(message: string, context?: LogContext, data?: any): void
error(message: string, trace?: string, context?: LogContext): void
warn(message: string, context?: LogContext, data?: any): void
debug(message: string, context?: LogContext, data?: any): void

// Logs especializados
logRequest(requestId: string, method: string, url: string, context?: LogContext): void
logResponse(requestId: string, method: string, url: string, statusCode: number, duration: number, context?: LogContext): void
logError(requestId: string, method: string, url: string, error: Error, context?: LogContext): void
logSecurity(userId: string, action: string, ip: string, context?: LogContext): void
logDatabase(operation: string, table: string, duration: number, context?: LogContext): void
logAI(provider: string, model: string, duration: number, tokens: number, context?: LogContext): void
```

### 2. LoggerService (Frontend)

**Ubicación**: `src/app/core/services/logger.service.ts`

**Características**:

- Logging centralizado para toda la aplicación Angular
- Diferentes niveles de log (ERROR, WARN, INFO, DEBUG)
- Envío automático de logs críticos al backend en producción
- Métodos especializados por tipo de operación

**Métodos principales**:

```typescript
// Logs básicos
error(message: string, context?: LogContext, data?: any): void
warn(message: string, context?: LogContext, data?: any): void
info(message: string, context?: LogContext, data?: any): void
debug(message: string, context?: LogContext, data?: any): void

// Logs especializados
logError(error: Error, context?: LogContext, data?: any): void
logHttpError(status: number, message: string, context?: LogContext, data?: any): void
logValidationError(field: string, message: string, context?: LogContext, data?: any): void
logUserAction(action: string, userId: string, context?: LogContext, data?: any): void
logApiCall(method: string, url: string, duration: number, context?: LogContext, data?: any): void
logComponentLifecycle(component: string, lifecycle: string, context?: LogContext, data?: any): void
logPerformance(operation: string, duration: number, context?: LogContext, data?: any): void
```

### 3. Interceptores de Logging

#### LoggingInterceptor (Backend)

**Ubicación**: `src/common/interceptors/logging.interceptor.ts`

**Funcionalidades**:

- Log automático de todos los requests/responses
- Cálculo de duración de requests
- Sanitización de headers y body sensibles
- Logs estructurados con metadatos completos

#### LoggingInterceptor (Frontend)

**Ubicación**: `src/app/core/interceptors/logging.interceptor.ts`

**Funcionalidades**:

- Intercepta todas las llamadas HTTP
- Genera Request IDs únicos
- Logs de requests, responses y errores
- Sanitización de datos sensibles

### 4. Filtros de Excepción

#### HttpExceptionFilter (Backend)

**Ubicación**: `src/common/filters/http-exception.filter.ts`

**Funcionalidades**:

- Captura global de excepciones HTTP
- Logs detallados de errores con stack traces
- Respuestas estructuradas de error
- Inclusión de Trace ID y Request ID

#### ErrorInterceptor (Backend)

**Ubicación**: `src/common/interceptors/error.interceptor.ts`

**Funcionalidades**:

- Intercepta errores de aplicación
- Extrae información de ubicación del error
- Logs estructurados con contexto completo
- Respuestas de error adaptadas por environment

## ⚙️ Configuración

### Variables de Entorno (Backend)

```bash
# Logging Configuration
LOG_LEVEL=debug                    # Nivel de log (debug, info, warn, error)
LOG_FILE_ENABLED=true             # Habilitar logs a archivo
LOG_FILE_PATH=./logs/app.log      # Ruta del archivo de log
LOG_FILE_MAX_SIZE=10m             # Tamaño máximo por archivo
LOG_FILE_MAX_FILES=5              # Número máximo de archivos
LOG_ROTATION_ENABLED=true         # Habilitar rotación automática
LOG_ROTATION_INTERVAL=1d          # Intervalo de rotación
LOG_ROTATION_MAX_FILES=30         # Archivos máximos a mantener
LOG_ALERTS_ENABLED=true           # Habilitar alertas automáticas
LOG_ERROR_THRESHOLD=10            # Umbral de errores para alertas
LOG_ERROR_TIME_WINDOW=300         # Ventana de tiempo para alertas (segundos)
```

### Configuración por Environment

#### Development

```typescript
{
  level: 'debug',
  transport: 'pino-pretty',  // Formato legible
  file: { enabled: true },
  rotation: { enabled: true }
}
```

#### Production

```typescript
{
  level: 'warn',
  transport: undefined,       // Formato JSON puro
  file: { enabled: true },
  rotation: { enabled: true }
}
```

## 📊 Formato de Logs

### Estructura del Log

```json
{
	"timestamp": "2024-01-15T10:30:45.123Z",
	"level": "info",
	"message": "Request completed",
	"requestId": "req_1705311045123_abc123def",
	"method": "POST",
	"url": "/api/v1/projects",
	"statusCode": 201,
	"duration": "245ms",
	"responseSize": "1024 bytes",
	"type": "response",
	"ip": "192.168.1.100",
	"userAgent": "Mozilla/5.0...",
	"data": {
		"projectId": "uuid-123",
		"status": "created"
	}
}
```

### Tipos de Log

1. **Request Logs**: Entrada de requests HTTP
2. **Response Logs**: Salida de responses HTTP
3. **Error Logs**: Errores de aplicación y HTTP
4. **Security Logs**: Eventos de seguridad y auditoría
5. **Database Logs**: Operaciones de base de datos
6. **AI Logs**: Operaciones de inteligencia artificial
7. **Performance Logs**: Métricas de rendimiento

## 🔍 Búsqueda y Análisis

### Comandos Útiles

```bash
# Ver logs en tiempo real
tail -f logs/app.log

# Buscar errores específicos
grep '"level":"error"' logs/app.log

# Buscar por Request ID
grep "req_1705311045123_abc123def" logs/app.log

# Buscar por endpoint
grep '"/api/v1/projects"' logs/app.log

# Buscar por usuario
grep '"userId":"user123"' logs/app.log

# Contar errores por hora
grep '"level":"error"' logs/app.log | cut -d'T' -f1,2 | sort | uniq -c
```

### Análisis con jq

```bash
# Filtrar solo errores
cat logs/app.log | jq 'select(.level == "error")'

# Agrupar por tipo de error
cat logs/app.log | jq 'select(.level == "error") | .message' | sort | uniq -c

# Extraer métricas de performance
cat logs/app.log | jq 'select(.duration) | {url: .url, duration: .duration, statusCode: .statusCode}'

# Buscar requests lentos (>1s)
cat logs/app.log | jq 'select(.duration | test("^[0-9]{4,}ms$"))'
```

## 🚨 Sistema de Alertas

### Configuración de Alertas

```typescript
alerts: {
  enabled: true,
  errorThreshold: 10,        // Errores antes de alertar
  timeWindow: 300            // Ventana de 5 minutos
}
```

### Tipos de Alertas

1. **Error Threshold**: Cuando se supera el umbral de errores
2. **Security Events**: Eventos de seguridad críticos
3. **Performance Degradation**: Requests que exceden umbrales de tiempo
4. **Database Issues**: Errores de conexión o consultas lentas

## 📈 Métricas y Monitoreo

### Métricas Automáticas

- **Request Count**: Total de requests por endpoint
- **Response Time**: Tiempo promedio de respuesta
- **Error Rate**: Porcentaje de errores por endpoint
- **User Activity**: Actividad por usuario
- **Security Events**: Eventos de seguridad por tipo

### Integración con Prometheus

Los logs se integran con el sistema de métricas existente para:

- Dashboards de monitoreo
- Alertas automáticas
- Análisis de tendencias
- SLA monitoring

## 🛠️ Mantenimiento

### Rotación de Logs

```bash
# Verificar archivos de log
ls -la logs/

# Comprimir logs antiguos
gzip logs/app.log.2024-01-14

# Limpiar logs muy antiguos (>30 días)
find logs/ -name "*.log.*" -mtime +30 -delete
```

### Monitoreo de Espacio

```bash
# Verificar uso de disco
du -sh logs/

# Verificar inodos
df -i logs/
```

### Backup de Logs

```bash
# Backup diario
tar -czf logs-backup-$(date +%Y%m%d).tar.gz logs/

# Backup a sistema externo
rsync -av logs/ backup-server:/backups/logs/
```

## 🔒 Seguridad

### Sanitización Automática

**Headers sensibles**:

- `authorization`
- `x-api-key`
- `cookie`

**Campos sensibles**:

- `password`
- `token`
- `secret`
- `key`
- `refreshToken`

### Auditoría de Seguridad

Todos los eventos de seguridad se registran automáticamente:

- Logins/Logouts
- Cambios de contraseña
- Cambios de roles
- Acceso a datos sensibles
- Generación/revocación de API keys

## 🧪 Testing

Verificar logging con los tests unitarios/e2e del backend (`npm run test:unit` / `npm run test:e2e` en `backend/`). El script ad-hoc `scripts/test-logging-system.js` fue eliminado.

### Casos de Prueba

1. **Requests exitosos**: Verificar logs de entrada/salida
2. **Requests con error**: Verificar logs de error estructurados
3. **Datos sensibles**: Verificar sanitización automática
4. **Performance**: Verificar logs de duración
5. **Correlación**: Verificar Request IDs consistentes

## 📚 Mejores Prácticas

### Uso del Logger

```typescript
// ✅ Correcto
this.logger.log(
	'User created successfully',
	{
		userId: user.id,
		action: 'user_creation',
	},
	{ userData: sanitizedUser }
);

// ❌ Incorrecto
console.log('User created:', user); // No estructurado
```

### Contexto de Logs

```typescript
// Siempre incluir contexto relevante
this.logger.error('Database connection failed', error.stack, {
	component: 'DatabaseService',
	method: 'connect',
	database: 'electridom',
	retryAttempt: 3,
});
```

### Niveles de Log

- **DEBUG**: Información detallada para desarrollo
- **INFO**: Información general de la aplicación
- **WARN**: Situaciones que requieren atención
- **ERROR**: Errores que afectan funcionalidad

## 🚀 Roadmap Futuro

### Próximas Mejoras

1. **Log Aggregation**: Centralización de logs en sistema externo
2. **Real-time Monitoring**: Dashboard en tiempo real
3. **Machine Learning**: Detección automática de anomalías
4. **Integration**: Conectores para ELK Stack, Splunk, etc.
5. **Compliance**: Logs para auditorías regulatorias

### Integraciones Planificadas

- **ELK Stack**: Elasticsearch + Logstash + Kibana
- **Splunk**: Análisis avanzado de logs
- **Datadog**: Monitoreo y alertas
- **New Relic**: Performance monitoring
- **Grafana**: Visualización de métricas

## 📞 Soporte

### Troubleshooting Común

1. **Logs no aparecen**: Verificar nivel de log y configuración
2. **Archivo de log no se crea**: Verificar permisos y ruta
3. **Performance degradada**: Verificar nivel de log y rotación
4. **Espacio de disco**: Verificar configuración de rotación

### Contacto

Para soporte técnico del sistema de logging:

- **Equipo**: Backend Team
- **Responsable**: DevOps Engineer
- **Documentación**: Este archivo + Swagger API docs

---

**Última actualización**: Enero 2024
**Versión**: 2.0.0
**Estado**: ✅ Implementado y en producción
