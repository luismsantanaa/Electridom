import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAuditFieldsAndUTF81755810670920 implements MigrationInterface {
  name = 'AddAuditFieldsAndUTF81755810670920';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_cfdaecb0ba714306de46151d9e"`);
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "rule_change_logs" DROP COLUMN IF EXISTS "createdAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "norm_rules" DROP COLUMN IF EXISTS "updatedAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "rule_sets" DROP COLUMN IF EXISTS "createdAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "rule_sets" DROP COLUMN IF EXISTS "updatedAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "rule_change_logs" ADD "usr_create" varchar(100) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "rule_change_logs" ADD "usr_update" varchar(100) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "rule_change_logs" ADD "creation_date" timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)`,
    );
    await queryRunner.query(
      `ALTER TABLE "rule_change_logs" ADD "update_date" timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)`,
    );
    await queryRunner.query(
      `ALTER TABLE "rule_change_logs" ADD "active" boolean NOT NULL DEFAULT true`,
    );
    await queryRunner.query(
      `ALTER TABLE "norm_rules" ADD "usr_create" varchar(100) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "norm_rules" ADD "usr_update" varchar(100) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "norm_rules" ADD "creation_date" timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)`,
    );
    await queryRunner.query(
      `ALTER TABLE "norm_rules" ADD "update_date" timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)`,
    );
    await queryRunner.query(
      `ALTER TABLE "norm_rules" ADD "active" boolean NOT NULL DEFAULT true`,
    );
    await queryRunner.query(
      `ALTER TABLE "rule_sets" ADD "usr_create" varchar(100) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "rule_sets" ADD "usr_update" varchar(100) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "rule_sets" ADD "creation_date" timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)`,
    );
    await queryRunner.query(
      `ALTER TABLE "rule_sets" ADD "update_date" timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)`,
    );
    await queryRunner.query(
      `ALTER TABLE "rule_sets" ADD "active" boolean NOT NULL DEFAULT true`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_1656d5c4058a57331d5001c407" ON "rule_change_logs" ("actor", "creation_date")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_1656d5c4058a57331d5001c407"`);
    await queryRunner.query(`ALTER TABLE "rule_sets" DROP COLUMN "active"`);
    await queryRunner.query(
      `ALTER TABLE "rule_sets" DROP COLUMN "update_date"`,
    );
    await queryRunner.query(
      `ALTER TABLE "rule_sets" DROP COLUMN "creation_date"`,
    );
    await queryRunner.query(
      `ALTER TABLE "rule_sets" DROP COLUMN "usr_update"`,
    );
    await queryRunner.query(
      `ALTER TABLE "rule_sets" DROP COLUMN "usr_create"`,
    );
    await queryRunner.query(`ALTER TABLE "norm_rules" DROP COLUMN "active"`);
    await queryRunner.query(
      `ALTER TABLE "norm_rules" DROP COLUMN "update_date"`,
    );
    await queryRunner.query(
      `ALTER TABLE "norm_rules" DROP COLUMN "creation_date"`,
    );
    await queryRunner.query(
      `ALTER TABLE "norm_rules" DROP COLUMN "usr_update"`,
    );
    await queryRunner.query(
      `ALTER TABLE "norm_rules" DROP COLUMN "usr_create"`,
    );
    await queryRunner.query(
      `ALTER TABLE "rule_change_logs" DROP COLUMN "active"`,
    );
    await queryRunner.query(
      `ALTER TABLE "rule_change_logs" DROP COLUMN "update_date"`,
    );
    await queryRunner.query(
      `ALTER TABLE "rule_change_logs" DROP COLUMN "creation_date"`,
    );
    await queryRunner.query(
      `ALTER TABLE "rule_change_logs" DROP COLUMN "usr_update"`,
    );
    await queryRunner.query(
      `ALTER TABLE "rule_change_logs" DROP COLUMN "usr_create"`,
    );
    await queryRunner.query(
      `ALTER TABLE "rule_sets" ADD "updatedAt" timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)`,
    );
    await queryRunner.query(
      `ALTER TABLE "rule_sets" ADD "createdAt" timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)`,
    );
    await queryRunner.query(
      `ALTER TABLE "norm_rules" ADD "updatedAt" timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)`,
    );
    await queryRunner.query(
      `ALTER TABLE "rule_change_logs" ADD "createdAt" timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_cfdaecb0ba714306de46151d9e" ON "rule_change_logs" ("actor", "createdAt")`,
    );
  }
}