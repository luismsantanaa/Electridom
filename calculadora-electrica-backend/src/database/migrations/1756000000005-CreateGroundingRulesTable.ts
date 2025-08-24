import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateGroundingRulesTable1756000000005 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'grounding_rules',
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
            name: 'main_breaker_amp',
            type: 'int',
            comment: 'Amperaje del breaker principal',
          },
          {
            name: 'egc_mm2',
            type: 'decimal',
            precision: 8,
            scale: 3,
            comment: 'Conductor de protección (EGC) en mm²',
          },
          {
            name: 'gec_mm2',
            type: 'decimal',
            precision: 8,
            scale: 3,
            comment: 'Conductor de tierra (GEC) en mm²',
          },
          {
            name: 'notes',
            type: 'text',
            isNullable: true,
            comment: 'Notas y observaciones de la regla',
          },
        ],
        indices: [
          {
            name: 'IDX_GROUNDING_RULES_BREAKER_AMP',
            columnNames: ['main_breaker_amp', 'active'],
          },
        ],
      }),
      true,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('grounding_rules');
  }
}
