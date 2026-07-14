import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateBasicTables1755797077999 implements MigrationInterface {
  name = 'CreateBasicTables1755797077999';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 0. Crear tipos enum nativos de PostgreSQL (las columnas role/estado los usan)
    await queryRunner.query(
      `CREATE TYPE "users_role_enum" AS ENUM ('ADMIN', 'CLIENTE', 'AUDITOR')`,
    );
    await queryRunner.query(
      `CREATE TYPE "users_estado_enum" AS ENUM ('activo', 'inactivo', 'bloqueado')`,
    );

    // 1. Crear tabla users
    await queryRunner.query(`
            CREATE TABLE "users" (
                "id" uuid NOT NULL,
                "email" varchar(255) NOT NULL,
                "username" varchar(100) NOT NULL,
                "password" varchar(255) NOT NULL,
                "role" "users_role_enum" NOT NULL DEFAULT 'CLIENTE',
                "estado" "users_estado_enum" NOT NULL DEFAULT 'activo',
                "usr_create" varchar(100) NULL,
                "usr_update" varchar(100) NULL,
                "creation_date" timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                "update_date" timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                "active" boolean NOT NULL DEFAULT true,
                CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"),
                CONSTRAINT "UQ_fe0bb3f6520ee0469504521e710" UNIQUE ("username"),
                PRIMARY KEY ("id")
            )
        `);

    // 2. Crear tabla projects
    await queryRunner.query(`
            CREATE TABLE "projects" (
                "id" uuid NOT NULL,
                "name" varchar(255) NOT NULL,
                "description" text NULL,
                "usr_create" varchar(100) NULL,
                "usr_update" varchar(100) NULL,
                "creation_date" timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                "update_date" timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                "active" boolean NOT NULL DEFAULT true,
                PRIMARY KEY ("id")
            )
        `);

    // 3. Crear tabla project_versions
    await queryRunner.query(`
            CREATE TABLE "project_versions" (
                "id" uuid NOT NULL,
                "version" int NOT NULL,
                "snapshot" json NOT NULL,
                "project_id" uuid NULL,
                "usr_create" varchar(100) NULL,
                "usr_update" varchar(100) NULL,
                "creation_date" timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                "update_date" timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                "active" boolean NOT NULL DEFAULT true,
                PRIMARY KEY ("id")
            )
        `);

    // 4. Crear tabla rule_sets
    await queryRunner.query(`
            CREATE TABLE "rule_sets" (
                "id" uuid NOT NULL,
                "name" varchar(255) NOT NULL,
                "description" text NULL,
                "version" varchar(50) NOT NULL,
                "isActive" boolean NOT NULL DEFAULT false,
                "usr_create" varchar(100) NULL,
                "usr_update" varchar(100) NULL,
                "creation_date" timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                "update_date" timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                "active" boolean NOT NULL DEFAULT true,
                PRIMARY KEY ("id")
            )
        `);

    // 5. Crear tabla rule_change_logs
    await queryRunner.query(`
            CREATE TABLE "rule_change_logs" (
                "id" uuid NOT NULL,
                "ruleSetId" uuid NOT NULL,
                "actor" varchar(255) NOT NULL,
                "action" varchar(50) NOT NULL,
                "details" json NULL,
                "usr_create" varchar(100) NULL,
                "usr_update" varchar(100) NULL,
                "creation_date" timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                "update_date" timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                "active" boolean NOT NULL DEFAULT true,
                PRIMARY KEY ("id")
            )
        `);

    // 6. Crear foreign keys
    await queryRunner.query(`
            ALTER TABLE "project_versions"
            ADD CONSTRAINT "FK_project_versions_project"
            FOREIGN KEY ("project_id")
            REFERENCES "projects"("id")
            ON DELETE CASCADE ON UPDATE NO ACTION
        `);

    await queryRunner.query(`
            ALTER TABLE "rule_change_logs"
            ADD CONSTRAINT "FK_rule_change_logs_rule_set"
            FOREIGN KEY ("ruleSetId")
            REFERENCES "rule_sets"("id")
            ON DELETE CASCADE ON UPDATE NO ACTION
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Eliminar foreign keys en orden inverso
    await queryRunner.query(
      `ALTER TABLE "rule_change_logs" DROP CONSTRAINT "FK_rule_change_logs_rule_set"`,
    );
    await queryRunner.query(
      `ALTER TABLE "project_versions" DROP CONSTRAINT "FK_project_versions_project"`,
    );

    // Eliminar tablas en orden inverso
    await queryRunner.query(`DROP TABLE "rule_change_logs"`);
    await queryRunner.query(`DROP TABLE "rule_sets"`);
    await queryRunner.query(`DROP TABLE "project_versions"`);
    await queryRunner.query(`DROP TABLE "projects"`);
    await queryRunner.query(`DROP TABLE "users"`);

    // Eliminar tipos enum nativos de PostgreSQL
    await queryRunner.query(`DROP TYPE "users_estado_enum"`);
    await queryRunner.query(`DROP TYPE "users_role_enum"`);
  }
}