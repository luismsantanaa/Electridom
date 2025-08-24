
# Prompt para Cursor — **Prerequisito Sprint 3**  
**Proyecto:** Calculadora Eléctrica RD  
**Fecha:** 2025-08-23

> Objetivo: crear y organizar el **Frontend Angular 20** usando el **template Datta Able (Lite)** como base, limpiar demos y dejar solo layout/routing/estilos, integrarlo al monorepo actual junto al backend NestJS, y preparar la estructura para las historias del Sprint 3.

---

## 0) Variables del proyecto (ajústalas aquí)
- `ROOT_DIR = CalculadoraElecticaRD`  
- `BACK_DIR = calculadora-electrica-backend`  *(ya existe en git)*  
- `FRONT_DIR = calculadora-electrica-frontend`  
- `API_BASE_DEV = http://localhost:3000`  *(NestJS del backend)*  
- `API_PREFIX = /api`  

> Si prefieres otro nombre de carpeta frontend (p.ej. `calculadora-electrica-fronten`), cambia `FRONT_DIR` y **mantén consistencia** en todos los pasos.

---

## 1) Preparación del monorepo (estructura raíz)

**Acciones**  
1. Verificar estructura base del repo (existe `BACK_DIR`):  
   ```bash
   cd {{ROOT_DIR}} && ls -la
   ```
2. Asegurar housekeeping en la raíz:  
   - `.gitignore` (ignorar `node_modules`, `dist`, `coverage`, `*.log` de **ambos** proyectos).  
   - `.editorconfig` (espacios, EOL, charset).  
   - `README.md` (sección Frontend con comandos básicos).  

**Resultado esperado**  
```
{{ROOT_DIR}}/
  {{BACK_DIR}}/
  {{FRONT_DIR}}/   (se creará en el siguiente paso)
  .gitignore
  .editorconfig
  README.md
```

---

## 2) Descarga e integración del **template Datta Able (Angular)**

> URL referencia:  
> - Landing: https://codedthemes.com/item/datta-able-angular-lite/?no-caching=1  
> - Preview: https://codedthemes.com/demos/admin-templates/datta-able/angular/free/dashboard  

**Ramas**  
- Crear rama de trabajo:  
  ```bash
  cd {{ROOT_DIR}} && git checkout -b feat/frontend-bootstrap
  ```

**Opción A — Plantilla primero, luego Angular 20**  
1. Crear carpeta del frontend:  
   ```bash
   mkdir -p {{ROOT_DIR}}/{{FRONT_DIR}} && cd {{ROOT_DIR}}/{{FRONT_DIR}} 
   ```
2. **Descargar** el ZIP del template (si hay enlace directo):  
   ```bash
   # Reemplaza DOWNLOAD_URL por el enlace de descarga directa de la plantilla
   curl -L "DOWNLOAD_URL" -o datta-able-angular-lite.zip
   unzip datta-able-angular-lite.zip -d ./_template
   ```
   > Si **no hay** enlace directo, **descarga manualmente** y coloca el ZIP en `{{FRONT_DIR}}/datta-able-angular-lite.zip` y repite el `unzip`.
3. Inicializar proyecto Angular 20 (standalone + routing + scss):  
   ```bash
   npx -y @angular/cli@^20 new . --standalone --routing --style=scss --skip-git
   ```
4. **Integrar el template**:
   - Copiar desde `./_template` a tu `src/` las partes de **layout**, **estilos**, **assets** y utilidades comunes del template (por ejemplo: componentes de shell: header, sidebar, layout base).  
   - Mantener tu `main.ts` y `app.config.ts` de Angular 20.  
   - Ajustar estilos globales (`src/styles.scss`) e importaciones de fuentes/íconos si el template lo requiere.  

**Opción B — Angular 20 primero, luego template** *(recomendada; similar a la A pero más limpia)*  
1. Dentro de `{{ROOT_DIR}}` crear `{{FRONT_DIR}}` con Angular 20:  
   ```bash
   cd {{ROOT_DIR}} && npx -y @angular/cli@^20 new {{FRONT_DIR}} --standalone --routing --style=scss --skip-git
   ```
2. Descargar/colocar el ZIP del template en `{{FRONT_DIR}}/`, descomprimir a `{{FRONT_DIR}}/_template/` y **copiar únicamente**:  
   - **Layout** (shell), navegación (header/sidenav), estilos base, variables SCSS, assets del tema.  
   - Evitar páginas demo, mocks y servicios de ejemplo.  

**Limpieza de demos (Checklist)**  
- Eliminar rutas de dashboard/demo, módulos/páginas ejemplo, mock data.  
- Conservar **layout/shell**, **routing base**, **theming**, **assets** (íconos, fuentes), helpers UI útiles.  
- Actualizar `app.routes.ts` para dejar solo una ruta hacia la **feature `calc`** (se creará en el Paso 4).  

**Verificación**  
```bash
cd {{ROOT_DIR}}/{{FRONT_DIR}} && npm install && npm run start
# Debe levantar el shell (layout) sin páginas demo
```

---

## 3) Configuración de desarrollo (proxy, interceptor, environments)

**Proxy dev** *(evita CORS y usa el backend local)*  
1. Crear `proxy.conf.json` en `{{FRONT_DIR}}/`:
   ```json
   {{
     "/api": {{
       "target": "{API_BASE_DEV}",
       "secure": false,
       "changeOrigin": true
     }}
   }}
   ```
2. En `{{FRONT_DIR}}/package.json` agregar script:  
   ```json
   {{
     "scripts": {{
       "start": "ng serve --proxy-config proxy.conf.json"
     }}
   }}
   ```

**Interceptor JWT**  
1. Crear `src/app/core/http/auth.interceptor.ts` (standalone, Angular 20):  
   ```ts
   import {{ HttpInterceptorFn }} from '@angular/common/http';
   export const authInterceptor: HttpInterceptorFn = (req, next) => {{
     const token = localStorage.getItem('access_token');
     return next(token ? req.clone({{ setHeaders: {{ Authorization: `Bearer ${token}` }} }}) : req);
   }};
   ```
2. Registrar en `main.ts`:  
   ```ts
   import {{ provideHttpClient, withInterceptors }} from '@angular/common/http';
   import {{ authInterceptor }} from './app/core/http/auth.interceptor';
   // ...
   bootstrapApplication(AppComponent, {{
     providers: [
       provideHttpClient(withInterceptors([authInterceptor])),
       // ...
     ],
   }});
   ```

**Resultado esperado**  
- Las llamadas a `{{API_PREFIX}}/*` se enrutan al backend en `{API_BASE_DEV}`.  
- Si hay token en `localStorage`, se adjunta en `Authorization`.

---

## 4) Crear **feature `calc`** (estructura base para Sprint 3)

**Estructura**  
```
{{FRONT_DIR}}/src/app/features/calc/
  components/
    rooms-form/rooms-form.component.ts
    loads-form/loads-form.component.ts
    results-view/results-view.component.ts
  services/calc-api.service.ts
  pages/calc.page.ts
  schemas/input.schema.json
  schemas/output.schema.json
  index.ts
```

**Acciones**  
1. Copiar los **schemas** `input.schema.json` y `output.schema.json` (de Sprint 2 backend) a `src/app/features/calc/schemas/`.  
2. Instalar y preparar **AJV** para validar el payload antes de llamar a la API:  
   ```bash
   cd {{ROOT_DIR}}/{{FRONT_DIR}} && npm i ajv ajv-formats
   ```
3. Crear `CalcApiService` con métodos:  
   - `POST {{API_PREFIX}}/calc/rooms/preview`  
   - `POST {{API_PREFIX}}/calc/demand/preview`  
   - `POST {{API_PREFIX}}/calc/circuits/preview`  
   - `POST {{API_PREFIX}}/calc/feeder/preview`  
   - `POST {{API_PREFIX}}/calc/grounding/preview`  
   - `POST {{API_PREFIX}}/calc/report?type=pdf|xlsx` (respuesta Blob)  
4. Crear componentes **standalone** con **signals**:  
   - `rooms-form` — CRUD de `{{ nombre, area_m2 }}`  
   - `loads-form` — CRUD de `{{ nombre, ambiente, potencia_w, tipo, fp? }}`  
   - `results-view` — tablas de resultados y totales  
   - `calc.page` — orquestación: formularios → validación → API  
5. Routing: en `app.routes.ts`, registrar `path: 'calc'` → `CalcPage` y redirigir `'' → 'calc'`.

**Verificación**  
- `ng serve` compila y muestra la página `calc` con layout del template.  
- Flujo **preview** (rooms) operativo contra backend (si este está corriendo).

---

## 5) Scripts raíz (opcional) y Git

**Scripts raíz** *(en `{{ROOT_DIR}}/package.json` si administras scripts globales)*  
```json
{
  "scripts": {
    "dev:back": "cd {{BACK_DIR}} && npm run start:dev",
    "dev:front": "cd {{FRONT_DIR}} && npm start",
    "dev:all": "concurrently -n BACK,FRONT -c green,blue "npm:dev:back" "npm:dev:front""
  },
  "devDependencies": { "concurrently": "^9.0.0" }
}
```

**Git**  
- Commits recomendados por pasos:  
  - `chore(frontend): scaffold Angular 20 + template base`  
  - `chore(frontend): cleanup demo + routing`  
  - `feat(calc): forms + api service + validation (AJV)`  
  - `feat(calc): results view + report download`  
  - `test(calc): unit tests`  
- PR hacia `main` con descripción del alcance.

---

## 6) Criterios de Done (Prerequisito Sprint 3)
- Estructura del monorepo correcta (`{{FRONT_DIR}}` junto a `{{BACK_DIR}}`).  
- Template Datta Able integrado y **limpio** (solo layout/routing/estilos).  
- Proxy dev operativo (`/api` → backend).  
- Interceptor JWT activo.  
- Feature `calc` creada con **schemas** y *stubs* para llamadas a la API.  
- `ng serve` muestra el layout y la página `calc` sin errores.

---

## 7) Notas
- **Angular 20** ya integra un **dev server moderno**; no es necesario añadir Vite manual.  
- Mantener **valores normativos en backend** (parametrizados via BD, seeds). El frontend **no** debe hardcodear normas.

---

**Fin del prompt.**  
Ejecuta estas instrucciones paso a paso en Cursor dentro del repo `{{ROOT_DIR}}`.
