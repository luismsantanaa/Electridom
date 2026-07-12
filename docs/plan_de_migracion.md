# 🏗️ Análisis de Factibilidad — Calculadora Eléctrica RD v2

## Reconocimiento de Planos PDF/DXF + Visualización Interactiva

**Fecha:** Julio 2026  
**Autor:** Arquitecto de Software / Product Owner Senior  
**Versión:** 1.0

---

## 📋 Tabla de Contenidos

1. [Resumen Ejecutivo](#1-resumen-ejecutivo)
2. [Estado Actual del Proyecto](#2-estado-actual-del-proyecto)
3. [Nuevos Requerimientos](#3-nuevos-requerimientos)
4. [Análisis Técnico: PDF y DXF](#4-análisis-técnico-pdf-y-dxf)
5. [Comparativa: Node.js/TypeScript vs Python](#5-comparativa-nodejstypescript-vs-python)
6. [Visualización Interactiva de Planos](#6-visualización-interactiva-de-planos)
7. [Arquitectura Recomendada](#7-arquitectura-recomendada)
8. [Stack Tecnológico Recomendado](#8-stack-tecnológico-recomendado)
9. [Estrategia de Migración](#9-estrategia-de-migración)
10. [Análisis de Riesgos](#10-análisis-de-riesgos)
11. [Estimación de Esfuerzo](#11-estimación-de-esfuerzo)
12. [Recomendación Final](#12-recomendación-final)

---

## 1. Resumen Ejecutivo

El proyecto **Calculadora Eléctrica RD** tiene un backend NestJS + frontend Angular 20 funcional con motor de cálculos eléctricos completo. Los nuevos requerimientos (reconocimiento de planos PDF/DXF, extracción de medidas, visualización interactiva) representan un **salto cualitativo** que cambia el perfil técnico del proyecto de "aplicación web de formularios + cálculos" a "plataforma de ingeniería asistida por IA con capacidades de computer vision y CAD".

**Conclusión anticipada:** ✅ **Factible, con arquitectura híbrida.** Python es indiscutiblemente superior para procesamiento de PDF/DXF y computer vision. Se recomienda un **microservicio Python (FastAPI)** para el pipeline de reconocimiento de planos, manteniendo el backend NestJS actual para lógica de negocio, o una migración progresiva completa a Python si se busca simplificar el stack a largo plazo.

---

## 2. Estado Actual del Proyecto

### 2.1 Lo que existe (Backend NestJS)

| Componente           | Estado      | Detalle                                                               |
| -------------------- | ----------- | --------------------------------------------------------------------- |
| **Auth**             | ✅ Completo | JWT RS256 + JWKS + Key Rotation + Refresh Tokens                      |
| **Usuarios**         | ✅ Completo | 6 roles (ADMIN, INGENIERO, TECNICO, CLIENTE, AUDITOR)                 |
| **Motor de Cálculo** | ✅ Completo | 6 servicios: Rooms, Demand, Circuits, VoltageDrop, Grounding, Reports |
| **PDF/Excel**        | ✅ Completo | Puppeteer (HTML→PDF) + XLSX (Excel)                                   |
| **API Docs**         | ✅ Completo | Swagger/OpenAPI completo                                              |
| **Testing**          | ✅ 44%      | 186 tests (27 suites), umbral 40%                                     |
| **CI/CD**            | ✅ Completo | GitHub Actions con monorepo                                           |
| **Observabilidad**   | ✅ Completo | Prometheus + Health Checks                                            |
| **BD**               | ✅ Completo | MariaDB + TypeORM, 15+ migraciones, seeds                             |

### 2.2 Lo que existe (Frontend Angular)

| Componente       | Estado      | Detalle                                                 |
| ---------------- | ----------- | ------------------------------------------------------- |
| **Shell/Layout** | ✅ Completo | Angular 20 standalone + Datta Able template             |
| **Auth pages**   | ⚠️ Stubs    | Login/Register básicos                                  |
| **Calc feature** | ⚠️ Stubs    | Componentes base (rooms-form, loads-form, results-view) |
| **API Service**  | ⚠️ Stub     | CalcApiService con métodos para 6 endpoints             |
| **Validación**   | ⚠️ Parcial  | AJV instalado, schemas copiados                         |

### 2.3 Deuda Técnica

- Frontend está en ~15% de implementación real
- Migraciones con `.backup` files que deben limpiarse
- Versiones antiguas de dependencias necesitan actualización
- No hay tests E2E para frontend
- La generación de PDF con Puppeteer es pesada (requiere Chromium)

---

## 3. Nuevos Requerimientos

### 3.1 Requerimientos Funcionales

| ID      | Requerimiento                                                 | Prioridad | Complejidad  |
| ------- | ------------------------------------------------------------- | --------- | ------------ |
| **RF1** | Subir planos en formato `.pdf`                                | Alta      | Media        |
| **RF2** | Subir planos en formato `.dxf`                                | Alta      | Alta         |
| **RF3** | Reconocer automáticamente espacios/habitaciones del plano     | Alta      | **Muy Alta** |
| **RF4** | Extraer dimensiones (m², perímetro) de cada espacio           | Alta      | **Muy Alta** |
| **RF5** | Generar gráfica/plano interactivo de los espacios reconocidos | Alta      | Alta         |
| **RF6** | Permitir al usuario corregir/ajustar espacios reconocidos     | Alta      | Media        |
| **RF7** | Exportar datos extraídos al motor de cálculo existente        | Alta      | Media        |
| **RF8** | Visualización interactiva (zoom, pan, selección de espacios)  | Media     | Alta         |

### 3.2 Tipos de PDF de Planos

Los PDF de planos arquitectónicos pueden ser:

| Tipo              | Descripción                                                                            | Facilidad              |
| ----------------- | -------------------------------------------------------------------------------------- | ---------------------- |
| **PDF Vectorial** | Exportado desde AutoCAD/Revit. Contiene comandos de dibujo (líneas, polígonos, cotas). | Media-Alta             |
| **PDF Raster**    | Plano escaneado como imagen incrustada en PDF.                                         | Baja (requiere OCR/ML) |
| **PDF Mixto**     | Combinación de capas vectoriales e imágenes.                                           | Media                  |

### 3.3 Tipos de DXF

| Versión        | Descripción                                            |
| -------------- | ------------------------------------------------------ |
| **ASCII DXF**  | Texto legible, más pesado pero más fácil de parsear    |
| **Binary DXF** | Binario, más compacto, requiere librería especializada |
| **R12-R14**    | Versiones antiguas, más simples                        |
| **R2000+**     | Versiones modernas con más entidades y metadata        |

---

## 4. Análisis Técnico: PDF y DXF

### 4.1 Librerías para procesamiento de PDF

#### Python — 🥇 LIDER INDISCUTIBLE

| Librería           | Uso                               | Fortaleza                                                     |
| ------------------ | --------------------------------- | ------------------------------------------------------------- |
| **PyMuPDF (fitz)** | Lectura/extracción de PDF         | Extrae texto, imágenes, vectores, anotaciones. La más rápida. |
| **pdfplumber**     | Extracción de datos estructurados | Excelente para tablas y formas geométricas                    |
| **pdf2image**      | Conversión PDF→imagen             | Necesario para PDF raster (usa poppler)                       |
| **Camelot/Tabula** | Extracción de tablas              | Especializado en tablas                                       |
| **ReportLab**      | Generación de PDF                 | Creación de PDFs profesionales                                |
| **Shapely**        | Geometría computacional           | Unión, intersección, área de polígonos                        |
| **OpenCV**         | Computer Vision                   | Detección de contornos, habitaciones en imágenes              |

#### Node.js/TypeScript — 🥈 SEGUNDO LUGAR

| Librería          | Uso                 | Limitación                              |
| ----------------- | ------------------- | --------------------------------------- |
| **pdf-parse**     | Extracción de texto | Solo texto, no vectores                 |
| **pdfjs-dist**    | Renderizado de PDF  | Pesado, orientado a visualización       |
| **pdf-lib**       | Manipulación de PDF | Crea/modifica PDFs, no extrae geometría |
| **pdf2pic**       | PDF→imagen          | Depende de ghostscript instalado        |
| **pdf2json**      | Parseo estructural  | Inmaduro, mantenimiento irregular       |
| **opencv4nodejs** | Computer Vision     | Wrapper inestable de OpenCV             |

> **Veredicto PDF:** Python gana 10-0. PyMuPDF es años luz de cualquier alternativa Node.js para extracción de geometría vectorial.

### 4.2 Librerías para procesamiento de DXF

#### Python — 🥇 LIDER ABSOLUTO

| Librería       | Estado     | Descripción                                                                    |
| -------------- | ---------- | ------------------------------------------------------------------------------ |
| **ezdxf**      | ⭐⭐⭐⭐⭐ | La librería DXF más madura de Python. Lee/escribe R12-R2018. Comunidad activa. |
| **dxfgrabber** | ⭐⭐⭐     | Legacy, ezdxf es su sucesor espiritual                                         |

#### Node.js/TypeScript — 🥉 ESCASO

| Librería         | Estado | Descripción                       |
| ---------------- | ------ | --------------------------------- |
| **dxf**          | ⭐⭐   | Parser básico, mantenimiento bajo |
| **@resideo/dxf** | ⭐     | Fork abandonado                   |
| **cad-dxf**      | ⭐     | Experimental                      |

> **Veredicto DXF:** Python gana 10-0. `ezdxf` es el estándar de facto. Node.js no tiene una alternativa seria.

### 4.3 Pipeline de Reconocimiento de Espacios

```
┌─────────────────────────────────────────────────────────────────────┐
│                     PIPELINE DE RECONOCIMIENTO                       │
├───────────┬─────────────────────────────────────────────────────────┤
│  ENTRADA  │  PDF Vectorial  │  PDF Raster   │     DXF              │
├───────────┼─────────────────┼───────────────┼──────────────────────┤
│  PASO 1   │  PyMuPDF:       │  pdf2image    │  ezdxf:              │
│           │  Extraer paths  │  → PNG/JPG    │  Extraer LWPOLYLINE, │
│           │  y polígonos    │               │  LINE, ARC, TEXT     │
├───────────┼─────────────────┼───────────────┼──────────────────────┤
│  PASO 2   │  Shapely:       │  OpenCV:      │  Shapely:            │
│           │  Unir segmentos │  Detección de │  Construir polígonos │
│           │  → polígonos    │  contornos    │  desde entidades     │
├───────────┼─────────────────┼───────────────┼──────────────────────┤
│  PASO 3   │  Algoritmo de clasificación de espacios:               │
│           │  - Detectar ciclos cerrados → habitaciones              │
│           │  - Filtrar paredes (líneas paralelas cercanas)          │
│           │  - Identificar puertas/ventanas (gaps en paredes)       │
│           │  - Calcular áreas con Shapely                           │
│           │  - Detectar cotas numéricas cercanas a paredes          │
│           │  - Inferir nombres de espacios (texto dentro del área)  │
├───────────┼─────────────────────────────────────────────────────────┤
│  PASO 4   │  ML/AI Opcional: OpenAI Vision / YOLO para planos      │
│           │  rasterizados complejos o mal escaneados                │
├───────────┼─────────────────────────────────────────────────────────┤
│  SALIDA   │  JSON: { spaces: [{ name, area_m2, perimeter_m,        │
│           │    vertices: [{x,y}], type, confidence }] }             │
└───────────┴─────────────────────────────────────────────────────────┘
```

---

## 5. Comparativa: Node.js/TypeScript vs Python

### 5.1 Matriz de Decisión por Dominio

| Dominio                         | Node.js/TS               | Python                      | Ganador       |
| ------------------------------- | ------------------------ | --------------------------- | ------------- |
| **PDF (extracción vectorial)**  | 3/10                     | 9/10                        | 🐍 Python     |
| **DXF (lectura/escritura CAD)** | 1/10                     | 9/10                        | 🐍 Python     |
| **Computer Vision (OpenCV)**    | 3/10                     | 9/10                        | 🐍 Python     |
| **Geometría Computacional**     | 2/10 (Turf.js)           | 9/10 (Shapely)              | 🐍 Python     |
| **Machine Learning / AI**       | 5/10 (TensorFlow.js)     | 9/10                        | 🐍 Python     |
| **APIs REST**                   | 9/10 (NestJS/Express)    | 8/10 (FastAPI/Flask)        | ≈ Empate      |
| **WebSockets / Real-time**      | 9/10 (Socket.io)         | 7/10                        | 🟢 Node.js    |
| **Excel (generación)**          | 6/10 (xlsx)              | 7/10 (openpyxl)             | ≈ Empate      |
| **PDF (generación)**            | 6/10 (Puppeteer)         | 8/10 (ReportLab/WeasyPrint) | 🐍 Python     |
| **Autenticación/Auth**          | 9/10 (Passport, JWT)     | 7/10                        | 🟢 Node.js    |
| **ORM/Base de Datos**           | 8/10 (TypeORM/Prisma)    | 8/10 (SQLAlchemy)           | ≈ Empate      |
| **Testing**                     | 8/10 (Jest)              | 8/10 (Pytest)               | ≈ Empate      |
| **Type Safety**                 | 9/10 (TypeScript)        | 6/10 (mypy/pydantic)        | 🟢 TypeScript |
| **Frontend integración**        | 9/10 (monorepo, sharing) | 6/10                        | 🟢 Node.js    |

### 5.2 Ponderación para ESTE Proyecto

Ponderando por relevancia para los NUEVOS requerimientos:

| Factor               | Peso     | Node.js | Python | Node.js × Peso | Python × Peso |
| -------------------- | -------- | ------- | ------ | -------------- | ------------- |
| PDF/DXF extraction   | 30%      | 2       | 9      | 0.6            | **2.7**       |
| Computer Vision      | 20%      | 2       | 9      | 0.4            | **1.8**       |
| Geometría/Shapely    | 15%      | 2       | 9      | 0.3            | **1.35**      |
| ML/AI integration    | 10%      | 5       | 9      | 0.5            | **0.9**       |
| API/Backend          | 10%      | 9       | 8      | 0.9            | 0.8           |
| Frontend integración | 10%      | 9       | 5      | 0.9            | 0.5           |
| Mantenibilidad       | 5%       | 7       | 8      | 0.35           | 0.4           |
| **TOTAL**            | **100%** |         |        | **3.95**       | **8.45**      |

> **Python duplica el puntaje de Node.js** para los nuevos requerimientos. La diferencia es tan grande que ignorarla sería un error arquitectónico.

---

## 6. Visualización Interactiva de Planos

### 6.1 Opciones de Librerías Frontend

Independientemente del backend, la visualización se ejecuta en el navegador.

| Librería                 | Tipo         | Ventajas                                             | Desventajas                            |
| ------------------------ | ------------ | ---------------------------------------------------- | -------------------------------------- |
| **Three.js**             | 3D/WebGL     | Extremadamente potente, escenas 3D, comunidad masiva | Overkill para 2D, curva de aprendizaje |
| **Fabric.js**            | Canvas 2D    | Manipulación de objetos, eventos, buena para planos  | Bundle grande (~200KB)                 |
| **Konva.js**             | Canvas 2D    | Similar a Fabric, buena API de capas                 | Menos plugins                          |
| **D3.js**                | SVG/Data-viz | Precisión, transiciones, zoom/pan nativos            | Verboso, más bajo nivel                |
| **Paper.js**             | Canvas 2D    | Excelente para curvas y geometría vectorial          | Comunidad más pequeña                  |
| **Leaflet + Custom CRS** | Mapa 2D      | Zoom/pan infinito, coordenadas, plugins              | Hackeado para planos                   |
| **Excalidraw**           | Canvas 2D    | Open source, colaborativo, excelente UX              | Acoplado a su modelo de datos          |
| **Plotly.js**            | SVG/WebGL    | Gráficas interactivas (no planos)                    | No para planos arquitectónicos         |

### 6.2 Recomendación para Visualización

```
┌─────────────────────────────────────────────────────────────────────┐
│              ESTRATEGIA DE VISUALIZACIÓN (2 MODOS)                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  MODO 1: VISOR DE PLANOS (2D Interactivo)                           │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │  Tecnología: Fabric.js o Konva.js                             │  │
│  │  Funcionalidades:                                             │  │
│  │  • Renderizar polígonos de espacios sobre el plano original   │  │
│  │  • Zoom/Pan (transformación de viewport)                      │  │
│  │  • Selección de espacios (click → highlight)                  │  │
│  │  • Edición de vértices (drag & drop)                          │  │
│  │  • Mostrar dimensiones (cotas)                                │  │
│  │  • Overlay de información (tooltips con m², nombre)           │  │
│  │  • Exportar vista como imagen/PDF                             │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  MODO 2: GRÁFICA DE ESPACIOS (Diagrama de Árbol/Burbujas)           │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │  Tecnología: D3.js (force layout, treemap, pack)              │  │
│  │  Funcionalidades:                                             │  │
│  │  • Vista jerárquica: Piso → Espacios → Circuitos              │  │
│  │  • Treemap: área proporcional al m² del espacio               │  │
│  │  • Color por tipo de espacio (cocina, baño, etc.)             │  │
│  │  • Interactividad: click → drill-down a detalles              │  │
│  │  • Animaciones de transición                                  │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 7. Arquitectura Recomendada

### 7.1 Opción A: Arquitectura Híbrida (Python + NestJS) — 🏆 RECOMENDADA

```
┌──────────────────────────────────────────────────────────────────────┐
│                        ARQUITECTURA HÍBRIDA                           │
│                                                                      │
│  ┌─────────────┐     ┌─────────────────┐     ┌──────────────────┐   │
│  │   Frontend   │────▶│  API Gateway     │────▶│  NestJS Backend  │   │
│  │  (Angular o  │     │  (nginx/traefik) │     │  - Auth          │   │
│  │   React)     │     │                  │     │  - Usuarios      │   │
│  │              │     │  /api/*     ─────┤     │  - Proyectos     │   │
│  │  - Visor 2D  │     │  /api/calc/* ────┤     │  - Cálculos      │   │
│  │  - Gráficas  │     │  /api/plans/* ───┤     │  - Reportes      │   │
│  │  - Forms     │     │                  │     │                  │   │
│  └─────────────┘     └───────────────────┘     └──────────────────┘   │
│                                                         │            │
│                                          ┌──────────────┴──────────┐ │
│                                          │  Python Plan Service    │ │
│                                          │  (FastAPI)              │ │
│                                          │  - PDF parsing          │ │
│                                          │  - DXF parsing          │ │
│                                          │  - Room detection       │ │
│                                          │  - Measurement extract  │ │
│                                          │  - AI/ML pipeline       │ │
│                                          └─────────────────────────┘ │
│                                                                      │
│  ┌──────────────────────────┐    ┌──────────────────────────────┐   │
│  │  PostgreSQL / MariaDB     │    │  MinIO / S3 (planos PDF/DXF) │   │
│  └──────────────────────────┘    └──────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────┘
```

**Ventajas:**

- ✅ Preserva inversión en backend NestJS (20K líneas, 186 tests)
- ✅ Python solo donde es indiscutiblemente mejor (planos)
- ✅ Separación clara de responsabilidades
- ✅ Cada servicio escala independientemente
- ✅ Se puede migrar NestJS→Python gradualmente si se desea

**Desventajas:**

- ❌ Dos stacks que mantener
- ❌ Latencia extra en comunicación entre servicios
- ❌ Duplicación de modelos/validación en algunos casos
- ❌ CI/CD más complejo

### 7.2 Opción B: Migración Completa a Python

```
┌──────────────────────────────────────────────────────────────────────┐
│                     ARQUITECTURA PYTHON-FIRST                          │
│                                                                      │
│  ┌─────────────┐     ┌──────────────────────────────────────────┐   │
│  │   Frontend   │────▶│  FastAPI Backend (monolito modular)      │   │
│  │  (Angular o  │     │                                          │   │
│  │   React)     │     │  /api/auth/*       (JWT + PyJWT)        │   │
│  │              │     │  /api/users/*      (SQLAlchemy)          │   │
│  │  - Visor 2D  │     │  /api/projects/*   (SQLAlchemy)          │   │
│  │  - Gráficas  │     │  /api/calc/*       (Pydantic + NumPy)    │   │
│  │  - Forms     │     │  /api/plans/*      (PyMuPDF + ezdxf)     │   │
│  └─────────────┘     │  /api/reports/*    (ReportLab + openpyxl)│   │
│                       │  /api/ai/*          (LangChain + OpenAI) │   │
│                       └──────────────────────────────────────────┘   │
│                                          │                           │
│                       ┌──────────────────┴──────────────────────┐   │
│                       │  PostgreSQL + pgvector + MinIO/S3       │   │
│                       └─────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────┘
```

**Ventajas:**

- ✅ Un solo stack, un solo lenguaje → simplicidad
- ✅ Ecosistema Python superior para TODO el dominio (cálculos + planos + IA)
- ✅ Más fácil contratar Python devs para este dominio
- ✅ Librerías científicas (NumPy/SciPy) para cálculos eléctricos más precisos
- ✅ pgvector para búsqueda semántica de normativas

**Desventajas:**

- ❌ Reescribir 20K líneas de NestJS (costo: ~3-4 meses)
- ❌ Perder 186 tests existentes (reescribirlos)
- ❌ Curva de migración, riesgo de regresiones
- ❌ Type safety inferior (Pydantic ayuda pero no es TypeScript)

### 7.3 Opción C: NestJS + WASM/FFI (Descartada)

Intentar llamar librerías Python desde Node.js mediante child_process, Pyodide/WASM, o gRPC.

- ❌ Pyodide en Node.js es experimental e inestable
- ❌ child_process es frágil para pipelines complejos
- ❌ gRPC entre Node y Python es básicamente la Opción A pero peor

---

## 8. Stack Tecnológico Recomendado

### 8.1 Recomendación: Arquitectura Híbrida (Opción A) → Migración Gradual

#### Backend Python (Nuevo — Plan Service)

| Componente          | Tecnología                     | Justificación                                                                   |
| ------------------- | ------------------------------ | ------------------------------------------------------------------------------- |
| **Framework**       | **FastAPI**                    | Async nativo, auto-documentación OpenAPI, validación Pydantic, alto rendimiento |
| **PDF parsing**     | **PyMuPDF (fitz)**             | Extracción de paths vectoriales, imágenes, texto. La más rápida y completa      |
| **DXF parsing**     | **ezdxf**                      | Estándar de facto, soporta R12-R2018, entidades complejas                       |
| **Computer Vision** | **OpenCV + scikit-image**      | Detección de contornos, líneas, habitaciones en planos raster                   |
| **Geometría**       | **Shapely**                    | Unión, intersección, área, buffer de polígonos                                  |
| **ML/AI**           | **OpenAI Vision API / YOLOv8** | Reconocimiento de habitaciones en planos escaneados complejos                   |
| **Validación**      | **Pydantic v2**                | Modelos tipados, validación automática, serialización                           |
| **Async tasks**     | **Celery + Redis**             | Procesamiento asíncrono de planos (pueden ser pesados)                          |
| **Testing**         | **Pytest + pytest-asyncio**    | Estándar de la industria                                                        |

#### Backend Existente (NestJS — se mantiene)

| Componente            | Acción                                                                       |
| --------------------- | ---------------------------------------------------------------------------- |
| **Auth/Users**        | Se mantiene igual                                                            |
| **Motor de Cálculo**  | Se mantiene, se expone API interna para Python si es necesario               |
| **PDF/Excel Reports** | Migrar gradualmente a Python (ReportLab > Puppeteer, openpyxl ≈ xlsx)        |
| **API Gateway**       | NestJS actúa como BFF (Backend For Frontend), enruta `/api/plans/*` a Python |

#### Frontend (Cambio Recomendado)

| Componente    | Actual     | Recomendado                                      | Justificación                                                                                     |
| ------------- | ---------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------------- |
| **Framework** | Angular 20 | **React 19 + Next.js** o mantener Angular        | React tiene mejor ecosistema para visualización (Fabric.js, D3, Three.js), pero Angular es viable |
| **Visor 2D**  | —          | **Fabric.js**                                    | Mejor balance features/complejidad para planos                                                    |
| **Gráficas**  | —          | **D3.js**                                        | Treemaps, force layouts para espacios                                                             |
| **UI Kit**    | Datta Able | **Ant Design** o **Mantine**                     | Componentes ricos (upload, tables, forms)                                                         |
| **State**     | —          | **Zustand** (React) o **NgRx/Signals** (Angular) | Estado del plano y espacios reconocidos                                                           |

> **Nota sobre Angular vs React:** Si el equipo tiene experiencia en Angular, mantenlo. La visualización con Fabric.js/D3.js funciona igual en ambos. Si empiezan de cero, React tiene ventajas para visualización interactiva pesada.

---

## 9. Estrategia de Migración

### 9.1 Fases (12 semanas)

```
SEMANA 1-2: Setup Python Service + Integración
├── Crear repo/folder `plan-service/` con FastAPI + estructura
├── Docker Compose con PostgreSQL + Redis + MinIO
├── Endpoint POST /api/plans/upload (PDF/DXF → almacenamiento)
├── Endpoint GET /api/plans/{id}/status (estado del procesamiento)
├── Configurar Celery para procesamiento asíncrono
├── API Gateway: NestJS proxy /api/plans/* → Python:8000
└── Test de integración básico

SEMANA 3-5: Pipeline DXF
├── ezdxf: parser de entidades LWPOLYLINE, LINE, ARC, TEXT, DIMENSION
├── Algoritmo de reconstrucción de polígonos desde líneas
├── Shapely: cálculo de áreas y unión de segmentos
├── Detección de cotas (DIMENSION entities → metros)
├── Clasificación de espacios cerrados vs paredes
├── Inferencia de nombres (MTEXT/TEXT dentro de polígonos)
└── Output JSON estandarizado

SEMANA 6-8: Pipeline PDF
├── PyMuPDF: extracción de paths/caminos vectoriales
├── Conversión de curvas Bézier → segmentos de línea
├── pdf2image + OpenCV para PDF raster (fallback)
├── Algoritmo de detección de habitaciones (contornos cerrados)
├── OCR (Tesseract/EasyOCR) para texto en planos raster
├── Integración con OpenAI Vision para casos complejos (opcional)
└── Output JSON unificado con DXF

SEMANA 9-10: Visualización Frontend
├── Integrar Fabric.js en el frontend
├── Componente VisorPlanos: renderizar polígonos + imagen de fondo
├── Zoom/Pan, selección de espacios, tooltips
├── Modo edición: ajustar vértices, dividir/unir espacios
├── Componente GraficaEspacios: D3 treemap/bubble chart
├── Integración con API: enviar espacios reconocidos al motor de cálculo
└── Flujo completo: subir plano → revisar → calcular

SEMANA 11-12: Pulido + IA + Pruebas
├── Entrenar/fine-tunear YOLOv8 para detección de habitaciones
├── Dataset: 100+ planos etiquetados
├── Feedback loop: usuarios corrigen → reentrenar modelo
├── Pruebas de integración completas
├── Pruebas de usabilidad con 3 técnicos eléctricos
└── Documentación y deploy
```

### 9.2 Migración Gradual NestJS → Python (Opcional, Post-V2)

Si a largo plazo se decide migrar todo a Python:

1. **Fase A (mes 1-2):** Reportes — migrar PDF (Puppeteer→ReportLab) y Excel (xlsx→openpyxl)
2. **Fase B (mes 3-4):** Motor de cálculo — migrar servicios a Python con NumPy
3. **Fase C (mes 5-6):** Auth y usuarios — FastAPI + SQLAlchemy
4. **Fase D (mes 7):** Apagar NestJS, eliminar código legacy

---

## 10. Análisis de Riesgos

| Riesgo                               | Probabilidad | Impacto | Mitigación                                                  |
| ------------------------------------ | ------------ | ------- | ----------------------------------------------------------- |
| **Plano mal escaneado/borroso**      | Alta         | Alto    | Fallback a entrada manual; flag para planos de baja calidad |
| **DXF con entidades no estándar**    | Media        | Medio   | Soporte progresivo de entidades; logging de no soportadas   |
| **Detección incorrecta de espacios** | Alta         | Alto    | Interfaz de corrección manual; confidence score por espacio |
| **Planos sin cotas explícitas**      | Media        | Alto    | Extraer escala del viewport DXF; pedir escala al usuario    |
| **Rendimiento con planos grandes**   | Media        | Medio   | Procesamiento asíncrono; límite de tamaño; streaming        |
| **Complejidad de dos stacks**        | Media        | Medio   | Docker Compose unificado; CI/CD con ambos; documentación    |
| **OpenAI Vision cost**               | Baja         | Bajo    | Solo para fallback; caché de resultados; opción on-prem     |
| **Curva de aprendizaje Python**      | Media        | Medio   | Si el equipo es Node.js-only, requiere capacitación         |

---

## 11. Estimación de Esfuerzo

### 11.1 Roles Necesarios

| Rol                                      | Dedicación      | Duración           |
| ---------------------------------------- | --------------- | ------------------ |
| **Backend Python Dev** (senior)          | Full-time       | 12 semanas         |
| **Frontend Dev** (senior, React/Angular) | Full-time       | 12 semanas         |
| **ML/CV Engineer** (mid-senior)          | Part-time (50%) | Semanas 6-12       |
| **Ingeniero Eléctrico Asesor**           | Part-time (20%) | 12 semanas         |
| **QA/Tester**                            | Part-time (50%) | Semanas 8-12       |
| **DevOps**                               | Part-time (25%) | Semanas 1-4, 10-12 |

### 11.2 Estimación por Fase

| Fase                   | Semanas | Esfuerzo (persona-semanas) |
| ---------------------- | ------- | -------------------------- |
| Setup + Integración    | 1-2     | 4                          |
| Pipeline DXF           | 3-5     | 8                          |
| Pipeline PDF           | 6-8     | 8                          |
| Visualización Frontend | 9-10    | 6                          |
| ML/AI + Pulido         | 11-12   | 8                          |
| **TOTAL**              | **12**  | **34 persona-semanas**     |

> **Costo estimado:** ~$25K-$40K USD (según tarifas de mercado LATAM) para la v2 completa.

---

## 12. Recomendación Final

### 🏆 Arquitectura Recomendada: HÍBRIDA (Opción A)

```
Python FastAPI (Plan Service)  +  NestJS (Business Logic)  +  React (Frontend)
```

### 🥇 Stack Definitivo

| Capa                 | Tecnología                                               | Versión     |
| -------------------- | -------------------------------------------------------- | ----------- |
| **Plan Service**     | Python 3.12 + FastAPI                                    | latest      |
| **Plan Processing**  | PyMuPDF + ezdxf + OpenCV + Shapely                       | latest      |
| **Async Tasks**      | Celery + Redis                                           | latest      |
| **Business Backend** | NestJS 10.x + TypeScript 5.x                             | (existente) |
| **Database**         | PostgreSQL 16 + PostGIS (geometría)                      | latest      |
| **File Storage**     | MinIO (S3-compatible)                                    | latest      |
| **AI/ML**            | OpenAI Vision API (fallback) + YOLOv8 (opcional on-prem) | latest      |
| **Frontend**         | React 19 + TypeScript + Vite                             | latest      |
| **Visor 2D**         | Fabric.js 6.x                                            | latest      |
| **Gráficas**         | D3.js 7.x                                                | latest      |
| **UI Kit**           | Ant Design 5.x                                           | latest      |
| **Container**        | Docker + Docker Compose                                  | latest      |
| **CI/CD**            | GitHub Actions (expandir existente)                      | —           |

### 📋 Resumen de Decisiones

| Decisión                | Elección                 | Por Qué                                                    |
| ----------------------- | ------------------------ | ---------------------------------------------------------- |
| ¿Python o Node.js?      | **Ambos (híbrido)**      | Python para planos/CV, NestJS para negocio                 |
| ¿Migrar todo a Python?  | **No inmediatamente**    | Costo alto de reescribir 20K lines; evaluar post-V2        |
| ¿Angular o React?       | **React (recomendado)**  | Mejor ecosistema visualización; Angular también viable     |
| ¿PDF vs DXF primero?    | **DXF primero**          | Más fácil, resultados más precisos, mayor valor            |
| ¿AI/ML desde el inicio? | **No, fase 2**           | Reglas geométricas cubren 70%; ML para el 30% complejo     |
| ¿Base de datos?         | **PostgreSQL + PostGIS** | Soporte nativo para datos geométricos (columnas GEOGRAPHY) |

---

## 📚 Referencias y Recursos

| Recurso   | URL                             |
| --------- | ------------------------------- |
| PyMuPDF   | https://pymupdf.readthedocs.io/ |
| ezdxf     | https://ezdxf.readthedocs.io/   |
| Shapely   | https://shapely.readthedocs.io/ |
| FastAPI   | https://fastapi.tiangolo.com/   |
| Fabric.js | http://fabricjs.com/            |
| D3.js     | https://d3js.org/               |
| PostGIS   | https://postgis.net/            |
| Celery    | https://docs.celeryq.dev/       |

---

> **¿Preguntas?** Este análisis es el punto de partida. El siguiente paso sería un **PoC técnico de 1 semana** para validar el pipeline DXF→espacios con ezdxf+Shapely y confirmar que la precisión es aceptable antes de comprometer el desarrollo completo.

---

## 13. Decisiones Ejecutivas y Plan de Acción

### 13.1 Decisiones Tomadas (Basadas en el Análisis)

| #      | Decisión                                                     | Fundamentos                                                                                                                                                                                                                       | ¿Cuestionable?                                                                                                                                                                                                                                 |
| ------ | ------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **D1** | **Arquitectura Híbrida:** Python (planos) + NestJS (negocio) | Python duplica el puntaje de Node.js para los nuevos requerimientos (8.45 vs 3.95). Rewriting 20K líneas de NestJS costaría 3-4 meses extra. El híbrido preserva inversión y aprovecha cada lenguaje donde es fuerte.             | 🟡 **Riesgo medio:** Dos stacks = más complejidad operativa. Mitigado con Docker Compose unificado y API Gateway claro. Reevaluar en 6 meses si conviene migrar todo a Python.                                                                 |
| **D2** | **Frontend: Migrar a React 19 + Vite**                       | Mejor ecosistema para visualización interactiva (Fabric.js, D3.js, Three.js). La comunidad React es más grande para componentes de este tipo. Si el equipo ya domina Angular, se puede mantener — pero React es la recomendación. | 🟡 **Cuestionable si el equipo es Angular-only.** La visualización con Fabric.js/D3 funciona en ambos frameworks. Costo de migración del frontend actual (~15% completado) es bajo. Si el equipo tiene expertise Angular fuerte, reconsiderar. |
| **D3** | **PostgreSQL + PostGIS** (reemplazar MariaDB)                | Soporte nativo para columnas GEOGRAPHY, índices espaciales, consultas geo-espaciales para planos. MariaDB no tiene capacidades geoespaciales comparables. pgvector para búsqueda semántica de normativas futura.                  | 🔴 **Impacto alto:** Migración de MariaDB → PostgreSQL requiere migrar TypeORM entities, seeds y migraciones. ~1-2 semanas extra. Vale la pena por PostGIS.                                                                                    |
| **D4** | **DXF primero, PDF después**                                 | ezdxf es más maduro que cualquier alternativa PDF. Los DXF tienen geometría explícita (líneas, cotas, polígonos). PDF requiere interpretación visual más compleja. DXF da valor más rápido y con mayor precisión.                 | 🟢 **Bajo riesgo.** Decisión táctica acertada.                                                                                                                                                                                                 |
| **D5** | **Sin AI/ML en fase inicial**                                | Reglas geométricas (Shapely + OpenCV) cubren ~70% de los casos. ML (YOLOv8, OpenAI Vision) añade complejidad y costo. Se incorpora en semanas 11-12 solo como fallback para casos complejos.                                      | 🟢 **Bajo riesgo.** Enfoque pragmático. Si el 70% de planos son DXF vectoriales, la AI solo será necesaria para escaneados raster de baja calidad.                                                                                             |
| **D6** | **FastAPI para el servicio Python**                          | Async nativo, validación Pydantic, OpenAPI automático, rendimiento comparable a Node.js. Mejor que Flask para APIs modernas.                                                                                                      | 🟢 **Bajo riesgo.** FastAPI es el estándar de facto para APIs Python en 2024-2026.                                                                                                                                                             |
| **D7** | **Celery + Redis para procesamiento asíncrono**              | Los planos pueden ser pesados (5-50MB). Procesarlos en el request HTTP causaría timeouts. Celery permite procesamiento en background con notificación de estado.                                                                  | 🟢 **Bajo riesgo.** Patrón estándar. Redis ya se usa frecuentemente en stacks NestJS.                                                                                                                                                          |
| **D8** | **MinIO para almacenamiento de archivos**                    | S3-compatible, self-hosted, sin costos de AWS S3. Los planos PDF/DXF son archivos grandes que no deben ir a la base de datos.                                                                                                     | 🟢 **Bajo riesgo.** MinIO es maduro y ampliamente usado.                                                                                                                                                                                       |

### 13.2 Decisiones que DEBEN ser validadas antes de ejecutar

| Decisión                 | Quién debe validar        | Qué validar                                                                                                                                                                            |
| ------------------------ | ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **React vs Angular**     | Tech Lead + Frontend Devs | ¿El equipo tiene experiencia en React? ¿Hay capacidad de aprender en el tiempo del proyecto? Si el equipo es Angular, mantenerlo solo añade ~1 semana de trabajo en visualización.     |
| **PostgreSQL + PostGIS** | Backend Lead              | Revisar queries actuales de TypeORM. ¿Hay stored procedures MariaDB-specific? ¿La migración de datos es compleja?                                                                      |
| **PoC DXF → Espacios**   | Python Dev                | Validar en semana 1 que ezdxf + Shapely logran >80% de precisión en extracción de habitaciones con 5 DXF reales de clientes. Si la precisión es menor al 60%, reconsiderar el enfoque. |

### 13.3 Stack Tecnológico Definitivo

```
┌─────────────────────────────────────────────────────────────────┐
│                     STACK V2 — HÍBRIDO                           │
│                                                                 │
│  Frontend:   React 19 + TypeScript + Vite                       │
│              ├── Fabric.js 6.x        (Visor 2D de planos)      │
│              ├── D3.js 7.x            (Gráficas de espacios)     │
│              ├── Ant Design 5.x       (UI Kit)                   │
│              └── Zustand              (Estado global)            │
│                                                                 │
│  Backend:    ┌─ NestJS 10.x (TypeScript) — Lógica de negocio   │
│              │  • Auth, Usuarios, Proyectos                      │
│              │  • Motor de Cálculo Eléctrico                     │
│              │  • API Gateway → enruta /api/plans/* a Python    │
│              │                                                  │
│              └─ FastAPI (Python 3.12) — Pipeline de Planos      │
│                 • PyMuPDF + ezdxf + OpenCV + Shapely            │
│                 • Celery + Redis (async tasks)                  │
│                                                                 │
│  Datos:      PostgreSQL 16 + PostGIS + pgvector                 │
│              MinIO (planos PDF/DXF)                              │
│                                                                 │
│  Infra:      Docker Compose (dev) / K8s (prod opcional)         │
│              GitHub Actions CI/CD                                │
└─────────────────────────────────────────────────────────────────┘
```

### 13.4 Próximos Pasos Inmediatos (Primera Semana)

| Día   | Acción                                                                                   | Responsable                 | Entregable                                                 |
| ----- | ---------------------------------------------------------------------------------------- | --------------------------- | ---------------------------------------------------------- |
| **1** | Crear `plan-service/` con FastAPI + Docker Compose (Python + Redis + MinIO + PostgreSQL) | Backend Python Dev          | Repo funcional con health check                            |
| **2** | Configurar proxy en NestJS: `/api/plans/*` → Python:8000                                 | Backend NestJS Dev          | Request de prueba exitoso                                  |
| **3** | PoC: ezdxf → extraer LWPOLYLINE + LINE → Shapely → polígonos → áreas                     | Python Dev                  | Script con 3 DXF de prueba                                 |
| **4** | Evaluar precisión del PoC con planos reales de clientes (mín. 5)                         | Python Dev + Ing. Eléctrico | Reporte de precisión (% espacios detectados correctamente) |
| **5** | Setup frontend React + Fabric.js hello world (renderizar un rectángulo con zoom/pan)     | Frontend Dev                | Componente `<VisorPlanos>` mínimo                          |

**Gate de salida del PoC (día 5):** Si la precisión de extracción DXF ≥ 80%, se aprueba el desarrollo completo de 12 semanas. Si es menor, se ajusta la estrategia (más AI, más intervención manual, o pivot).

### 13.5 KPIs de Éxito del Proyecto

| KPI                                          | Meta                                | Cómo se mide                                              |
| -------------------------------------------- | ----------------------------------- | --------------------------------------------------------- |
| **Precisión de detección de espacios (DXF)** | ≥ 85%                               | % de espacios correctamente identificados vs ground truth |
| **Precisión de áreas (m²)**                  | Error ≤ 5%                          | Diferencia entre área calculada y cota del plano          |
| **Tiempo de procesamiento**                  | ≤ 30s para plano DXF típico (2-5MB) | Medido desde upload hasta resultado JSON                  |
| **Usabilidad**                               | Usuario corrige plano en ≤ 5 min    | Test con 3 técnicos eléctricos                            |
| **Cobertura de tests (Python)**              | ≥ 70%                               | Pytest coverage                                           |

---

_Decisiones ejecutivas derivadas del análisis de factibilidad. Julio 2026._

---

_Análisis preparado como arquitecto de software senior + product owner. Julio 2026._
