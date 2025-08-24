import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateResistivityTable1756000000004 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'resistivity',
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
            name: 'material',
            type: 'varchar',
            length: '10',
            comment: 'Material del conductor (Cu, Al)',
          },
          {
            name: 'seccion_mm2',
            type: 'decimal',
            precision: 8,
            scale: 3,
            comment: 'Sección transversal en mm²',
          },
          {
            name: 'ohm_km',
            type: 'decimal',
            precision: 10,
            scale: 6,
            comment: 'Resistencia en Ohm por kilómetro',
          },
          {
            name: 'notes',
            type: 'text',
            isNullable: true,
            comment: 'Notas y observaciones de la resistividad',
          },
        ],
        indices: [
          {
            name: 'IDX_RESISTIVITY_MATERIAL_SECTION',
            columnNames: ['material', 'seccion_mm2', 'active'],
          },
          {
            name: 'IDX_RESISTIVITY_SECTION',
            columnNames: ['seccion_mm2', 'active'],
          },
        ],
      }),
      true,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('resistivity');
  }
}
