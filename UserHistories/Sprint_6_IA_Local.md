# Sprint 6 — IA local “Eléctridom” (Ollama) + fallback opcional
**Duración sugerida:** 1–2 semanas  
**Objetivo:** Implementar el asistente IA local en Docker (Ollama) y su integración con el backend NestJS, dejando un fallback opcional a OpenAI **deshabilitado por defecto**. Estándar de respuesta estrictamente **JSON** para cálculos/validaciones; texto natural solo en endpoints de explicación.

---

## Alcance (Done Criteria del Sprint)
- [ ] Infra IA local desplegada en Docker (Ollama + Open WebUI opcional) con healthchecks y volúmenes persistentes.
- [ ] Servicio `LlmGateway` en NestJS con **estrategia por proveedor** (Ollama / OpenAI opcional), timeouts, reintentos y trazas (pino/logger).
- [ ] **Prompts/plantillas**: system prompt de *Eléctridom*, plantillas por tarea (cálculo, verificación normativa, explicación), y **salida JSON** validada (Zod/DTO).
- [ ] Endpoint(s) HTTP/WS con **streaming** (SSE) para UI de chat/explicación y endpoint batch para cálculos normativos.
- [ ] Pruebas unitarias y contract tests del JSON schema de salida.
- [ ] Variables de entorno `.env` parametrizadas para elegir proveedor (default: `ollama`).

---

## Historias de Usuario

### US6.1 – Infra IA local en Docker
**Como** arquitecto del sistema, **quiero** correr un LLM local en CPU con Docker **para** no depender de servicios de pago por token.
**Criterios de Aceptación:**
- Existe `docker-compose.yml` con servicios `ollama` (obligatorio) y `openwebui` (opcional) en la red `proxy`.
- Healthchecks operativos (`/api/tags`).
- Descarga de modelos recomendados: `llama3.1:8b-instruct`, `mistral:7b-instruct`, `qwen2:7b-instruct`, `phi3:3.8b-mini-instruct` (quantizados por defecto).
- Script de verificación: `scripts/verify-ollama.sh` que retorna 0 si el servicio responde.

**Tareas:**
1. Crear stack Docker con volúmenes persistentes y red externa `proxy`.
2. Añadir `scripts/` con utilidades (`pull-models.sh`, `verify-ollama.sh`).
3. Documentar publicación detrás de Nginx Proxy Manager (si aplica).

---

### US6.2 – Gateway de IA en NestJS con estrategia de proveedor
**Como** desarrollador backend, **quiero** un servicio `LlmGateway` con interfaz común **para** cambiar de proveedor sin tocar el dominio.
**Criterios de Aceptación:**
- Clase `LlmGateway` + `ProviderStrategy` con drivers: `OllamaProvider` (default) y `OpenAIProvider` (opcional).
- Config vía `.env`: `LLM_PROVIDER=ollama|openai`, `OLLAMA_URL`, `OPENAI_API_KEY`.
- Timeouts, reintentos exponenciales, y logs estructurados.
- Método `generate<T>(prompt: PromptInput): Promise<T>` con **validación Zod/DTO** del JSON.

---

### US6.3 – System Prompt y plantillas “Eléctridom”
**Como** product owner, **quiero** un *system prompt* consistente y plantillas por tarea **para** controlar calidad y formato.
**Criterios de Aceptación:**
- `system.md` define rol, normas (RIE-DO/NEC/REBT), formato de salida JSON y lenguaje español técnico.
- Plantillas separadas por caso de uso: `calc_cargas.md`, `verif_rie.md`, `explicacion.md`.

---

### US6.4 – Endpoints y streaming
**Como** frontend, **quiero** endpoints REST/SSE **para** consumir respuestas IA.
**Criterios de Aceptación:**
- `POST /ia/calc` → salida estricta JSON validada por schema.
- `POST /ia/explicar` → SSE (texto) con progreso/tokens.
- `GET /ia/proveedor` → estado/health actual.

---

### US6.5 – Métricas, logs y seguridad
**Criterios de Aceptación:**
- Rate limit (ej. 20 req/min por IP/usuario).
- Logs con `correlationId`.
- Métricas básicas: latencia, éxito/error, proveedor activo.
- No se persiste *prompt content* salvo habilitación explícita.

---

## Entregables
- `docker-compose.yml` + scripts de modelos + README.
- `src/llm/*`, `src/ia/*`, DTOs, schemas y pruebas.
- Postman/Insomnia collection para `/ia/*`.
- Documentación de `.env.example`.
