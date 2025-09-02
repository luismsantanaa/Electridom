# Carga de seeds normativos (NestJS + TypeORM)

## Prerrequisitos
- Proyecto NestJS configurado con TypeORM.
- Exportar un `AppDataSource` en `src/database/data-source.ts` (ajusta el import en los scripts).

## Tablas
Se usa una tabla clave-valor `normas_config` con entidad `NormaConfig` para almacenar JSON de normativas:

- protections.json
- conductor_tables.json
- vd_limits.json
- rules_env_use.json
- feeder_params.json
- (Sprint 17) rules_normativas.json

## Comandos sugeridos
```bash
# Instalar ts-node si no lo tienes
npm i -D ts-node tsconfig-paths

# Ejecutar seeds Sprint 16
npx ts-node -r tsconfig-paths/register backend/utils/seeds/seed-normas.ts

# Ejecutar seeds Sprint 17
npx ts-node -r tsconfig-paths/register Sprint_17_IA_Validacion/backend/utils/seeds/seed-rules-normativas.ts
```

> Ajusta las rutas según tu mono-repo / estructura real.
