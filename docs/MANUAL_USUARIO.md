# 📖 Manual de Usuario - Electridom

## 🚀 Guía Completa de Uso

**Electridom** es una calculadora eléctrica profesional para cálculos residenciales, comerciales e industriales según normativas NEC 2023 y RIE RD.

---

## 📋 Tabla de Contenidos

1. [Inicio Rápido](#-inicio-rápido)
2. [Acceso al Sistema](#-acceso-al-sistema)
3. [Dashboard Principal](#-dashboard-principal)
4. [Gestión de Proyectos](#-gestión-de-proyectos)
5. [Calculadora Eléctrica](#-calculadora-eléctrica)
6. [Asistente de IA](#-asistente-de-ia)
7. [Exportación de Reportes](#-exportación-de-reportes)
8. [Configuración y Perfil](#-configuración-y-perfil)
9. [Solución de Problemas](#-solución-de-problemas)

---

## ⚡ Inicio Rápido

### Requisitos Previos
- Navegador web moderno (Chrome, Firefox, Safari, Edge)
- Conexión a internet estable
- Cuenta de usuario registrada

### URLs de Acceso
- **Aplicación Principal**: http://localhost:8082
- **Documentación API**: http://localhost:3000/api/docs
- **Gestión de Base de Datos**: http://localhost:8080
- **Interfaz de IA**: http://localhost:3001

---

## 🔐 Acceso al Sistema

### 1. Registro de Usuario

1. **Acceder a la aplicación**: http://localhost:8082
2. **Hacer clic en "Registrarse"**
3. **Completar el formulario**:
   - Nombre completo
   - Email válido
   - Contraseña (mínimo 8 caracteres)
   - Confirmar contraseña
4. **Hacer clic en "Crear Cuenta"**

### 2. Inicio de Sesión

1. **Acceder a la aplicación**: http://localhost:8082
2. **Ingresar credenciales**:
   - Email registrado
   - Contraseña
3. **Hacer clic en "Iniciar Sesión"**

### 3. Recuperación de Contraseña

1. **En la pantalla de login, hacer clic en "¿Olvidaste tu contraseña?"**
2. **Ingresar email registrado**
3. **Revisar email para instrucciones de recuperación**

---

## 🏠 Dashboard Principal

### Panel de Control

El dashboard muestra:

- **📊 Resumen de Proyectos**: Total de proyectos creados
- **⚡ Cálculos Recientes**: Últimos 5 cálculos realizados
- **📈 Estadísticas**: Gráficos de uso y actividad
- **🔔 Notificaciones**: Alertas y mensajes importantes

### Navegación Principal

- **🏠 Dashboard**: Página principal
- **📁 Proyectos**: Gestión de proyectos
- **🧮 Calculadora**: Herramienta de cálculos eléctricos
- **🤖 IA**: Asistente de inteligencia artificial
- **👤 Perfil**: Configuración de usuario

---

## 📁 Gestión de Proyectos

### Crear Nuevo Proyecto

1. **Ir a "Proyectos" en el menú principal**
2. **Hacer clic en "Nuevo Proyecto"**
3. **Completar información básica**:
   - Nombre del proyecto
   - Descripción
   - Tipo de instalación (Residencial/Comercial/Industrial)
   - Ubicación
4. **Hacer clic en "Crear Proyecto"**

### Editar Proyecto

1. **En la lista de proyectos, hacer clic en el proyecto deseado**
2. **Hacer clic en "Editar"**
3. **Modificar información según necesidad**
4. **Guardar cambios**

### Eliminar Proyecto

1. **Seleccionar proyecto de la lista**
2. **Hacer clic en "Eliminar"**
3. **Confirmar eliminación**

### Exportar Proyecto

1. **Seleccionar proyecto**
2. **Hacer clic en "Exportar"**
3. **Elegir formato**: PDF o Excel
4. **Descargar archivo**

---

## 🧮 Calculadora Eléctrica

### 1. Cálculo de Cargas por Ambiente

#### Paso 1: Configurar Sistema
1. **Ir a "Calculadora" en el menú**
2. **Seleccionar "Cargas por Ambiente"**
3. **Configurar sistema eléctrico**:
   - **Tensión**: 120V, 208V, 240V, 480V
   - **Fases**: Monofásico (1) o Trifásico (3)

#### Paso 2: Definir Ambientes
1. **Agregar ambientes**:
   - **Nombre**: Sala, Cocina, Dormitorio, etc.
   - **Área (m²)**: Superficie del ambiente
2. **Hacer clic en "Agregar Ambiente"**

#### Paso 3: Definir Consumos
1. **Para cada ambiente, agregar consumos**:
   - **Nombre**: TV, Refrigerador, Aire Acondicionado, etc.
   - **Potencia (W)**: Potencia nominal del equipo
2. **Hacer clic en "Agregar Consumo"**

#### Paso 4: Calcular
1. **Revisar datos ingresados**
2. **Hacer clic en "Calcular Cargas"**
3. **Revisar resultados**:
   - Carga total por ambiente
   - Factor de uso aplicado
   - Carga diversificada

### 2. Factores de Demanda

#### Paso 1: Ingresar Cargas por Categoría
1. **Seleccionar "Factores de Demanda"**
2. **Agregar cargas por categoría**:
   - **Iluminación General**: Carga en VA
   - **Tomacorrientes**: Carga en VA
   - **Aire Acondicionado**: Carga en VA
   - **Cocina**: Carga en VA
   - **Otros**: Carga en VA

#### Paso 2: Configurar Parámetros
1. **Tipo de instalación**: Residencial/Comercial/Industrial
2. **Hacer clic en "Calcular Demanda"**

#### Paso 3: Revisar Resultados
- Factores de demanda aplicados
- Carga diversificada por categoría
- Carga total diversificada
- Ahorro por diversificación

### 3. Circuitos Ramales

#### Paso 1: Definir Circuitos Individuales
1. **Seleccionar "Circuitos Ramales"**
2. **Agregar circuitos**:
   - **ID del Circuito**: CIRC-001, CIRC-002, etc.
   - **Nombre**: Iluminación, Tomacorrientes, etc.
   - **Corriente (A)**: Corriente nominal

#### Paso 2: Configurar Parámetros
1. **Material del conductor**: Cobre (Cu) o Aluminio (Al)
2. **Tipo de instalación**: Residencial/Comercial/Industrial
3. **Hacer clic en "Calcular Circuitos"**

#### Paso 3: Revisar Resultados
- Conductores seleccionados por ampacidad
- Breakers recomendados
- Utilización de circuitos
- Estadísticas de agrupación

### 4. Análisis de Caída de Tensión

#### Paso 1: Ingresar Datos de Circuitos
1. **Seleccionar "Caída de Tensión"**
2. **Ingresar circuitos ramales**:
   - **Circuito**: ID del circuito
   - **Conductor**: Sección en mm²
   - **Longitud**: Longitud en metros
   - **Corriente**: Corriente en amperios

#### Paso 2: Configurar Alimentador
1. **Longitud del alimentador (m)**
2. **Material del conductor**: Cu o Al
3. **Sistema eléctrico**: Tensión y fases
4. **Hacer clic en "Analizar Caída"**

#### Paso 3: Revisar Resultados
- Caída de tensión por circuito
- Caída de tensión en alimentador
- Conductores recomendados
- Observaciones y límites

### 5. Puesta a Tierra

#### Paso 1: Configurar Sistema
1. **Seleccionar "Puesta a Tierra"**
2. **Configurar sistema eléctrico**:
   - **Tensión**: 120V, 208V, 240V, 480V
   - **Fases**: 1 o 3

#### Paso 2: Configurar Alimentador
1. **Corriente del alimentador (A)**
2. **Sección del conductor (mm²)**
3. **Breaker principal (A)**

#### Paso 3: Configurar Parámetros
1. **Tipo de instalación**: Residencial/Comercial/Industrial
2. **Sistema de puesta a tierra**: TN-S, TT, IT
3. **Hacer clic en "Calcular Puesta a Tierra"**

#### Paso 4: Revisar Resultados
- Conductores de protección (EGC)
- Conductores de tierra (GEC)
- Dimensionamiento según capacidad
- Observaciones específicas

### 6. Generación de Reportes

#### Paso 1: Consolidar Datos
1. **Seleccionar "Generar Reporte"**
2. **Verificar que todos los cálculos estén completos**
3. **Revisar datos de entrada**

#### Paso 2: Configurar Reporte
1. **Tipo de instalación**
2. **Sistema eléctrico**
3. **Datos de cálculo**: Ambientes, demanda, circuitos, etc.
4. **Hacer clic en "Generar Reporte"**

#### Paso 3: Descargar Reporte
- **Formato PDF**: Reporte técnico completo
- **Formato Excel**: Datos tabulados
- **Archivo ZIP**: Ambos formatos

---

## 🤖 Asistente de IA

### 1. Chat con IA

#### Acceder al Chat
1. **Ir a "IA" en el menú principal**
2. **Seleccionar "Chat"**
3. **Iniciar conversación**

#### Hacer Preguntas
1. **Escribir pregunta en el campo de texto**
2. **Ejemplos de preguntas**:
   - "¿Cómo calcular la demanda de una casa residencial?"
   - "¿Qué factor de demanda aplicar para iluminación comercial?"
   - "¿Es correcto mi cálculo de caída de tensión?"
3. **Presionar Enter o hacer clic en "Enviar"**

#### Revisar Respuestas
- **Respuesta inmediata** de la IA
- **Explicaciones detalladas**
- **Recomendaciones técnicas**
- **Referencias a normativas**

### 2. Cálculos Asistidos por IA

#### Subir Datos
1. **Seleccionar "Cálculos Asistidos"**
2. **Subir archivo Excel** con datos de proyecto
3. **Esperar procesamiento**

#### Revisar Análisis
- **Análisis automático** de datos
- **Detección de errores**
- **Recomendaciones de mejora**
- **Optimizaciones sugeridas**

### 3. Dashboard de Cargas

#### Visualizar Gráficos
1. **Seleccionar "Dashboard de Cargas"**
2. **Revisar gráficos interactivos**:
   - Distribución de cargas por ambiente
   - Factores de demanda aplicados
   - Utilización de circuitos
   - Análisis de eficiencia

#### Interactuar con Gráficos
- **Hacer clic** en elementos para detalles
- **Zoom** y **pan** en gráficos
- **Exportar** gráficos como imagen

### 4. Diagramas Unifilares

#### Generar Diagrama
1. **Seleccionar "Diagramas Unifilares"**
2. **Ingresar datos del sistema**:
   - Alimentador principal
   - Circuitos ramales
   - Cargas conectadas
3. **Hacer clic en "Generar Diagrama"**

#### Revisar Diagrama
- **Diagrama SVG interactivo**
- **Elementos etiquetados**
- **Escala automática**
- **Exportar como imagen**

### 5. Exportación de Reportes IA

#### Generar Reporte IA
1. **Seleccionar "Exportación IA"**
2. **Elegir tipo de reporte**:
   - Análisis técnico
   - Recomendaciones de optimización
   - Comparación de alternativas
3. **Hacer clic en "Generar Reporte"**

#### Descargar Reporte
- **Formato PDF** con análisis completo
- **Gráficos incluidos**
- **Recomendaciones detalladas**
- **Referencias técnicas**

---

## 📄 Exportación de Reportes

### Tipos de Reportes Disponibles

1. **Reporte Técnico Completo**
   - Todos los cálculos realizados
   - Gráficos y diagramas
   - Especificaciones técnicas
   - Cumplimiento normativo

2. **Reporte Ejecutivo**
   - Resumen ejecutivo
   - Costos estimados
   - Recomendaciones principales
   - Cronograma sugerido

3. **Reporte de Optimización**
   - Análisis de eficiencia
   - Oportunidades de mejora
   - Ahorros potenciales
   - Alternativas técnicas

### Proceso de Exportación

#### Paso 1: Seleccionar Tipo
1. **Ir a "Exportar Reportes"**
2. **Elegir tipo de reporte**
3. **Configurar opciones**

#### Paso 2: Configurar Contenido
1. **Seleccionar secciones a incluir**
2. **Configurar formato y estilo**
3. **Agregar información adicional**

#### Paso 3: Generar y Descargar
1. **Hacer clic en "Generar Reporte"**
2. **Esperar procesamiento**
3. **Descargar archivo**

---

## ⚙️ Configuración y Perfil

### Perfil de Usuario

#### Editar Información Personal
1. **Ir a "Perfil" en el menú**
2. **Hacer clic en "Editar Perfil"**
3. **Modificar información**:
   - Nombre completo
   - Email
   - Teléfono
   - Empresa
4. **Guardar cambios**

#### Cambiar Contraseña
1. **En perfil, seleccionar "Cambiar Contraseña"**
2. **Ingresar contraseña actual**
3. **Nueva contraseña**
4. **Confirmar nueva contraseña**
5. **Guardar cambios**

### Configuración de Aplicación

#### Preferencias de Cálculo
1. **Ir a "Configuración"**
2. **Configurar preferencias**:
   - Unidades de medida
   - Normativas aplicables
   - Factores de seguridad
   - Formato de reportes

#### Configuración de IA
1. **Seleccionar proveedor de IA**:
   - Ollama (local)
   - OpenAI (nube)
2. **Configurar parámetros**:
   - Modelo de IA
   - Tiempo de respuesta
   - Nivel de detalle

---

## 🔧 Solución de Problemas

### Problemas Comunes

#### No Puedo Iniciar Sesión
1. **Verificar credenciales**
2. **Revisar conexión a internet**
3. **Limpiar caché del navegador**
4. **Contactar soporte técnico**

#### Los Cálculos No Se Guardan
1. **Verificar conexión a internet**
2. **Revisar permisos de usuario**
3. **Intentar guardar nuevamente**
4. **Contactar soporte técnico**

#### La IA No Responde
1. **Verificar conexión a internet**
2. **Revisar configuración de IA**
3. **Cambiar proveedor de IA**
4. **Contactar soporte técnico**

#### Error al Exportar Reportes
1. **Verificar que los cálculos estén completos**
2. **Revisar permisos de descarga**
3. **Intentar con formato diferente**
4. **Contactar soporte técnico**

### Contacto de Soporte

- **Email**: soporte@electridom.com
- **Teléfono**: +1 (809) XXX-XXXX
- **Horario**: Lunes a Viernes 8:00 AM - 6:00 PM
- **Chat en vivo**: Disponible en la aplicación

---

## 📚 Recursos Adicionales

### Documentación Técnica
- **API Documentation**: http://localhost:3000/api/docs
- **Guías de Configuración**: Carpeta `/docs`
- **Ejemplos de Uso**: Disponibles en la aplicación

### Videos Tutoriales
- **Inicio Rápido**: 5 minutos
- **Cálculos Básicos**: 15 minutos
- **Uso Avanzado**: 30 minutos
- **Integración con IA**: 20 minutos

### Comunidad
- **Foro de Usuarios**: Disponible en la aplicación
- **Base de Conocimientos**: Artículos técnicos
- **Webinars Mensuales**: Registro en la aplicación

---

## 🎯 Consejos de Uso

### Para Principiantes
1. **Comenzar con proyectos simples**
2. **Usar el asistente de IA para dudas**
3. **Revisar ejemplos incluidos**
4. **Practicar con datos de prueba**

### Para Usuarios Avanzados
1. **Explorar todas las funcionalidades de IA**
2. **Personalizar reportes**
3. **Usar exportación avanzada**
4. **Contribuir a la comunidad**

### Mejores Prácticas
1. **Guardar proyectos regularmente**
2. **Verificar datos antes de calcular**
3. **Revisar resultados con IA**
4. **Mantener copias de seguridad**

---

**¡Disfruta usando Electridom para tus cálculos eléctricos profesionales!** 🚀

*Para más información, consulta la documentación técnica o contacta soporte.*
