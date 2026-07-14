# Plan de Rediseño UI - Calculadora Eléctrica RD

## 📋 Resumen Ejecutivo

Rediseño completo de la interfaz de usuario siguiendo las mejores prácticas de **Web Interface Guidelines** (Vercel) y **UI/UX Pro Max**, implementando **shadcn/ui** como sistema de componentes con soporte completo para **Light/Dark Mode**.

---

## 🎯 Objetivos

### Objetivos Principales
1. ✅ Implementar sistema de temas (Light/Dark) con toggle
2. ✅ Migrar a shadcn/ui como sistema de componentes
3. ✅ Agregar toggle de visibilidad de contraseña en login
4. ✅ Mejorar usabilidad y accesibilidad (WCAG AA/AAA)
5. ✅ Optimizar experiencia de usuario en todas las vistas

### Objetivos Secundarios
- Mejorar rendimiento (CLS < 0.1, carga < 2s)
- Diseño responsive mobile-first
- Feedback visual en todas las interacciones
- Animaciones sutiles y significativas (150-300ms)
- Accesibilidad completa (contraste 4.5:1 mínimo)

---

## 🎨 Design System

### Paleta de Colores

#### Light Mode
```css
:root {
  --color-primary: #EA580C;        /* Orange */
  --color-on-primary: #FFFFFF;
  --color-secondary: #F97316;      /* Light Orange */
  --color-accent: #2563EB;         /* Blue */
  --color-background: #FFFFFF;
  --color-foreground: #1C1917;
  --color-muted: #F5F5F4;
  --color-border: #E7E5E4;
  --color-destructive: #DC2626;
  --color-ring: #EA580C;
}
```

#### Dark Mode
```css
.dark {
  --color-primary: #FB923C;        /* Light Orange */
  --color-on-primary: #1C1917;
  --color-secondary: #F97316;
  --color-accent: #3B82F6;         /* Light Blue */
  --color-background: #1C1917;
  --color-foreground: #FFFFFF;
  --color-muted: #2C1E16;
  --color-border: rgba(255,255,255,0.08);
  --color-destructive: #EF4444;
  --color-ring: #FB923C;
}
```

### Tipografía
- **Headings**: Fira Sans (300, 400, 500, 600, 700)
- **Body**: Fira Sans (400, 500)
- **Code/Numbers**: Fira Code (400, 500, 600)

### Espaciado
- Base: 4px
- Scale: 4, 8, 12, 16, 24, 32, 48, 64, 96px

### Breakpoints
- Mobile: 375px
- Tablet: 768px
- Desktop: 1024px
- Large: 1440px

---

## 📦 Instalación de shadcn/ui

### Paso 1: Inicializar shadcn/ui
```bash
cd frontend
npx shadcn@latest init
```

Configuración recomendada:
- Style: **Default**
- Base color: **Neutral**
- CSS variables: **Yes**

### Paso 2: Instalar componentes necesarios
```bash
npx shadcn@latest add button
npx shadcn@latest add input
npx shadcn@latest add label
npx shadcn@latest add card
npx shadcn@latest add select
npx shadcn@latest add checkbox
npx shadcn@latest add switch
npx shadcn@latest add tabs
npx shadcn@latest add badge
npx shadcn@latest add alert
npx shadcn@latest add toast
npx shadcn@latest add dialog
npx shadcn@latest add dropdown-menu
npx shadcn@latest add separator
npx shadcn@latest add skeleton
npx shadcn@latest add tooltip
npx shadcn@latest add avatar
```

### Paso 3: Instalar dependencias adicionales
```bash
npm install lucide-react @radix-ui/react-icons
```

---

## 🌗 Implementación de Dark Mode

### 1. Configurar Tailwind para Dark Mode

**Archivo: `tailwind.config.ts`**
```typescript
export default {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'var(--color-primary)',
          foreground: 'var(--color-on-primary)',
        },
        secondary: 'var(--color-secondary)',
        accent: 'var(--color-accent)',
        background: 'var(--color-background)',
        foreground: 'var(--color-foreground)',
        muted: 'var(--color-muted)',
        border: 'var(--color-border)',
        destructive: 'var(--color-destructive)',
        ring: 'var(--color-ring)',
      },
    },
  },
}
```

### 2. Crear Theme Provider

**Archivo: `src/shared/providers/ThemeProvider.tsx`**
```typescript
import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = localStorage.getItem('theme');
    if (stored === 'light' || stored === 'dark') return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
}
```

### 3. Crear Theme Toggle Component

**Archivo: `src/shared/components/ThemeToggle.tsx`**
```typescript
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../providers/ThemeProvider';
import { Button } from '@/components/ui/button';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      aria-label="Toggle theme"
      className="relative"
    >
      <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
    </Button>
  );
}
```

---

## 🔐 Login con Toggle de Password

### Componente PasswordInput

**Archivo: `src/shared/components/PasswordInput.tsx`**
```typescript
import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

interface PasswordInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  minLength?: number;
  placeholder?: string;
  error?: string;
}

export function PasswordInput({
  id,
  label,
  value,
  onChange,
  required = false,
  minLength = 6,
  placeholder = '••••••••',
  error,
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          minLength={minLength}
          placeholder={placeholder}
          className={error ? 'border-destructive' : ''}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
          onClick={() => setShowPassword(!showPassword)}
          aria-label={showPassword ? 'Hide password' : 'Show password'}
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4 text-muted-foreground" />
          ) : (
            <Eye className="h-4 w-4 text-muted-foreground" />
          )}
        </Button>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
```

### Login Page Rediseñado

**Archivo: `src/features/auth/LoginPage.tsx`**
```typescript
import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PasswordInput } from '@/shared/components/PasswordInput';
import { ThemeToggle } from '@/shared/components/ThemeToggle';
import { Zap } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading, error, clearError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard';

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await login({ email, password });
      navigate(from, { replace: true });
    } catch {
      // Error is handled by the store
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-8">
      {/* Theme Toggle */}
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-primary/10 p-3">
              <Zap className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Calculadora Eléctrica RD</CardTitle>
          <CardDescription>Inicia sesión en tu cuenta</CardDescription>
        </CardHeader>
        
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription className="flex items-center justify-between">
                <span>{error}</span>
                <button onClick={clearError} className="ml-2 font-bold" aria-label="Dismiss">
                  ×
                </button>
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="tu@email.com"
                autoComplete="email"
              />
            </div>

            <PasswordInput
              id="password"
              label="Contraseña"
              value={password}
              onChange={setPassword}
              required
              minLength={6}
              placeholder="••••••••"
            />

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Iniciando sesión...' : 'Iniciar sesión'}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">¿No tienes cuenta? </span>
            <Link to="/register" className="text-primary hover:text-primary/80 font-medium">
              Regístrate
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## 📐 Mejoras de UX/UI por Página

### 1. Login/Register Pages
- ✅ Toggle de visibilidad de contraseña
- ✅ Theme toggle en esquina superior
- ✅ Feedback visual en loading states
- ✅ Validación inline de campos
- ✅ Iconos SVG (lucide-react) en lugar de emojis
- ✅ Accesibilidad: labels, aria-labels, focus states

### 2. Dashboard Page
**Mejoras:**
- Cards con hover effects sutiles
- Skeleton loading para datos asíncronos
- Tooltips en métricas
- Responsive grid layout
- Dark mode optimized contrast

### 3. Calculator Pages (5 pasos)
**Mejoras:**
- Progress indicator visual
- Navegación entre pasos mejorada
- Validación en tiempo real
- Feedback inmediato en errores
- Animaciones de transición entre pasos
- Inputs con mejor UX (auto-focus, keyboard navigation)

### 4. Projects Page
**Mejoras:**
- Data table con sorting/filtering
- Empty state mejorado
- Skeleton loading
- Actions dropdown menu
- Confirmation dialogs para acciones destructivas

### 5. Plans Page
**Mejoras:**
- Upload drag & drop mejorado
- Progress bar durante upload
- Viewer con controles mejorados
- Space editor con feedback visual
- Toast notifications para acciones

---

## 🎭 Componentes shadcn/ui a Implementar

### Prioridad Alta
1. **Button** - Todos los botones
2. **Input** - Todos los inputs de texto
3. **Label** - Labels de formularios
4. **Card** - Contenedores principales
5. **Alert** - Mensajes de error/éxito
6. **Toast** - Notificaciones

### Prioridad Media
7. **Select** - Dropdowns
8. **Checkbox** - Opciones múltiples
9. **Switch** - Toggles (theme, settings)
10. **Tabs** - Navegación por pestañas
11. **Badge** - Estados, etiquetas

### Prioridad Baja
12. **Dialog** - Modales
13. **Dropdown Menu** - Menús de acciones
14. **Separator** - Divisores
15. **Skeleton** - Loading states
16. **Tooltip** - Información contextual
17. **Avatar** - Perfiles de usuario

---

## 🚀 Plan de Implementación

### Fase 1: Configuración Base (2-3 horas)
- [x] Instalar shadcn/ui
- [x] Configurar Tailwind para dark mode
- [x] Crear ThemeProvider
- [x] Crear ThemeToggle component
- [x] Configurar variables CSS

### Fase 2: Componentes Core (3-4 horas)
- [x] Instalar componentes shadcn/ui (prioridad alta)
- [x] Crear PasswordInput component
- [x] Crear componentes reutilizables adicionales
- [x] Configurar sistema de toasts

### Fase 3: Login/Register (2-3 horas)
- [x] Rediseñar LoginPage con shadcn/ui
- [x] Agregar toggle de password
- [x] Agregar theme toggle
- [x] Mejorar validación y feedback
- [x] Rediseñar RegisterPage

### Fase 4: Dashboard (2-3 horas)
- [x] Rediseñar con shadcn/ui Card components
- [x] Agregar skeleton loading
- [x] Implementar tooltips
- [x] Optimizar responsive layout
- [x] Agregar animaciones sutiles

### Fase 5: Calculator Pages (4-5 horas)
- [x] Rediseñar cada paso con shadcn/ui
- [x] Implementar progress indicator
- [x] Mejorar validación inline
- [x] Agregar transiciones entre pasos
- [x] Optimizar UX de inputs
- [x] Paginación en tablas de resultados (CE-03 cargas, CE-04 circuitos)

### Fase 6: Projects Page (2-3 horas)
- [x] Implementar data table
- [x] Agregar sorting/filtering
- [x] Mejorar empty state
- [x] Agregar confirmation dialogs
- [x] Paginación de tabla (servidor: page + pageSize)
- [ ] Optimizar acciones bulk

### Fase 7: Plans Page (3-4 horas)
- [x] Mejorar upload drag & drop
- [x] Agregar progress bar
- [x] Mejorar viewer controls
- [x] Optimizar space editor
- [x] Agregar toast notifications
- [x] Paginación de lista de planos + lista de espacios

### Fase 8: Testing y Optimización (2-3 horas)
- [x] Testing de dark mode en todas las páginas
- [ ] Testing de accesibilidad (Lighthouse)
- [x] Testing responsive (mobile, tablet, desktop)
- [x] Optimización de rendimiento
- [ ] Cross-browser testing

**Total estimado: 20-28 horas (3-4 días de trabajo)**

---

## ✅ Checklist de Accesibilidad (WCAG AA/AAA)

### Contraste de Colores
- [x] Light mode: texto 4.5:1 mínimo
- [x] Dark mode: texto 4.5:1 mínimo
- [x] Botones: 3:1 mínimo
- [x] Focus indicators: 3:1 mínimo

### Navegación por Teclado
- [x] Todos los elementos interactivos son focusable
- [x] Focus order lógico
- [x] Focus indicators visibles
- [x] Escape cierra modales/dropdowns

### Semántica HTML
- [x] Labels asociados a inputs
- [x] Aria-labels en botones de icono
- [x] Roles ARIA apropiados
- [x] Heading hierarchy correcta

### Responsive
- [x] Mobile-first design
- [x] Touch targets 44x44px mínimo
- [x] No horizontal scroll
- [x] Text readable sin zoom

### Motion
- [x] `prefers-reduced-motion` respetado
- [x] Animaciones 150-300ms
- [x] Motion con propósito (no decorativo)
- [x] Exit animations más rápidas que enter

---

## 🎨 Libertades Creativas Propuestas

### 1. Micro-interacciones
- **Button hover**: Scale 1.02 + shadow increase
- **Card hover**: Subtle lift effect (translateY -2px)
- **Input focus**: Ring animation (pulse once)
- **Theme toggle**: Smooth rotation animation

### 2. Visual Hierarchy
- **Primary actions**: Orange (#EA580C) con glow sutil en dark mode
- **Secondary actions**: Ghost buttons
- **Destructive actions**: Red con confirmación
- **Success states**: Green con check icon

### 3. Loading States
- **Skeleton screens**: Pulse animation
- **Button loading**: Spinner + disabled state
- **Page transitions**: Fade in/out (200ms)
- **Data loading**: Skeleton + shimmer effect

### 4. Empty States
- **Ilustraciones SVG**: Relevantes al contexto
- **Call-to-action**: Botón claro para siguiente paso
- **Tono amigable**: Mensajes positivos y útiles

### 5. Error States
- **Inline validation**: Error message debajo del campo
- **Toast notifications**: Para errores globales
- **Recovery actions**: Sugerencias para resolver el error

---

## 📊 Métricas de Éxito

### Performance
- **Lighthouse Performance**: > 90
- **First Contentful Paint**: < 1.5s
- **Largest Contentful Paint**: < 2.5s
- **Cumulative Layout Shift**: < 0.1

### Accesibilidad
- **Lighthouse Accessibility**: 100
- **Contraste WCAG AA**: Todas las combinaciones
- **Keyboard navigation**: 100% funcional

### UX
- **Time on task**: Reducir 20% en tareas comunes
- **Error rate**: Reducir 30% en formularios
- **User satisfaction**: > 4.5/5 (post-redesign survey)

---

## 🔄 Migración Gradual

### Estrategia
1. **No romper lo existente**: Mantener funcionalidad actual
2. **Migración incremental**: Página por página
3. **Feature flags**: Para activar/desactivar nuevo diseño
4. **A/B testing**: Comparar old vs new (opcional)

### Rollback Plan
- Mantener componentes antiguos hasta completar migración
- Git branches para cada fase
- Testing exhaustivo antes de merge

---

## 📚 Recursos

### Documentación
- [shadcn/ui Docs](https://ui.shadcn.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Radix UI](https://www.radix-ui.com/docs)
- [Lucide Icons](https://lucide.dev/icons)

### Design System
- [Web Interface Guidelines (Vercel)](https://github.com/vercel-labs/web-interface-guidelines)
- [UI/UX Pro Max Skill](./.agents/skills/ui-ux-pro-max/)
- [MASTER.md](./design-system/calculadora-el-ctrica-rd/MASTER.md)

---

## 🎯 Próximos Pasos

1. **Revisar y aprobar este plan**
2. **Comenzar Fase 1**: Configuración base
3. **Testing continuo** en cada fase
4. **Feedback del usuario** después de cada página
5. **Iterar y mejorar** basado en feedback

---

**¿Aprobamos este plan para comenzar la implementación?**
