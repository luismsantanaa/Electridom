import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateModeladoElectricoTables1704067200000 implements MigrationInterface {
  name = 'CreateModeladoElectricoTables1704067200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Crear tabla proyectos
    await queryRunner.createTable(
      new Table({
        name: 'proyectos',
        columns: [
          {
            name: 'id',
            type: 'bigint',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'nombre',
            type: 'varchar',
            length: '150',
            isNullable: false,
          },
          {
            name: 'descripcion',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'tipo_instalacion',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'tension_sistema',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'fases',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'factor_potencia',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Crear tabla ambientes
    await queryRunner.createTable(
      new Table({
        name: 'ambientes',
        columns: [
          {
            name: 'id',
            type: 'bigint',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'proyecto_id',
            type: 'bigint',
            isNullable: false,
          },
          {
            name: 'nombre',
            type: 'varchar',
            length: '120',
            isNullable: false,
          },
          {
            name: 'superficie_m2',
            type: 'decimal',
            precision: 10,
            scale: 2,
            default: 0,
          },
          {
            name: 'nivel',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'tipo',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'descripcion',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Crear tabla cargas
    await queryRunner.createTable(
      new Table({
        name: 'cargas',
        columns: [
          {
            name: 'id',
            type: 'bigint',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'ambiente_id',
            type: 'bigint',
            isNullable: false,
          },
          {
            name: 'nombre',
            type: 'varchar',
            length: '120',
            isNullable: false,
          },
          {
            name: 'potencia_w',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'tipo',
            type: 'varchar',
            length: '20',
            isNullable: false,
          },
          {
            name: 'factor_uso',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'factor_demanda',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'descripcion',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'marca',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'modelo',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Crear tabla circuitos
    await queryRunner.createTable(
      new Table({
        name: 'circuitos',
        columns: [
          {
            name: 'id',
            type: 'bigint',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'proyecto_id',
            type: 'bigint',
            isNullable: false,
          },
          {
            name: 'ambiente_id',
            type: 'bigint',
            isNullable: false,
          },
          {
            name: 'tipo',
            type: 'varchar',
            length: '20',
            isNullable: false,
          },
          {
            name: 'potencia_va',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'corriente_a',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'observaciones',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'nombre',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'numero_circuito',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'factor_potencia',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'longitud_m',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Crear tabla protecciones
    await queryRunner.createTable(
      new Table({
        name: 'protecciones',
        columns: [
          {
            name: 'id',
            type: 'bigint',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'circuito_id',
            type: 'bigint',
            isNullable: false,
          },
          {
            name: 'tipo',
            type: 'varchar',
            length: '30',
            isNullable: false,
          },
          {
            name: 'capacidad_a',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'curva',
            type: 'varchar',
            length: '5',
            isNullable: true,
          },
          {
            name: 'marca',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'modelo',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'descripcion',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'tension_nominal',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'polos',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Crear tabla conductores
    await queryRunner.createTable(
      new Table({
        name: 'conductores',
        columns: [
          {
            name: 'id',
            type: 'bigint',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'circuito_id',
            type: 'bigint',
            isNullable: false,
          },
          {
            name: 'calibre_awg',
            type: 'varchar',
            length: '10',
            isNullable: false,
          },
          {
            name: 'material',
            type: 'varchar',
            length: '20',
            isNullable: false,
            default: "'Cu'",
          },
          {
            name: 'capacidad_a',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'tipo_aislamiento',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'marca',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'descripcion',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'longitud_m',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'resistencia_ohm_km',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'caida_tension',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'color',
            type: 'varchar',
            length: '20',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Crear tabla normativas_ampacidad
    await queryRunner.createTable(
      new Table({
        name: 'normativas_ampacidad',
        columns: [
          {
            name: 'id',
            type: 'bigint',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'calibre_awg',
            type: 'varchar',
            length: '10',
            isNullable: false,
          },
          {
            name: 'material',
            type: 'varchar',
            length: '20',
            isNullable: false,
          },
          {
            name: 'capacidad_a',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'tipo_aislamiento',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'temperatura_ambiente',
            type: 'decimal',
            precision: 5,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'descripcion',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'normativa',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'tabla_referencia',
            type: 'varchar',
            length: '20',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Crear tabla normativas_breakers
    await queryRunner.createTable(
      new Table({
        name: 'normativas_breakers',
        columns: [
          {
            name: 'id',
            type: 'bigint',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'capacidad_a',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'curva',
            type: 'varchar',
            length: '5',
            isNullable: true,
          },
          {
            name: 'tipo',
            type: 'varchar',
            length: '30',
            isNullable: true,
          },
          {
            name: 'marca',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'modelo',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'descripcion',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'tension_nominal',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'polos',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'normativa',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'tabla_referencia',
            type: 'varchar',
            length: '20',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Crear índices
    await queryRunner.createIndex('proyectos', { name: 'IDX_proyectos_nombre', columnNames: ['nombre'] });
    await queryRunner.createIndex('ambientes', { name: 'IDX_ambientes_proyecto_nombre', columnNames: ['proyecto_id', 'nombre'] });
    await queryRunner.createIndex('cargas', { name: 'IDX_cargas_ambiente_tipo', columnNames: ['ambiente_id', 'tipo'] });
    await queryRunner.createIndex('circuitos', { name: 'IDX_circuitos_proyecto_ambiente_tipo', columnNames: ['proyecto_id', 'ambiente_id', 'tipo'] });
    await queryRunner.createIndex('protecciones', { name: 'IDX_protecciones_circuito', columnNames: ['circuito_id'] });
    await queryRunner.createIndex('conductores', { name: 'IDX_conductores_circuito', columnNames: ['circuito_id'] });
    await queryRunner.createIndex('normativas_ampacidad', { name: 'IDX_normativas_ampacidad_calibre_material', columnNames: ['calibre_awg', 'material'] });
    await queryRunner.createIndex('normativas_breakers', { name: 'IDX_normativas_breakers_capacidad_curva', columnNames: ['capacidad_a', 'curva'] });

    // Crear foreign keys
    await queryRunner.createForeignKey(
      'ambientes',
      new TableForeignKey({
        columnNames: ['proyecto_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'proyectos',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'cargas',
      new TableForeignKey({
        columnNames: ['ambiente_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'ambientes',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'circuitos',
      new TableForeignKey({
        columnNames: ['proyecto_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'proyectos',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'circuitos',
      new TableForeignKey({
        columnNames: ['ambiente_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'ambientes',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'protecciones',
      new TableForeignKey({
        columnNames: ['circuito_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'circuitos',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'conductores',
      new TableForeignKey({
        columnNames: ['circuito_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'circuitos',
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Eliminar foreign keys
    const table = await queryRunner.getTable('conductores');
    const foreignKey = table.foreignKeys.find(fk => fk.columnNames.indexOf('circuito_id') !== -1);
    await queryRunner.dropForeignKey('conductores', foreignKey);

    const table2 = await queryRunner.getTable('protecciones');
    const foreignKey2 = table2.foreignKeys.find(fk => fk.columnNames.indexOf('circuito_id') !== -1);
    await queryRunner.dropForeignKey('protecciones', foreignKey2);

    const table3 = await queryRunner.getTable('circuitos');
    const foreignKey3 = table3.foreignKeys.find(fk => fk.columnNames.indexOf('ambiente_id') !== -1);
    await queryRunner.dropForeignKey('circuitos', foreignKey3);

    const foreignKey4 = table3.foreignKeys.find(fk => fk.columnNames.indexOf('proyecto_id') !== -1);
    await queryRunner.dropForeignKey('circuitos', foreignKey4);

    const table4 = await queryRunner.getTable('cargas');
    const foreignKey5 = table4.foreignKeys.find(fk => fk.columnNames.indexOf('ambiente_id') !== -1);
    await queryRunner.dropForeignKey('cargas', foreignKey5);

    const table5 = await queryRunner.getTable('ambientes');
    const foreignKey6 = table5.foreignKeys.find(fk => fk.columnNames.indexOf('proyecto_id') !== -1);
    await queryRunner.dropForeignKey('ambientes', foreignKey6);

    // Eliminar tablas
    await queryRunner.dropTable('normativas_breakers');
    await queryRunner.dropTable('normativas_ampacidad');
    await queryRunner.dropTable('conductores');
    await queryRunner.dropTable('protecciones');
    await queryRunner.dropTable('circuitos');
    await queryRunner.dropTable('cargas');
    await queryRunner.dropTable('ambientes');
    await queryRunner.dropTable('proyectos');
  }
}
