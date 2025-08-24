import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateDemandFactorTable1756000000001
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'demand_factor',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'uuid',
          },
          {
            name: 'usr_create',
            type: 'varchar',
            length: '100',
            isNullable: true,
            comment: 'Usuario que creó el registro',
          },
          {
            name: 'usr_update',
            type: 'varchar',
            length: '100',
            isNullable: true,
            comment: 'Usuario que actualizó el registro',
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
            comment: 'Indica si el registro está activo',
          },
          {
            name: 'category',
            type: 'varchar',
            length: '100',
            comment:
              'Categoría de carga (lighting_general, tomas_generales, etc.)',
          },
          {
            name: 'range_min',
            type: 'decimal',
            precision: 10,
            scale: 2,
            comment: 'Rango mínimo de carga en VA',
          },
          {
            name: 'range_max',
            type: 'decimal',
            precision: 10,
            scale: 2,
            comment: 'Rango máximo de carga en VA',
          },
          {
            name: 'factor',
            type: 'decimal',
            precision: 5,
            scale: 4,
            comment: 'Factor de demanda a aplicar (0.0 - 1.0)',
          },
          {
            name: 'notes',
            type: 'text',
            isNullable: true,
            comment: 'Notas y observaciones del factor de demanda',
          },
        ],
        indices: [
          {
            name: 'IDX_DEMAND_FACTOR_CATEGORY',
            columnNames: ['category', 'active'],
          },
          {
            name: 'IDX_DEMAND_FACTOR_RANGE',
            columnNames: ['category', 'range_min', 'range_max'],
          },
        ],
      }),
      true,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('demand_factor');
  }
}
