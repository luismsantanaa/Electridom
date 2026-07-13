# Calculadora Eléctrica RD - Frontend

Frontend React 19 + Vite + TypeScript para la Calculadora Eléctrica RD.

## 🚀 Tecnologías

- **React 19** - Biblioteca de UI
- **Vite 6** - Build tool y dev server
- **TypeScript 5** - Type safety
- **Tailwind CSS 4** - Estilos
- **React Router 7** - Routing
- **Zustand 5** - State management
- **React Query 5** - Server state
- **Fabric.js 6** - Visor 2D de planos
- **D3.js 7** - Gráficas interactivas
- **Axios** - HTTP client
- **Vitest** - Testing

## 📦 Instalación

```bash
# Instalar dependencias
npm install
```

## 🛠️ Desarrollo

```bash
# Iniciar servidor de desarrollo (puerto 4200)
npm run dev

# Build para producción
npm run build

# Preview del build de producción
npm run preview

# Linting
npm run lint

# Tests
npm run test

# Tests con coverage
npm run test:coverage
```

## 📁 Estructura

```
src/
├── app/
│   ├── App.tsx              # Componente raíz
│   ├── routes.tsx           # Configuración de rutas
│   └── providers.tsx        # Providers (QueryClient, etc.)
├── features/
│   ├── auth/                # Autenticación
│   │   ├── LoginPage.tsx
│   │   ├── RegisterPage.tsx
│   │   ├── useAuth.ts       # Zustand store
│   │   └── useAuth.test.ts
│   ├── calc/                # Calculadora eléctrica
│   │   ├── CalculatorPage.tsx
│   │   ├── RoomsForm.tsx    # CE-01
│   │   ├── DemandForm.tsx   # CE-02
│   │   ├── CircuitsForm.tsx # CE-03
│   │   ├── FeederForm.tsx   # CE-04
│   │   ├── GroundingForm.tsx # CE-05
│   │   ├── ResultsView.tsx
│   │   └── useCalculations.ts
│   ├── plans/               # Planos y visor
│   │   ├── PlansPage.tsx
│   │   ├── PlanUploader.tsx
│   │   ├── PlanViewer.tsx   # Fabric.js
│   │   ├── SpaceEditor.tsx
│   │   └── SpaceGraphics.tsx # D3.js
│   └── projects/            # Gestión de proyectos
│       ├── ProjectsPage.tsx
│       └── useProjects.ts
├── shared/
│   ├── api/                 # API clients
│   │   ├── client.ts        # Axios instance + interceptors
│   │   ├── auth.api.ts
│   │   ├── calc.api.ts
│   │   ├── plans.api.ts
│   │   └── projects.api.ts
│   ├── components/          # Componentes compartidos
│   │   ├── Layout.tsx
│   │   ├── Sidebar.tsx
│   │   ├── Header.tsx
│   │   └── ProtectedRoute.tsx
│   ├── hooks/               # Hooks compartidos
│   └── types/               # TypeScript types
│       ├── auth.types.ts
│       ├── calc.types.ts
│       ├── plan.types.ts
│       └── project.types.ts
├── test/
│   └── setup.ts             # Configuración de Vitest
├── index.css                # Tailwind imports
└── main.tsx                 # Entry point
```

## 🔑 Features

### Autenticación

- Login/Registro con JWT
- Refresh automático de tokens
- Rutas protegidas
- Estado global con Zustand

### Calculadora Eléctrica

Flujo de 5 pasos:

1. **CE-01: Habitaciones** - Cálculo de cargas por ambiente
2. **CE-02: Demanda** - Factores de demanda
3. **CE-03: Circuitos** - Agrupación de circuitos ramales
4. **CE-04: Alimentadores** - Caída de tensión
5. **CE-05: Puesta a Tierra** - Sistema de tierra

### Gestión de Planos

- **Upload:** Drag & drop de PDF/DXF
- **Procesamiento:** Polling de estado (Celery)
- **Visor 2D:** Fabric.js con zoom/pan, polígonos, tooltips
- **Gráficas:** D3.js treemap/bubble chart
- **Editor:** Verificar/corregir/dividir/unir espacios
- **Export:** PNG del visor

### Proyectos

- CRUD completo
- Búsqueda y paginación
- Integración con backend

## 🔧 Configuración

### Proxy de Desarrollo

Vite proxy para API calls:

```typescript
// vite.config.ts
server: {
  port: 4200,
  proxy: {
    '/api': {
      target: 'http://localhost:3000',
      changeOrigin: true,
    },
    '/plans': {
      target: 'http://localhost:8000',
      changeOrigin: true,
    },
  },
}
```

### Path Aliases

```typescript
// tsconfig.json
"@features/*": ["src/features/*"],
"@shared/*": ["src/shared/*"]
```

## 🧪 Testing

```bash
# Ejecutar tests
npm run test

# Tests en watch mode
npm run test:watch

# Coverage
npm run test:coverage
```

Tests incluidos:

- Auth store (useAuth)
- API clients (calc, projects)
- Componentes principales

## 📊 Build

```bash
# Build producción
npm run build

# Output: dist/
# - index.html
# - assets/*.js (344KB)
# - assets/*.css (16KB)
```

## 🔒 Seguridad

- JWT tokens en localStorage
- Refresh automático antes de expiración
- Interceptor Axios para 401
- Rutas protegidas con ProtectedRoute
- CORS configurado en backend

## 🎨 Estilos

- **Tailwind CSS 4** - Utility-first
- **Componentes inline** - Estilos con Tailwind
- **Responsive** - Mobile-first design

## 📚 Rutas

```
/login              - Login
/register           - Registro
/dashboard          - Dashboard (protegida)
/calculator         - Calculadora (protegida)
/projects           - Proyectos (protegida)
/plans              - Planos (protegida)
```

## 🚀 Deploy

### Build para producción

```bash
npm run build
```

### Servir con Node

```bash
npm install -g serve
serve -s dist -l 4200
```

### Docker

```dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
```

## 📖 Documentación

- [README principal](../README.md)
- [Estado del proyecto](../ESTADO_PROYECTO.md)
- [AGENTS.md](../AGENTS.md)

## 🤝 Contribución

1. Fork el proyecto
2. Crear rama feature (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

## 📄 Licencia

MIT

---

**Desarrollado con React 19 + Vite + TypeScript**
