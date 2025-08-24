import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateNormConstTable1756000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'norm_const',
        columns: [
          {
            name: 'key',
            type: 'varchar',
            length: '100',
            isUnique: true,
            comment: 'Clave del parámetro normativo',
          },
          {
            name: 'value',
            type: 'varchar',
            length: '255',
            comment: 'Valor del parámetro',
          },
          {
            name: 'unit',
            type: 'varchar',
            length: '50',
            comment: 'Unidad de medida',
          },
          {
            name: 'notes',
            type: 'text',
            isNullable: true,
            comment: 'Notas y observaciones del parámetro',
          },
          {
            name: 'usr_create',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'usr_update',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'creation_date',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'update_date',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'active',
            type: 'boolean',
            default: true,
          },
        ],
        indices: [
          {
            name: 'IDX_NORM_CONST_KEY',
            columnNames: ['key'],
          },
        ],
      }),
      true,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('norm_const');
  }
}
