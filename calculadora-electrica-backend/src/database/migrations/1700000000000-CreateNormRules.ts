import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateNormRules1700000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'norm_rules',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
          },
          {
            name: 'code',
            type: 'varchar',
            length: '100',
            isUnique: true,
            isNullable: false,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'numericValue',
            type: 'decimal',
            precision: 12,
            scale: 3,
            isNullable: false,
          },
          {
            name: 'unit',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'category',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'source',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'isDefault',
            type: 'boolean',
            default: true,
            isNullable: false,
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP',
            isNullable: false,
          },
        ],
      }),
      true,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('norm_rules');
  }
}
