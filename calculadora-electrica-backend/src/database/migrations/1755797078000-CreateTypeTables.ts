import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTypeTables1755797078000 implements MigrationInterface {
  name = 'CreateTypeTables1755797078000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Crear tabla tipos_instalaciones primero (sin dependencias)
    await queryRunner.query(`
            CREATE TABLE \`tipos_instalaciones\` (
                \`id\` uuid NOT NULL,
                \`name\` varchar(100) NOT NULL,
                \`description\` varchar(255) NULL,
                \`usr_create\` varchar(100) NULL,
                \`usr_update\` varchar(100) NULL,
                \`creation_date\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`update_date\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                \`active\` tinyint NOT NULL DEFAULT 1,
                PRIMARY KEY (\`id\`)
            ) ENGINE=InnoDB
        `);

    // 2. Crear tabla tipos_ambientes (depende de tipos_instalaciones)
    await queryRunner.query(`
            CREATE TABLE \`tipos_ambientes\` (
                \`id\` uuid NOT NULL,
                \`name\` varchar(100) NOT NULL,
                \`description\` varchar(255) NULL,
                \`installation_type_id\` uuid NULL,
                \`usr_create\` varchar(100) NULL,
                \`usr_update\` varchar(100) NULL,
                \`creation_date\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`update_date\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                \`active\` tinyint NOT NULL DEFAULT 1,
                PRIMARY KEY (\`id\`)
            ) ENGINE=InnoDB
        `);

    // 3. Crear tabla tipos_artefactos (depende de tipos_ambientes)
    await queryRunner.query(`
            CREATE TABLE \`tipos_artefactos\` (
                \`id\` uuid NOT NULL,
                \`name\` varchar(100) NOT NULL,
                \`description\` varchar(255) NULL,
                \`power\` decimal(10,2) NULL,
                \`voltage\` decimal(10,2) NULL,
                \`environment_type_id\` uuid NULL,
                \`usr_create\` varchar(100) NULL,
                \`usr_update\` varchar(100) NULL,
                \`creation_date\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`update_date\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                \`active\` tinyint NOT NULL DEFAULT 1,
                PRIMARY KEY (\`id\`)
            ) ENGINE=InnoDB
        `);

    // 4. Crear foreign keys
    await queryRunner.query(`
            ALTER TABLE \`tipos_ambientes\` 
            ADD CONSTRAINT \`FK_tipos_ambientes_installation_type\` 
            FOREIGN KEY (\`installation_type_id\`) 
            REFERENCES \`tipos_instalaciones\`(\`id\`) 
            ON DELETE NO ACTION ON UPDATE NO ACTION
        `);

    await queryRunner.query(`
            ALTER TABLE \`tipos_artefactos\` 
            ADD CONSTRAINT \`FK_tipos_artefactos_environment_type\` 
            FOREIGN KEY (\`environment_type_id\`) 
            REFERENCES \`tipos_ambientes\`(\`id\`) 
            ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Eliminar foreign keys en orden inverso
    await queryRunner.query(
      `ALTER TABLE \`tipos_artefactos\` DROP FOREIGN KEY \`FK_tipos_artefactos_environment_type\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`tipos_ambientes\` DROP FOREIGN KEY \`FK_tipos_ambientes_installation_type\``,
    );

    // Eliminar tablas en orden inverso
    await queryRunner.query(`DROP TABLE \`tipos_artefactos\``);
    await queryRunner.query(`DROP TABLE \`tipos_ambientes\``);
    await queryRunner.query(`DROP TABLE \`tipos_instalaciones\``);
  }
}
