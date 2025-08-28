# Frontend IA - Electridom

## Descripción General

El módulo de IA en el frontend de Electridom proporciona una interfaz moderna y intuitiva para interactuar con el sistema de inteligencia artificial local (Ollama) y servicios externos (OpenAI). Utiliza Angular 20 con Signals para una experiencia de usuario reactiva y eficiente.

## Arquitectura

### Estructura del Módulo

```
src/app/features/ia/
├── components/
│   ├── chat-ia/           # Chat interactivo con IA
│   ├── calculos-ia/       # Formularios de cálculos eléctricos
│   ├── dashboard-cargas/  # Dashboard con gráficos
│   ├── unifilar-svg/      # Generación de diagramas unifilares
│   └── export-reports/    # Exportación PDF/Excel
├── services/
│   └── ia.service.ts      # Servicio principal de IA
├── ia-routing-module.ts   # Configuración de rutas
└── ia-module.ts          # Módulo principal
```

### Tecnologías Utilizadas

- **Angular 20**: Framework principal
- **Angular Signals**: Reactividad moderna
- **Reactive Forms**: Formularios dinámicos
- **Chart.js**: Gráficos y visualizaciones
- **jsPDF**: Generación de PDFs
- **XLSX**: Exportación a Excel
- **Font Awesome**: Iconografía
- **SSE (Server-Sent Events)**: Streaming de respuestas

## Componentes

### 1. Chat IA (`/ia/chat`)

**Funcionalidades:**

- Conversación en tiempo real con Electridom
- Streaming de respuestas con animación de escritura
- Historial de conversaciones
- Limpieza de chat
- Interfaz responsive

**Características técnicas:**

- Uso de Angular Signals para estado reactivo
- Streaming con `fetch()` API
- Manejo de errores gracioso
- Animaciones CSS personalizadas

### 2. Cálculos IA (`/ia/calculos`)

**Funcionalidades:**

- Formularios dinámicos para superficies y consumos
- Configuración de sistema eléctrico
- Cálculos en tiempo real con IA
- Visualización de resultados estructurados
- Validación de formularios

**Características técnicas:**

- Reactive Forms con FormArrays
- Validación en tiempo real
- Interfaz de dos columnas (formulario/resultados)
- Estados de carga y error

### 3. Dashboard de Cargas (`/ia/dashboard`)

**Funcionalidades:**

- Gráficos de distribución de cargas
- Análisis de consumos por ambiente
- Métricas de eficiencia energética
- Comparativas de normativas

**Características técnicas:**

- Chart.js para visualizaciones
- Gráficos interactivos
- Responsive design
- Exportación de gráficos

### 4. Diagrama Unifilar (`/ia/unifilar`)

**Funcionalidades:**

- Generación automática de diagramas unifilares
- Visualización SVG interactiva
- Personalización de elementos
- Exportación en múltiples formatos

**Características técnicas:**

- Generación SVG dinámica
- Zoom y pan interactivo
- Exportación a PNG/SVG
- Integración con cálculos IA

### 5. Exportación de Reportes (`/ia/export`)

**Funcionalidades:**

- Generación de reportes PDF completos
- Exportación a Excel con fórmulas
- Plantillas personalizables
- Inclusión de diagramas y gráficos

**Características técnicas:**

- jsPDF para PDFs
- XLSX para Excel
- Plantillas HTML a PDF
- Compresión de archivos

## Servicios

### IaService

**Métodos principales:**

```typescript
// Cálculos eléctricos
calculate(request: CalcRequest): Observable<CalcResponse>

// Explicaciones con streaming
explain(request: ExplainRequest): Observable<StreamResponse>
explainWithFetch(request: ExplainRequest): Observable<StreamResponse>

// Información del sistema
getProviderInfo(): Observable<ProviderInfo>
getHealth(): Observable<HealthStatus>
```

**Interfaces principales:**

```typescript
interface CalcRequest {
	system: SystemConfig;
	superficies: Environment[];
	consumos: Consumption[];
	model?: string;
	temperature?: number;
}

interface CalcResponse {
	summary: string;
	calculations: {
		demand: { total_va: string; diversified_va: string; current_a: string };
		conductors: { main_feeder: string; branch_circuits: string };
		protections: { main_breaker: string; branch_breakers: string };
	};
	compliance: { status: string; issues: string[]; recommendations: string[] };
	safety: { level: string; concerns: string[] };
	metadata: {
		correlationId: string;
		provider: string;
		model: string;
		duration: number;
	};
}
```

## Rutas

| Ruta            | Componente               | Descripción             |
| --------------- | ------------------------ | ----------------------- |
| `/ia`           | Redirect                 | Redirige a `/ia/chat`   |
| `/ia/chat`      | ChatIaComponent          | Chat interactivo        |
| `/ia/calculos`  | CalculosIaComponent      | Formularios de cálculos |
| `/ia/dashboard` | DashboardCargasComponent | Dashboard con gráficos  |
| `/ia/unifilar`  | UnifilarSvgComponent     | Diagramas unifilares    |
| `/ia/export`    | ExportReportsComponent   | Exportación de reportes |

## Configuración

### Variables de Entorno

```typescript
// environments/environment.ts
export const environment = {
	production: false,
	apiUrl: 'http://localhost:3000/api',
};
```

### Dependencias

```json
{
	"chart.js": "^4.0.0",
	"ng2-charts": "^5.0.0",
	"jspdf": "^2.5.0",
	"jspdf-autotable": "^3.8.0",
	"xlsx": "^0.18.0",
	"file-saver": "^2.0.5"
}
```

## Uso

### Acceso al Módulo

1. Navegar a `/ia` en la aplicación
2. Seleccionar la funcionalidad deseada desde el menú
3. Interactuar con los componentes según la necesidad

### Ejemplo de Uso del Chat

```typescript
// En un componente
constructor(private iaService: IaService) {}

sendQuestion(question: string) {
  const request: ExplainRequest = {
    question,
    temperature: 0.7
  };

  this.iaService.explainWithFetch(request).subscribe({
    next: (response) => {
      // Manejar respuesta en streaming
    },
    error: (error) => {
      // Manejar error
    }
  });
}
```

## Características Avanzadas

### Streaming de Respuestas

El sistema utiliza Server-Sent Events (SSE) para streaming de respuestas en tiempo real, proporcionando una experiencia de usuario fluida similar a ChatGPT.

### Fallback Automático

El sistema implementa fallback automático entre proveedores de IA:

1. Ollama (local) - Proveedor principal
2. OpenAI - Fallback opcional

### Validación Inteligente

Los formularios incluyen validación en tiempo real basada en normativas eléctricas dominicanas (RIE-DO, NEC 2023, REBT).

### Responsive Design

Todos los componentes están optimizados para dispositivos móviles, tablets y desktop.

## Mantenimiento

### Actualización de Dependencias

```bash
npm update chart.js ng2-charts jspdf xlsx
```

### Compilación

```bash
npm run build
```

### Desarrollo

```bash
npm run start
```

## Troubleshooting

### Problemas Comunes

1. **Error de CORS**: Verificar configuración del backend
2. **Streaming no funciona**: Verificar conectividad con Ollama
3. **Gráficos no se renderizan**: Verificar Chart.js está cargado
4. **Exportación falla**: Verificar permisos de escritura

### Logs

Los errores se registran en la consola del navegador con prefijos específicos:

- `[IaService]`: Errores del servicio
- `[ChatIA]`: Errores del chat
- `[CalculosIA]`: Errores de cálculos

## Contribución

Para contribuir al módulo de IA:

1. Seguir las convenciones de Angular
2. Usar Angular Signals para estado
3. Implementar manejo de errores
4. Agregar tests unitarios
5. Documentar cambios

## Roadmap

### Próximas Funcionalidades

- [ ] Integración con más modelos de IA
- [ ] Análisis predictivo de cargas
- [ ] Optimización automática de instalaciones
- [ ] Integración con BIM
- [ ] Realidad aumentada para inspecciones
