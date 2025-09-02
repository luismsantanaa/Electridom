import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateProtectionAndCircuitTables1756000000006 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Crear tabla circuit
    await queryRunner.createTable(
      new Table({
        name: 'circuit',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'projectId',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'loadVA',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'conductorGauge',
            type: 'varchar',
            length: '20',
            isNullable: false,
          },
          {
            name: 'areaType',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'phase',
            type: 'int',
            isNullable: false,
            default: 1,
          },
          {
            name: 'voltage',
            type: 'int',
            isNullable: false,
            default: 120,
          },
          {
            name: 'currentA',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'notes',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Crear tabla protection
    await queryRunner.createTable(
      new Table({
        name: 'protection',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'circuitId',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'breakerAmp',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'breakerType',
            type: 'varchar',
            length: '16',
            isNullable: false,
            default: "'MCB'",
          },
          {
            name: 'differentialType',
            type: 'varchar',
            length: '8',
            isNullable: false,
            default: "'NONE'",
          },
          {
            name: 'notes',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Crear índices para mejor performance
    await queryRunner.query('CREATE INDEX IDX_CIRCUIT_PROJECT_ID ON circuit (projectId)');
    await queryRunner.query('CREATE INDEX IDX_CIRCUIT_AREA_TYPE ON circuit (areaType)');
    await queryRunner.query('CREATE INDEX IDX_PROTECTION_CIRCUIT_ID ON protection (circuitId)');

    // Crear foreign key para protection -> circuit
    await queryRunner.createForeignKey(
      'protection',
      new TableForeignKey({
        columnNames: ['circuitId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'circuit',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      }),
    );

    console.log('✅ Tablas circuit y protection creadas exitosamente');
    console.log('✅ Índices creados para optimización de consultas');
    console.log('✅ Foreign key protection -> circuit configurado');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Eliminar foreign key
    const protectionTable = await queryRunner.getTable('protection');
    if (protectionTable) {
      const foreignKey = protectionTable.foreignKeys.find(
        (fk) => fk.columnNames.indexOf('circuitId') !== -1,
      );
      if (foreignKey) {
        await queryRunner.dropForeignKey('protection', foreignKey);
      }
    }

    // Eliminar tablas
    await queryRunner.dropTable('protection');
    await queryRunner.dropTable('circuit');

    console.log('✅ Tablas circuit y protection eliminadas exitosamente');
  }
}
