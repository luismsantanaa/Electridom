# Deudas Técnicas Pendientes - Electridom

## Estado Actual del Proyecto

### ✅ **Servicios Funcionando**
- **Frontend Angular**: Compilando correctamente en puerto 4200
- **Backend NestJS**: Ejecutándose en puerto 3000
- **MariaDB**: Contenedor activo (aunque marcado como unhealthy)
- **Open WebUI**: Funcionando en puerto 3001

### ❌ **Problemas Identificados**

## 1. **Ollama - Modelos de IA**

### Problema
- Ollama está en modo "low vram" (sin GPU compatible)
- Memoria disponible limitada: 1.9 GiB de 3.8 GiB total
- Error 500 al intentar descargar modelos
- Timeout en descargas de modelos grandes

### Soluciones Propuestas
1. **Modelos más pequeños**: Usar modelos de 1B-3B parámetros
2. **Optimización de memoria**: Configurar Ollama para usar menos RAM
3. **Descarga manual**: Descargar modelos desde Open WebUI
4. **Fallback a OpenAI**: Usar OpenAI como proveedor principal temporalmente

### Acciones Inmediatas
- [ ] Configurar Ollama con parámetros de memoria optimizados
- [ ] Descargar modelo `llama3.1:1b-instruct-q4_K_M` manualmente
- [ ] Verificar conectividad de red para descargas
- [ ] Implementar fallback automático a OpenAI

## 2. **Frontend - Scripts de NPM**

### Problema
- Error "Missing script: start" en algunos contextos
- Dependencias de Chart.js y otras librerías recién instaladas

### Solución
- [x] Verificar package.json (script start existe)
- [x] Frontend compilando correctamente
- [ ] Verificar que todas las dependencias estén correctamente instaladas

## 3. **Backend - Conectividad**

### Problema
- Backend no estaba ejecutándose inicialmente
- Posibles problemas de CORS con frontend

### Solución
- [x] Backend iniciado correctamente
- [ ] Verificar endpoints de IA funcionando
- [ ] Probar conectividad frontend-backend

## 4. **Base de Datos**

### Problema
- Contenedor MariaDB marcado como "unhealthy"
- Posibles problemas de persistencia

### Solución
- [ ] Verificar logs de MariaDB
- [ ] Revisar configuración de volúmenes
- [ ] Verificar conectividad desde backend

## 5. **Componentes Frontend IA**

### Estado
- [x] Módulo IA creado
- [x] Servicio IaService implementado
- [x] Componentes básicos creados
- [ ] Componentes faltantes por implementar:
  - [ ] DashboardCargasComponent
  - [ ] UnifilarSvgComponent  
  - [ ] ExportReportsComponent

## Plan de Acción Inmediato

### Prioridad 1: Ollama Funcional
1. **Configurar Ollama para memoria limitada**
   ```bash
   # Modificar docker-compose para Ollama
   environment:
     - OLLAMA_HOST=0.0.0.0
     - OLLAMA_ORIGINS=*
   ```

2. **Descargar modelo pequeño manualmente**
   - Usar Open WebUI en http://localhost:3001
   - Descargar `llama3.1:1b-instruct-q4_K_M`

3. **Verificar funcionalidad básica**
   - Probar endpoint `/api/llm/health`
   - Probar chat simple

### Prioridad 2: Componentes Frontend
1. **Completar componentes faltantes**
   - DashboardCargasComponent con Chart.js
   - UnifilarSvgComponent con SVG dinámico
   - ExportReportsComponent con PDF/Excel

2. **Integración completa**
   - Probar todas las rutas del módulo IA
   - Verificar navegación y funcionalidad

### Prioridad 3: Optimización
1. **Performance**
   - Optimizar carga de modelos
   - Implementar caché de respuestas
   - Mejorar UX con loading states

2. **Testing**
   - Tests unitarios para componentes
   - Tests de integración para IA
   - Tests E2E para flujos completos

## Comandos de Verificación

### Verificar Servicios
```bash
# Frontend
curl http://localhost:4200

# Backend
curl http://localhost:3000/api/health

# Ollama
curl http://localhost:11434/api/tags

# Open WebUI
curl http://localhost:3001
```

### Verificar Modelos
```bash
# Listar modelos disponibles
curl http://localhost:11434/api/tags

# Probar modelo específico
curl -X POST http://localhost:11434/api/generate \
  -H "Content-Type: application/json" \
  -d '{"model":"llama3.1:1b-instruct-q4_K_M","prompt":"Hola","stream":false}'
```

## Notas Importantes

1. **Memoria del Sistema**: El sistema tiene 16GB RAM, pero Ollama está limitado a ~2GB
2. **GPU**: No hay GPU compatible detectada, usando CPU
3. **Red**: Posibles problemas de conectividad para descargas grandes
4. **Docker**: Todos los servicios están en contenedores Docker

## Próximos Pasos

1. Resolver problema de Ollama (modelos)
2. Completar componentes frontend faltantes
3. Integración completa frontend-backend-IA
4. Testing y optimización
5. Documentación final
