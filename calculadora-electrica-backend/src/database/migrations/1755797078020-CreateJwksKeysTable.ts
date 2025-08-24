import { MigrationInterface, QueryRunner, Table, Index } from 'typeorm';

export class CreateJwksKeysTable1755797078020 implements MigrationInterface {
  name = 'CreateJwksKeysTable1755797078020';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'jwks_keys',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '36',
            isPrimary: true,
            generationStrategy: 'uuid',
          },
          {
            name: 'kid',
            type: 'varchar',
            length: '255',
            isUnique: true,
          },
          {
            name: 'type',
            type: 'enum',
            enum: ['RSA'],
            default: "'RSA'",
          },
          {
            name: 'publicPem',
            type: 'text',
          },
          {
            name: 'privatePem',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'isActive',
            type: 'boolean',
            default: false,
          },
          {
            name: 'rotatedAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
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
      }),
      true,
    );

    // Los índices se crearán automáticamente por las restricciones UNIQUE
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('jwks_keys');
  }
}
