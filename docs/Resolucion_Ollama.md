# Resolución del Problema de Ollama - Electridom

## 🔍 **Diagnóstico del Problema**

### Problema Identificado

- **Ollama en modo "low vram"**: Solo 1.9 GiB de memoria disponible de 3.8 GiB total
- **Error 500**: Al intentar descargar modelos desde la API directa
- **Sin GPU compatible**: Usando CPU para inferencia
- **Memoria limitada**: Configuración actual no permite descargas

### Estado Actual

- ✅ **Ollama contenedor**: Ejecutándose en puerto 11434
- ✅ **Open WebUI**: Funcionando en puerto 3001
- ❌ **Modelos**: No hay modelos descargados
- ❌ **Descarga directa**: Falla con error 500

## 🛠️ **Solución Implementada**

### Enfoque: Open WebUI Manual

Dado que la descarga directa falla, hemos implementado un enfoque alternativo usando Open WebUI.

### Scripts Creados

1. **`scripts/configure-ollama.ps1`** - Configuración optimizada (ejecutado)
2. **`scripts/download-small-model.ps1`** - Descarga de modelos pequeños (ejecutado)
3. **`scripts/setup-ollama-minimal.ps1`** - Configuración mínima (ejecutado)
4. **`scripts/setup-openwebui.ps1`** - **SOLUCIÓN ACTUAL** (ejecutándose)

## 📋 **Instrucciones para Resolver**

### Paso 1: Configurar Open WebUI

1. **Abrir navegador**: http://localhost:3001
2. **Configuración inicial**:
   - Backend URL: `http://localhost:11434`
   - Crear usuario y contraseña
   - Guardar configuración

### Paso 2: Descargar Modelo

1. **Ir a sección "Models"**
2. **Buscar modelo pequeño**:
   - `tinyllama:1b-chat-q4_K_M` (recomendado, ~500MB)
   - `phi3:mini-4k-instruct-q4_K_M` (~1GB)
   - `llama3.1:1b-instruct-q4_K_M` (~1GB)
3. **Descargar modelo**
4. **Esperar completar descarga**

### Paso 3: Verificación Automática

- El script `setup-openwebui.ps1` está ejecutándose en segundo plano
- Verifica cada 30 segundos si hay modelos disponibles
- Máximo 20 minutos de espera

## 🔧 **Configuración Técnica**

### Contenedor Ollama Actual

```bash
Nombre: electridom-ollama-minimal
Configuración:
- Memoria limitada: 2GB
- CPUs: 1
- Timeout de carga: 2 minutos
- Modelos máximos: 1
```

### Variables de Entorno

```bash
OLLAMA_HOST=0.0.0.0
OLLAMA_ORIGINS=*
OLLAMA_NUM_PARALLEL=1
OLLAMA_KEEP_ALIVE=1m
OLLAMA_MAX_LOADED_MODELS=1
OLLAMA_LOAD_TIMEOUT=2m
```

## 📊 **Estado de Verificación**

### Servicios Activos

- ✅ **Ollama**: http://localhost:11434
- ✅ **Open WebUI**: http://localhost:3001
- ✅ **Backend NestJS**: http://localhost:3000
- ✅ **Frontend Angular**: http://localhost:4200

### Verificación de Modelos

```bash
# Verificar modelos disponibles
curl http://localhost:11434/api/tags

# Probar modelo (cuando esté disponible)
curl -X POST http://localhost:11434/api/generate \
  -H "Content-Type: application/json" \
  -d '{"model":"tinyllama:1b-chat-q4_K_M","prompt":"Hola","stream":false}'
```

## 🎯 **Próximos Pasos**

### Inmediato

1. **Configurar Open WebUI** (manual)
2. **Descargar modelo pequeño** (manual)
3. **Verificar funcionamiento** (automático)

### Después de Modelo Descargado

1. **Probar endpoints de IA**:

   ```bash
   curl http://localhost:3000/api/llm/health
   curl http://localhost:3000/api/llm/provider
   ```

2. **Probar funcionalidades del frontend**:

   - Chat IA: http://localhost:4200/ia/chat
   - Cálculos IA: http://localhost:4200/ia/calculos

3. **Verificar integración completa**

## 🚨 **Solución Alternativa (Si Fallan los Modelos)**

### Opción 1: Usar OpenAI

- Configurar `OPENAI_API_KEY` en el backend
- Cambiar `LLM_PROVIDER` a "openai"
- Usar OpenAI como fallback

### Opción 2: Modelo Local Diferente

- Probar modelos aún más pequeños
- Usar modelos específicos para CPU
- Configurar Ollama con menos memoria

### Opción 3: Optimización de Sistema

- Liberar memoria del sistema
- Cerrar aplicaciones innecesarias
- Reiniciar contenedores Docker

## 📝 **Notas Importantes**

1. **Memoria del Sistema**: 16GB total, pero Ollama limitado a ~2GB
2. **GPU**: No disponible, usando CPU
3. **Red**: Conexión estable para descargas
4. **Docker**: Todos los servicios containerizados

## ✅ **Criterios de Éxito**

- [ ] Modelo descargado en Ollama
- [ ] Respuesta exitosa a prueba de modelo
- [ ] Endpoints de IA funcionando
- [ ] Frontend conectado con backend
- [ ] Chat IA funcional

**El script de verificación automática está ejecutándose y notificará cuando el modelo esté disponible.**
