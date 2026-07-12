# Auditoría de Compatibilidad MariaDB → PostgreSQL

**Fecha:** Julio 2026
**Resultado:** ✅ COMPATIBLE con cambios mínimos

---

## Resumen

El código existente es mayormente agnóstico al driver de base de datos gracias al uso de la API de TypeORM (`QueryRunner`, decorators). No se encontraron stored procedures, funciones SQL nativas ni sintaxis MariaDB-specific en las migraciones.

## Hallazgos

### 1. Entities — ✅ Sin cambios necesarios

| Patrón | Ocurrencias | Impacto en PostgreSQL | Acción |
|---|---|---|---|
| `type: 'enum'` | 3 (user x2, jwks-key x1) | TypeORM genera `CREATE TYPE ... AS ENUM` automáticamente | Ninguna |
| `type: 'datetime'` | 14 (base-audit, session, circuit, protection, rule-set, user) | TypeORM mapea a `timestamp` en PostgreSQL | Ninguna |
| `type: 'boolean'` | 1 (base-audit.active) | Compatible nativamente | Ninguna |
| `type: 'decimal'` | Varias | Compatible nativamente | Ninguna |
| `type: 'int'` | Varias | Compatible nativamente | Ninguna |
| `type: 'varchar'` | Varias | Compatible nativamente | Ninguna |
| `@PrimaryGeneratedColumn('uuid')` | Todas las entities | PostgreSQL tiene `uuid-ossp` habilitado | Ninguna |

### 2. Migraciones — ✅ Sin cambios necesarios

Las 19 migraciones en `src/database/migrations/` usan la API de TypeORM:
- `queryRunner.createTable()` → agnóstico
- `queryRunner.createForeignKey()` → agnóstico
- `queryRunner.createIndex()` → agnóstico
- `queryRunner.query('CREATE INDEX ...')` → SQL estándar, compatible

**No se encontró:**
- ❌ Stored procedures
- ❌ `ENGINE=InnoDB`
- ❌ `AUTO_INCREMENT` (usan `generationStrategy: 'increment'` de TypeORM)
- ❌ `CHARACTER SET` / `COLLATE` específicos
- ❌ `SHOW TABLES` / `SHOW COLUMNS`

### 3. Tests E2E — ⚠️ 1 archivo requiere cambio

| Archivo | Query | Problema | Solución |
|---|---|---|---|
| `database-connection.e2e-spec.ts:36` | `SHOW TABLES LIKE "users"` | MariaDB/MySQL specific | `SELECT table_name FROM information_schema.tables WHERE table_name = 'users'` |
| `database-connection.e2e-spec.ts:41` | `SHOW TABLES LIKE "sessions"` | MariaDB/MySQL specific | Mismo patrón |
| Otros E2E specs | `DELETE FROM <table>` | ✅ Compatible | Ninguna |

### 4. Configuración — ⚠️ Requiere cambio

| Archivo | Cambio |
|---|---|
| `src/config/typeorm.config.ts` | `type: 'mariadb'` → `type: 'postgres'` |
| `package.json` | Remover `mariadb`, agregar `pg` |
| `env.example` | `DATABASE_PORT=3306` → `DATABASE_PORT=5432` |
| `docker-compose.yml` | `DATABASE_HOST=mariadb` → `DATABASE_HOST=postgres` |

### 5. Seeds — ✅ Sin cambios necesarios

Los seeds son JSON que se insertan vía TypeORM Repository → agnóstico al driver.

---

## Plan de Acción

1. **T1.2** — No necesario crear migraciones nuevas (synchronize crea las tablas)
2. **T1.3** — Cambiar driver TypeORM de `mariadb` a `postgres`
3. **T1.4** — Ejecutar seeds en PostgreSQL (datos de referencia)
4. **T1.5** — Arreglar test E2E (`SHOW TABLES` → `information_schema`)
5. **T1.6** — Limpiar archivos `.backup`

## Riesgos

| Riesgo | Probabilidad | Mitigación |
|---|---|---|
| UUID generation diferente | Baja | `uuid-ossp` ya habilitado en PostgreSQL |
| Enum naming | Baja | TypeORM genera nombres consistentes |
| Timezone handling | Media | Verificar que `timestamp` vs `datetime` no cause issues |
