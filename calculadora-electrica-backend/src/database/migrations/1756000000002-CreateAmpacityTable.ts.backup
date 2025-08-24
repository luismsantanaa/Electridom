import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateAmpacityTable1756000000002 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'ampacity',
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
            name: 'insulation',
            type: 'varchar',
            length: '20',
            comment: 'Tipo de aislación (THHN, THWN, etc.)',
          },
          {
            name: 'temp_c',
            type: 'int',
            comment: 'Temperatura de operación en Celsius',
          },
          {
            name: 'calibre_awg',
            type: 'int',
            comment: 'Calibre en AWG',
          },
          {
            name: 'seccion_mm2',
            type: 'decimal',
            precision: 8,
            scale: 3,
            comment: 'Sección transversal en mm²',
          },
          {
            name: 'amp',
            type: 'decimal',
            precision: 8,
            scale: 2,
            comment: 'Capacidad de corriente en amperios',
          },
        ],
        indices: [
          {
            name: 'IDX_AMPACITY_MATERIAL_INSULATION',
            columnNames: ['material', 'insulation', 'temp_c', 'active'],
          },
          {
            name: 'IDX_AMPACITY_AWG',
            columnNames: ['calibre_awg', 'active'],
          },
          {
            name: 'IDX_AMPACITY_AMP',
            columnNames: ['amp', 'active'],
          },
        ],
      }),
      true,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('ampacity');
  }
}
