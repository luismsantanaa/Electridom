import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAuditLogsTable1755816294829 implements MigrationInterface {
  name = 'CreateAuditLogsTable1755816294829';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Eliminar foreign keys de forma segura (PostgreSQL: IF EXISTS evita abortar la transacción)
    try {
      await queryRunner.query(
        `ALTER TABLE IF EXISTS "tipos_artefactos" DROP CONSTRAINT IF EXISTS "FK_46d19cb1f926335efbe76890a46"`,
      );
    } catch (error) {
      console.log(
        'Foreign key FK_46d19cb1f926335efbe76890a46 no existe, continuando...',
      );
    }

    try {
      await queryRunner.query(
        `ALTER TABLE IF EXISTS "tipos_ambientes" DROP CONSTRAINT IF EXISTS "FK_34de0aa2c907e3c253d842d5148"`,
      );
    } catch (error) {
      console.log(
        'Foreign key FK_34de0aa2c907e3c253d842d5148 no existe, continuando...',
      );
    }

    try {
      await queryRunner.query(
        `ALTER TABLE IF EXISTS "project_versions" DROP CONSTRAINT IF EXISTS "FK_e03248bd62e51cc0dcf7c9712d1"`,
      );
    } catch (error) {
      console.log(
        'Foreign key FK_e03248bd62e51cc0dcf7c9712d1 no existe, continuando...',
      );
    }

    try {
      await queryRunner.query(
        `ALTER TABLE IF EXISTS "loads" DROP CONSTRAINT IF EXISTS "FK_2fd25202f4542073677c451d9bd"`,
      );
    } catch (error) {
      console.log(
        'Foreign key FK_2fd25202f4542073677c451d9bd no existe, continuando...',
      );
    }

    // Eliminar índices de forma segura
    try {
      await queryRunner.query(
        `DROP INDEX IF EXISTS "IDX_0729c51a1033ffa5307d800351"`,
      );
    } catch (error) {
      console.log(
        'Índice IDX_0729c51a1033ffa5307d800351 no existe, continuando...',
      );
    }

    // Crear tabla audit_logs si no existe
    try {
      await queryRunner.query(
        `CREATE TABLE IF NOT EXISTS "audit_logs" ("id" uuid NOT NULL, "userId" uuid NULL, "action" varchar(64) NOT NULL, "ip" varchar(64) NULL, "userAgent" varchar(256) NULL, "detail" text NULL, "traceId" varchar(64) NULL, "createdAt" timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), PRIMARY KEY ("id"))`,
      );
      await queryRunner.query(
        `CREATE INDEX IF NOT EXISTS "IDX_8873ff53e998ead3c10a6b213b" ON "audit_logs" ("traceId")`,
      );
      await queryRunner.query(
        `CREATE INDEX IF NOT EXISTS "IDX_0ec936941eb8556fcd7a1f0eae" ON "audit_logs" ("action", "createdAt")`,
      );
      await queryRunner.query(
        `CREATE INDEX IF NOT EXISTS "IDX_99e589da8f9e9326ee0d01a028" ON "audit_logs" ("userId", "createdAt")`,
      );
    } catch (error) {
      console.log('Tabla audit_logs ya existe, continuando...');
    }

    // Eliminar columnas antiguas (Spanish-named) si existen
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "tipos_instalaciones" DROP COLUMN IF EXISTS "activo"`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "tipos_instalaciones" DROP COLUMN IF EXISTS "fechaCreacion"`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "tipos_instalaciones" DROP COLUMN IF EXISTS "creado_por"`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "tipos_instalaciones" DROP COLUMN IF EXISTS "fechaActualizacion"`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "tipos_instalaciones" DROP COLUMN IF EXISTS "actualizado_por"`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "users" DROP COLUMN IF EXISTS "fechaCreacion"`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "users" DROP COLUMN IF EXISTS "fechaActualizacion"`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "tipos_artefactos" DROP COLUMN IF EXISTS "potencia"`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "tipos_artefactos" DROP COLUMN IF EXISTS "voltaje"`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "tipos_artefactos" DROP COLUMN IF EXISTS "activo"`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "tipos_artefactos" DROP COLUMN IF EXISTS "fechaCreacion"`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "tipos_artefactos" DROP COLUMN IF EXISTS "creadoPor"`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "tipos_artefactos" DROP COLUMN IF EXISTS "fechaActualizacion"`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "tipos_artefactos" DROP COLUMN IF EXISTS "actualizadoPor"`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "tipos_artefactos" DROP COLUMN IF EXISTS "tipoAmbiente_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "tipos_ambientes" DROP COLUMN IF EXISTS "activo"`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "tipos_ambientes" DROP COLUMN IF EXISTS "fechaCreacion"`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "tipos_ambientes" DROP COLUMN IF EXISTS "creadoPor"`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "tipos_ambientes" DROP COLUMN IF EXISTS "fechaActualizacion"`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "tipos_ambientes" DROP COLUMN IF EXISTS "actualizadoPor"`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "tipos_ambientes" DROP COLUMN IF EXISTS "tipoInstalacion_Id"`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "project_versions" DROP COLUMN IF EXISTS "projectId"`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "project_versions" DROP COLUMN IF EXISTS "createdAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "projects" DROP COLUMN IF EXISTS "projectName"`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "projects" DROP COLUMN IF EXISTS "createdAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "projects" DROP COLUMN IF EXISTS "updatedAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "loads" DROP COLUMN IF EXISTS "horasUso"`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "loads" DROP COLUMN IF EXISTS "kwhMensual"`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "loads" DROP COLUMN IF EXISTS "observaciones"`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "loads" DROP COLUMN IF EXISTS "proyecto_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "loads" DROP COLUMN IF EXISTS "activo"`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "loads" DROP COLUMN IF EXISTS "fechaCreacion"`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "loads" DROP COLUMN IF EXISTS "fechaActualizacion"`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "loads" DROP COLUMN IF EXISTS "creadoPor"`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "loads" DROP COLUMN IF EXISTS "actualizadoPor"`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "loads" DROP COLUMN IF EXISTS "tipo_ambiente_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "environment" DROP COLUMN IF EXISTS "description"`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "environment" DROP COLUMN IF EXISTS "tipoSuperficie"`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "environment" DROP COLUMN IF EXISTS "largo"`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "environment" DROP COLUMN IF EXISTS "ancho"`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "environment" DROP COLUMN IF EXISTS "altura"`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "environment" DROP COLUMN IF EXISTS "nivel"`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "environment" DROP COLUMN IF EXISTS "proyecto_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "environment" DROP COLUMN IF EXISTS "activo"`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "environment" DROP COLUMN IF EXISTS "fechaCreacion"`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "environment" DROP COLUMN IF EXISTS "fechaActualizacion"`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "environment" DROP COLUMN IF EXISTS "creadoPor"`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "environment" DROP COLUMN IF EXISTS "actualizadoPor"`,
    );

    // Agregar nuevos campos de auditoría (English-named) - IF NOT EXISTS evita duplicados
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "tipos_instalaciones" ADD COLUMN IF NOT EXISTS "usr_create" varchar(100) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "tipos_instalaciones" ADD COLUMN IF NOT EXISTS "usr_update" varchar(100) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "tipos_instalaciones" ADD COLUMN IF NOT EXISTS "creation_date" timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "tipos_instalaciones" ADD COLUMN IF NOT EXISTS "update_date" timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "tipos_instalaciones" ADD COLUMN IF NOT EXISTS "active" boolean NOT NULL DEFAULT true`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "users" ADD COLUMN IF NOT EXISTS "usr_create" varchar(100) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "users" ADD COLUMN IF NOT EXISTS "usr_update" varchar(100) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "users" ADD COLUMN IF NOT EXISTS "creation_date" timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "users" ADD COLUMN IF NOT EXISTS "update_date" timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "users" ADD COLUMN IF NOT EXISTS "active" boolean NOT NULL DEFAULT true`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "tipos_artefactos" ADD COLUMN IF NOT EXISTS "usr_create" varchar(100) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "tipos_artefactos" ADD COLUMN IF NOT EXISTS "usr_update" varchar(100) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "tipos_artefactos" ADD COLUMN IF NOT EXISTS "creation_date" timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "tipos_artefactos" ADD COLUMN IF NOT EXISTS "update_date" timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "tipos_artefactos" ADD COLUMN IF NOT EXISTS "active" boolean NOT NULL DEFAULT true`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "tipos_artefactos" ADD COLUMN IF NOT EXISTS "description" varchar(255) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "tipos_artefactos" ADD COLUMN IF NOT EXISTS "potenciaNominal" decimal(10,2) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "tipos_artefactos" ADD COLUMN IF NOT EXISTS "factorDemanda" decimal(10,2) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "tipos_ambientes" ADD COLUMN IF NOT EXISTS "usr_create" varchar(100) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "tipos_ambientes" ADD COLUMN IF NOT EXISTS "usr_update" varchar(100) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "tipos_ambientes" ADD COLUMN IF NOT EXISTS "creation_date" timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "tipos_ambientes" ADD COLUMN IF NOT EXISTS "update_date" timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "tipos_ambientes" ADD COLUMN IF NOT EXISTS "active" boolean NOT NULL DEFAULT true`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "tipos_ambientes" ADD COLUMN IF NOT EXISTS "description" varchar(255) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "project_versions" ADD COLUMN IF NOT EXISTS "usr_create" varchar(100) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "project_versions" ADD COLUMN IF NOT EXISTS "usr_update" varchar(100) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "project_versions" ADD COLUMN IF NOT EXISTS "creation_date" timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "project_versions" ADD COLUMN IF NOT EXISTS "update_date" timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "project_versions" ADD COLUMN IF NOT EXISTS "active" boolean NOT NULL DEFAULT true`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "project_versions" ADD COLUMN IF NOT EXISTS "project_id" uuid NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "projects" ADD COLUMN IF NOT EXISTS "usr_create" varchar(100) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "projects" ADD COLUMN IF NOT EXISTS "usr_update" varchar(100) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "projects" ADD COLUMN IF NOT EXISTS "creation_date" timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "projects" ADD COLUMN IF NOT EXISTS "update_date" timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "projects" ADD COLUMN IF NOT EXISTS "active" boolean NOT NULL DEFAULT true`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "projects" ADD COLUMN IF NOT EXISTS "name" varchar(255) NOT NULL DEFAULT ''`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "loads" ADD COLUMN IF NOT EXISTS "usr_create" varchar(100) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "loads" ADD COLUMN IF NOT EXISTS "usr_update" varchar(100) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "loads" ADD COLUMN IF NOT EXISTS "creation_date" timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "loads" ADD COLUMN IF NOT EXISTS "update_date" timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "loads" ADD COLUMN IF NOT EXISTS "active" boolean NOT NULL DEFAULT true`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "loads" ADD COLUMN IF NOT EXISTS "name" varchar(100) NOT NULL DEFAULT ''`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "loads" ADD COLUMN IF NOT EXISTS "potencia" decimal(10,2) NOT NULL DEFAULT 0`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "environment" ADD COLUMN IF NOT EXISTS "usr_create" varchar(100) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "environment" ADD COLUMN IF NOT EXISTS "usr_update" varchar(100) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "environment" ADD COLUMN IF NOT EXISTS "creation_date" timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "environment" ADD COLUMN IF NOT EXISTS "update_date" timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "environment" ADD COLUMN IF NOT EXISTS "active" boolean NOT NULL DEFAULT true`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "loads" DROP COLUMN IF EXISTS "voltaje"`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "loads" ADD COLUMN IF NOT EXISTS "voltaje" decimal(10,2) NOT NULL DEFAULT 0`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "environment" DROP CONSTRAINT IF EXISTS "FK_e247dfac4e068b2266e787354a7"`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "environment" DROP COLUMN IF EXISTS "area"`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "environment" ADD COLUMN IF NOT EXISTS "area" decimal(10,2) NOT NULL DEFAULT 0`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "environment" ALTER COLUMN "tipo_ambiente_id" TYPE uuid, ALTER COLUMN "tipo_ambiente_id" DROP NOT NULL`,
    );
    await queryRunner.query(
      `DO $$ BEGIN CREATE UNIQUE INDEX "IDX_9a5d47486f6e6d997c1fc50b5c" ON "project_versions" ("project_id", "versionNumber"); EXCEPTION WHEN OTHERS THEN NULL; END $$`,
    );
    await queryRunner.query(
      `DO $$ BEGIN ALTER TABLE "project_versions" ADD CONSTRAINT "FK_f1deab56bfe3bd92fe174118519" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE NO ACTION ON UPDATE NO ACTION; EXCEPTION WHEN duplicate_object OR undefined_table OR undefined_column THEN NULL; END $$`,
    );
    await queryRunner.query(
      `DO $$ BEGIN ALTER TABLE IF EXISTS "environment" ADD CONSTRAINT "FK_e247dfac4e068b2266e787354a7" FOREIGN KEY ("tipo_ambiente_id") REFERENCES "tipos_ambientes"("id") ON DELETE NO ACTION ON UPDATE NO ACTION; EXCEPTION WHEN duplicate_object OR undefined_table OR undefined_column THEN NULL; END $$`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "environment" DROP CONSTRAINT IF EXISTS "FK_e247dfac4e068b2266e787354a7"`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "project_versions" DROP CONSTRAINT IF EXISTS "FK_f1deab56bfe3bd92fe174118519"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_9a5d47486f6e6d997c1fc50b5c"`);
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "environment" ALTER COLUMN "tipo_ambiente_id" TYPE uuid, ALTER COLUMN "tipo_ambiente_id" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "environment" DROP COLUMN IF EXISTS "area"`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "environment" ADD COLUMN IF NOT EXISTS "area" float(12) NULL`,
    );
    await queryRunner.query(
      `DO $$ BEGIN ALTER TABLE IF EXISTS "environment" ADD CONSTRAINT "FK_e247dfac4e068b2266e787354a7" FOREIGN KEY ("tipo_ambiente_id") REFERENCES "tipos_ambientes"("id") ON DELETE NO ACTION ON UPDATE NO ACTION; EXCEPTION WHEN duplicate_object OR undefined_table OR undefined_column THEN NULL; END $$`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "loads" DROP COLUMN IF EXISTS "voltaje"`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "loads" ADD COLUMN IF NOT EXISTS "voltaje" int NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "environment" DROP COLUMN IF EXISTS "active"`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "environment" DROP COLUMN IF EXISTS "update_date"`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "environment" DROP COLUMN IF EXISTS "creation_date"`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "environment" DROP COLUMN IF EXISTS "usr_update"`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "environment" DROP COLUMN IF EXISTS "usr_create"`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "loads" DROP COLUMN IF EXISTS "potencia"`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "loads" DROP COLUMN IF EXISTS "name"`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "loads" DROP COLUMN IF EXISTS "active"`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "loads" DROP COLUMN IF EXISTS "update_date"`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "loads" DROP COLUMN IF EXISTS "creation_date"`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "loads" DROP COLUMN IF EXISTS "usr_update"`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "loads" DROP COLUMN IF EXISTS "usr_create"`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "projects" DROP COLUMN IF EXISTS "name"`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "projects" DROP COLUMN IF EXISTS "active"`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "projects" DROP COLUMN IF EXISTS "update_date"`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "projects" DROP COLUMN IF EXISTS "creation_date"`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "projects" DROP COLUMN IF EXISTS "usr_update"`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "projects" DROP COLUMN IF EXISTS "usr_create"`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "project_versions" DROP COLUMN IF EXISTS "project_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "project_versions" DROP COLUMN IF EXISTS "active"`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "project_versions" DROP COLUMN IF EXISTS "update_date"`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "project_versions" DROP COLUMN IF EXISTS "creation_date"`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "project_versions" DROP COLUMN IF EXISTS "usr_update"`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "project_versions" DROP COLUMN IF EXISTS "usr_create"`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "tipos_ambientes" DROP COLUMN IF EXISTS "description"`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "tipos_ambientes" DROP COLUMN IF EXISTS "active"`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "tipos_ambientes" DROP COLUMN IF EXISTS "update_date"`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "tipos_ambientes" DROP COLUMN IF EXISTS "creation_date"`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "tipos_ambientes" DROP COLUMN IF EXISTS "usr_update"`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "tipos_ambientes" DROP COLUMN IF EXISTS "usr_create"`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "tipos_artefactos" DROP COLUMN IF EXISTS "factorDemanda"`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "tipos_artefactos" DROP COLUMN IF EXISTS "potenciaNominal"`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "tipos_artefactos" DROP COLUMN IF EXISTS "description"`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "tipos_artefactos" DROP COLUMN IF EXISTS "active"`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "tipos_artefactos" DROP COLUMN IF EXISTS "update_date"`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "tipos_artefactos" DROP COLUMN IF EXISTS "creation_date"`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "tipos_artefactos" DROP COLUMN IF EXISTS "usr_update"`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "tipos_artefactos" DROP COLUMN IF EXISTS "usr_create"`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "users" DROP COLUMN IF EXISTS "active"`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "users" DROP COLUMN IF EXISTS "update_date"`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "users" DROP COLUMN IF EXISTS "creation_date"`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "users" DROP COLUMN IF EXISTS "usr_update"`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "users" DROP COLUMN IF EXISTS "usr_create"`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "tipos_instalaciones" DROP COLUMN IF EXISTS "active"`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "tipos_instalaciones" DROP COLUMN IF EXISTS "update_date"`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "tipos_instalaciones" DROP COLUMN IF EXISTS "creation_date"`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "tipos_instalaciones" DROP COLUMN IF EXISTS "usr_update"`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "tipos_instalaciones" DROP COLUMN IF EXISTS "usr_create"`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "environment" ADD COLUMN IF NOT EXISTS "actualizadoPor" varchar(255) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "environment" ADD COLUMN IF NOT EXISTS "creadoPor" varchar(255) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "environment" ADD COLUMN IF NOT EXISTS "fechaActualizacion" timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "environment" ADD COLUMN IF NOT EXISTS "fechaCreacion" timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "environment" ADD COLUMN IF NOT EXISTS "activo" boolean NOT NULL DEFAULT true`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "environment" ADD COLUMN IF NOT EXISTS "proyecto_id" varchar(255) NOT NULL DEFAULT ''`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "environment" ADD COLUMN IF NOT EXISTS "nivel" varchar(255) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "environment" ADD COLUMN IF NOT EXISTS "altura" float(12) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "environment" ADD COLUMN IF NOT EXISTS "ancho" float(12) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "environment" ADD COLUMN IF NOT EXISTS "largo" float(12) NULL`,
    );
    await queryRunner.query(
      `DO $$ BEGIN CREATE TYPE "environment_tipoSuperficie_enum" AS ENUM ('Rectangular', 'Circular', 'Triangular', 'Irregular'); EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "environment" ADD COLUMN IF NOT EXISTS "tipoSuperficie" "environment_tipoSuperficie_enum" NOT NULL DEFAULT 'Rectangular'`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "environment" ADD COLUMN IF NOT EXISTS "description" varchar(255) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "loads" ADD COLUMN IF NOT EXISTS "tipo_ambiente_id" uuid NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "loads" ADD COLUMN IF NOT EXISTS "actualizadoPor" varchar(255) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "loads" ADD COLUMN IF NOT EXISTS "creadoPor" varchar(255) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "loads" ADD COLUMN IF NOT EXISTS "fechaActualizacion" timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "loads" ADD COLUMN IF NOT EXISTS "fechaCreacion" timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "loads" ADD COLUMN IF NOT EXISTS "activo" boolean NOT NULL DEFAULT true`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "loads" ADD COLUMN IF NOT EXISTS "proyecto_id" varchar(255) NOT NULL DEFAULT ''`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "loads" ADD COLUMN IF NOT EXISTS "observaciones" varchar(255) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "loads" ADD COLUMN IF NOT EXISTS "kwhMensual" float(12) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "loads" ADD COLUMN IF NOT EXISTS "horasUso" int NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "projects" ADD COLUMN IF NOT EXISTS "updatedAt" timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "projects" ADD COLUMN IF NOT EXISTS "createdAt" timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "projects" ADD COLUMN IF NOT EXISTS "projectName" varchar(120) NOT NULL DEFAULT ''`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "project_versions" ADD COLUMN IF NOT EXISTS "createdAt" timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "project_versions" ADD COLUMN IF NOT EXISTS "projectId" uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000'`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "tipos_ambientes" ADD COLUMN IF NOT EXISTS "tipoInstalacion_Id" uuid NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "tipos_ambientes" ADD COLUMN IF NOT EXISTS "actualizadoPor" varchar(255) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "tipos_ambientes" ADD COLUMN IF NOT EXISTS "fechaActualizacion" timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "tipos_ambientes" ADD COLUMN IF NOT EXISTS "creadoPor" varchar(255) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "tipos_ambientes" ADD COLUMN IF NOT EXISTS "fechaCreacion" timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "tipos_ambientes" ADD COLUMN IF NOT EXISTS "activo" boolean NOT NULL DEFAULT true`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "tipos_artefactos" ADD COLUMN IF NOT EXISTS "tipoAmbiente_id" uuid NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "tipos_artefactos" ADD COLUMN IF NOT EXISTS "actualizadoPor" varchar(100) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "tipos_artefactos" ADD COLUMN IF NOT EXISTS "fechaActualizacion" timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "tipos_artefactos" ADD COLUMN IF NOT EXISTS "creadoPor" varchar(100) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "tipos_artefactos" ADD COLUMN IF NOT EXISTS "fechaCreacion" timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "tipos_artefactos" ADD COLUMN IF NOT EXISTS "activo" boolean NOT NULL DEFAULT true`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "tipos_artefactos" ADD COLUMN IF NOT EXISTS "voltaje" decimal(10,2) NOT NULL DEFAULT 0`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "tipos_artefactos" ADD COLUMN IF NOT EXISTS "potencia" decimal(10,2) NOT NULL DEFAULT 0`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "users" ADD COLUMN IF NOT EXISTS "fechaActualizacion" timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "users" ADD COLUMN IF NOT EXISTS "fechaCreacion" timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "tipos_instalaciones" ADD COLUMN IF NOT EXISTS "actualizado_por" varchar(255) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "tipos_instalaciones" ADD COLUMN IF NOT EXISTS "fechaActualizacion" timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "tipos_instalaciones" ADD COLUMN IF NOT EXISTS "creado_por" varchar(255) NOT NULL DEFAULT ''`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "tipos_instalaciones" ADD COLUMN IF NOT EXISTS "fechaCreacion" timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "tipos_instalaciones" ADD COLUMN IF NOT EXISTS "activo" boolean NOT NULL DEFAULT true`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_99e589da8f9e9326ee0d01a028"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_0ec936941eb8556fcd7a1f0eae"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_8873ff53e998ead3c10a6b213b"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "audit_logs"`);
    await queryRunner.query(
      `DO $$ BEGIN CREATE UNIQUE INDEX IF NOT EXISTS "IDX_0729c51a1033ffa5307d800351" ON "project_versions" ("projectId", "versionNumber"); EXCEPTION WHEN OTHERS THEN NULL; END $$`,
    );
    await queryRunner.query(
      `DO $$ BEGIN ALTER TABLE IF EXISTS "loads" ADD CONSTRAINT "FK_2fd25202f4542073677c451d9bd" FOREIGN KEY ("tipo_ambiente_id") REFERENCES "tipos_ambientes"("id") ON DELETE NO ACTION ON UPDATE NO ACTION; EXCEPTION WHEN duplicate_object OR undefined_table OR undefined_column THEN NULL; END $$`,
    );
    await queryRunner.query(
      `DO $$ BEGIN ALTER TABLE "project_versions" ADD CONSTRAINT "FK_e03248bd62e51cc0dcf7c9712d1" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE NO ACTION; EXCEPTION WHEN duplicate_object OR undefined_table OR undefined_column THEN NULL; END $$`,
    );
    await queryRunner.query(
      `DO $$ BEGIN ALTER TABLE "tipos_ambientes" ADD CONSTRAINT "FK_34de0aa2c907e3c253d842d5148" FOREIGN KEY ("tipoInstalacion_Id") REFERENCES "tipos_instalaciones"("id") ON DELETE NO ACTION ON UPDATE NO ACTION; EXCEPTION WHEN duplicate_object OR undefined_table OR undefined_column THEN NULL; END $$`,
    );
    await queryRunner.query(
      `DO $$ BEGIN ALTER TABLE "tipos_artefactos" ADD CONSTRAINT "FK_46d19cb1f926335efbe76890a46" FOREIGN KEY ("tipoAmbiente_id") REFERENCES "tipos_ambientes"("id") ON DELETE NO ACTION ON UPDATE NO ACTION; EXCEPTION WHEN duplicate_object OR undefined_table OR undefined_column THEN NULL; END $$`,
    );
  }
}