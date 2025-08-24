import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddIdToNormConst1756000000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Agregar columna id si no existe
    const tableExists = await queryRunner.hasTable('norm_const');
    if (tableExists) {
      const hasIdColumn = await queryRunner.hasColumn('norm_const', 'id');
      if (!hasIdColumn) {
        await queryRunner.query(
          'ALTER TABLE `norm_const` ADD `id` uuid NOT NULL PRIMARY KEY DEFAULT (UUID())',
        );
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const hasIdColumn = await queryRunner.hasColumn('norm_const', 'id');
    if (hasIdColumn) {
      await queryRunner.query('ALTER TABLE `norm_const` DROP COLUMN `id`');
    }
  }
}
