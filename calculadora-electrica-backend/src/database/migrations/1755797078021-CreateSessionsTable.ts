import { MigrationInterface, QueryRunner, Table, Index, ForeignKey, TableIndex } from 'typeorm';

export class CreateSessionsTable1755797078021 implements MigrationInterface {
  name = 'CreateSessionsTable1755797078021';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'sessions',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
          },
          {
            name: 'userId',
            type: 'uuid',
          },
          {
            name: 'refreshHash',
            type: 'varchar',
            length: '128',
            isUnique: true,
          },
          {
            name: 'userAgent',
            type: 'text',
          },
          {
            name: 'ip',
            type: 'varchar',
            length: '64',
          },
          {
            name: 'expiresAt',
            type: 'datetime',
          },
          {
            name: 'revokedAt',
            type: 'datetime',
            isNullable: true,
          },
          {
            name: 'jti',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'creationDate',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updateDate',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'usrCreate',
            type: 'varchar',
            length: '255',
            default: "'system'",
          },
          {
            name: 'usrUpdate',
            type: 'varchar',
            length: '255',
            default: "'system'",
          },
          {
            name: 'active',
            type: 'boolean',
            default: true,
          },
        ],
        foreignKeys: [
          {
            columnNames: ['userId'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
      true,
    );

    // Crear índices
    await queryRunner.createIndex('sessions', new TableIndex({
      name: 'IDX_sessions_userId',
      columnNames: ['userId'],
    }));

    await queryRunner.createIndex('sessions', new TableIndex({
      name: 'IDX_sessions_refreshHash',
      columnNames: ['refreshHash'],
      isUnique: true,
    }));

    await queryRunner.createIndex('sessions', new TableIndex({
      name: 'IDX_sessions_expiresAt',
      columnNames: ['expiresAt'],
    }));

    await queryRunner.createIndex('sessions', new TableIndex({
      name: 'IDX_sessions_revokedAt',
      columnNames: ['revokedAt'],
    }));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('sessions');
  }
}
