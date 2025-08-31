# ⚡ Guía Rápida - Electridom

## 🚀 Comenzar en 5 Minutos

### 1. Acceso Inmediato

**URL Principal**: http://localhost:8082

### 2. Registro Rápido

1. **Hacer clic en "Registrarse"**
2. **Completar formulario básico**:
   - Nombre completo
   - Email
   - Contraseña (mínimo 8 caracteres)
3. **Crear cuenta**

### 3. Primer Proyecto

1. **Ir a "Proyectos"**
2. **Hacer clic en "Nuevo Proyecto"**
3. **Completar**:
   - Nombre: "Mi Primer Proyecto"
   - Tipo: Residencial
   - Ubicación: "Santo Domingo"
4. **Crear proyecto**

### 4. Primer Cálculo

1. **Ir a "Calculadora"**
2. **Seleccionar "Cargas por Ambiente"**
3. **Configurar sistema**:
   - Tensión: 120V
   - Fases: 1 (Monofásico)
4. **Agregar ambiente**:
   - Nombre: "Sala"
   - Área: 20 m²
5. **Agregar consumo**:
   - Nombre: "TV"
   - Potencia: 150W
6. **Calcular**

### 5. Usar IA

1. **Ir a "IA"**
2. **Seleccionar "Chat"**
3. **Preguntar**: "¿Cómo interpretar los resultados de mi cálculo?"
4. **Recibir respuesta inmediata**

---

## 🎯 Funcionalidades Principales

### 📊 Dashboard

- **Resumen de proyectos**
- **Cálculos recientes**
- **Estadísticas de uso**

### 🧮 Calculadora

- **Cargas por ambiente**
- **Factores de demanda**
- **Circuitos ramales**
- **Caída de tensión**
- **Puesta a tierra**

### 🤖 IA Asistente

- **Chat interactivo**
- **Cálculos asistidos**
- **Dashboard de cargas**
- **Diagramas unifilares**

### 📄 Reportes

- **PDF técnico**
- **Excel con datos**
- **Gráficos interactivos**

---

## 🔧 Configuración Rápida

### URLs Importantes

- **Aplicación**: http://localhost:8082
- **API Docs**: http://localhost:3000/api/docs
- **Base de Datos**: http://localhost:8080
- **IA Interface**: http://localhost:3001

### Variables de Entorno

```env
# Crear archivo .env en la raíz
OPENAI_API_KEY=tu-api-key-aqui
DATABASE_HOST=mariadb
DATABASE_PORT=3306
DATABASE_USERNAME=root
DATABASE_PASSWORD=rootpassword
DATABASE_NAME=electridom
```

---

## 🚀 Comandos Rápidos

### Iniciar Sistema

```bash
# Windows PowerShell
.\scripts\docker-setup.ps1

# O manualmente
docker-compose up -d
```

### Verificar Estado

```bash
docker-compose ps
```

### Ver Logs

```bash
docker-compose logs -f
```

### Detener Sistema

```bash
docker-compose down
```

---

## 📋 Checklist de Inicio

- [ ] **Sistema iniciado** (Docker containers corriendo)
- [ ] **Usuario registrado** (cuenta creada)
- [ ] **Primer proyecto creado**
- [ ] **Primer cálculo realizado**
- [ ] **IA probada** (chat funcional)
- [ ] **Reporte generado** (PDF/Excel)

---

## 🆘 Soporte Rápido

### Problemas Comunes

**No puedo acceder a la aplicación**

- Verificar que Docker esté corriendo
- Revisar puerto 8082 disponible
- Ejecutar `docker-compose ps`

**Error de conexión a la base de datos**

- Solución simple: `.\scripts\simple-fix-db.ps1`
- Solución rápida: `.\scripts\quick-fix-db.ps1`
- Solución completa: `.\scripts\fix-database-connection-v2.ps1`
- Verificar: `.\scripts\test-database-connection.ps1`
- Revisar logs: `docker logs electridom-mariadb`

**La IA no responde**

- Verificar conexión a internet
- Revisar configuración de OpenAI
- Cambiar a Ollama local

**Error en cálculos**

- Verificar datos de entrada
- Revisar formato de números
- Consultar documentación API

### Contacto

- **Email**: soporte@electridom.com
- **Chat**: Disponible en la aplicación

---

## 🎯 Próximos Pasos

1. **Explorar todas las funcionalidades**
2. **Crear proyectos complejos**
3. **Usar IA para optimización**
4. **Generar reportes profesionales**
5. **Consultar documentación completa**

---

**¡Listo para usar Electridom!** 🚀

_Para información detallada, consulta el [Manual de Usuario](MANUAL_USUARIO.md)_
