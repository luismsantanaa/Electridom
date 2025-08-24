import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateBreakerCurveTable1756000000003
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'breaker_curve',
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
            name: 'amp',
            type: 'decimal',
            precision: 8,
            scale: 2,
            comment: 'Capacidad nominal del breaker en amperios',
          },
          {
            name: 'poles',
            type: 'int',
            comment: 'Número de polos (1=monofásico, 2=bifásico, 3=trifásico)',
          },
          {
            name: 'curve',
            type: 'varchar',
            length: '5',
            comment: 'Curva de disparo (B, C, D)',
          },
          {
            name: 'use_case',
            type: 'varchar',
            length: '50',
            comment: 'Caso de uso típico (iluminacion, tomas generales, etc.)',
          },
          {
            name: 'notes',
            type: 'text',
            isNullable: true,
            comment: 'Notas adicionales del breaker',
          },
        ],
        indices: [
          {
            name: 'IDX_BREAKER_CURVE_AMP_POLES',
            columnNames: ['amp', 'poles', 'active'],
          },
          {
            name: 'IDX_BREAKER_CURVE_USE_CASE',
            columnNames: ['use_case', 'active'],
          },
          {
            name: 'IDX_BREAKER_CURVE_CURVE',
            columnNames: ['curve', 'active'],
          },
        ],
      }),
      true,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('breaker_curve');
  }
}
