# Prompt para Cursor – Sprint 10 (Backend)

**Contexto del proyecto:**
- Backend: NestJS + TypeScript, DB: MariaDB.
- Este sprint implementa: circuitos, protecciones, conductores y API de resultados normativos.

## Instrucciones para Cursor
1. Crear/actualizar módulos NestJS: `circuitos`, `protecciones`, `conductores`, `normativas`, `calculos`.
2. Aplicar el esquema SQL provisto en `./04-Esquema-BD.sql` (migraciones).
3. Cargar semillas mínimas desde `./08-Datos/seed-normativas.json`.
4. Exponer endpoints según `./05-API-Contrato.yaml`.
5. Asegurar pruebas mínimas unitarias en servicios de cálculo.
6. Entregar endpoints funcionales y colección Postman actualizada.

## Criterios de aceptación (resumen)
- Generación de circuitos por ambiente/categoría (IUG/TUG/IUE/TUE).
- Selección automática de breaker y conductor según corriente calculada y tablas.
- API unificada `GET /proyectos/{id}/resultados` con circuitos, protecciones y conductores.
