import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateBasicTables1755797077999 implements MigrationInterface {
    name = 'CreateBasicTables1755797077999'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Crear tabla users
        await queryRunner.query(`
            CREATE TABLE \`users\` (
                \`id\` uuid NOT NULL,
                \`email\` varchar(255) NOT NULL,
                \`username\` varchar(100) NOT NULL,
                \`password\` varchar(255) NOT NULL,
                \`role\` enum ('ADMIN', 'CLIENTE', 'AUDITOR') NOT NULL DEFAULT 'CLIENTE',
                \`estado\` enum ('activo', 'inactivo', 'bloqueado') NOT NULL DEFAULT 'activo',
                \`usr_create\` varchar(100) NULL,
                \`usr_update\` varchar(100) NULL,
                \`creation_date\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`update_date\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                \`active\` tinyint NOT NULL DEFAULT 1,
                UNIQUE INDEX \`UQ_97672ac88f789774dd47f7c8be3\` (\`email\`),
                UNIQUE INDEX \`UQ_fe0bb3f6520ee0469504521e710\` (\`username\`),
                PRIMARY KEY (\`id\`)
            ) ENGINE=InnoDB
        `);

        // 2. Crear tabla projects
        await queryRunner.query(`
            CREATE TABLE \`projects\` (
                \`id\` uuid NOT NULL,
                \`name\` varchar(255) NOT NULL,
                \`description\` text NULL,
                \`usr_create\` varchar(100) NULL,
                \`usr_update\` varchar(100) NULL,
                \`creation_date\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`update_date\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                \`active\` tinyint NOT NULL DEFAULT 1,
                PRIMARY KEY (\`id\`)
            ) ENGINE=InnoDB
        `);

        // 3. Crear tabla project_versions
        await queryRunner.query(`
            CREATE TABLE \`project_versions\` (
                \`id\` uuid NOT NULL,
                \`version\` int NOT NULL,
                \`snapshot\` json NOT NULL,
                \`project_id\` uuid NULL,
                \`usr_create\` varchar(100) NULL,
                \`usr_update\` varchar(100) NULL,
                \`creation_date\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`update_date\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                \`active\` tinyint NOT NULL DEFAULT 1,
                PRIMARY KEY (\`id\`)
            ) ENGINE=InnoDB
        `);

        // 4. Crear tabla rule_sets
        await queryRunner.query(`
            CREATE TABLE \`rule_sets\` (
                \`id\` uuid NOT NULL,
                \`name\` varchar(255) NOT NULL,
                \`description\` text NULL,
                \`version\` varchar(50) NOT NULL,
                \`isActive\` tinyint NOT NULL DEFAULT 0,
                \`usr_create\` varchar(100) NULL,
                \`usr_update\` varchar(100) NULL,
                \`creation_date\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`update_date\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                \`active\` tinyint NOT NULL DEFAULT 1,
                PRIMARY KEY (\`id\`)
            ) ENGINE=InnoDB
        `);

        // 5. Crear tabla rule_change_logs
        await queryRunner.query(`
            CREATE TABLE \`rule_change_logs\` (
                \`id\` uuid NOT NULL,
                \`ruleSetId\` uuid NOT NULL,
                \`actor\` varchar(255) NOT NULL,
                \`action\` varchar(50) NOT NULL,
                \`details\` json NULL,
                \`usr_create\` varchar(100) NULL,
                \`usr_update\` varchar(100) NULL,
                \`creation_date\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`update_date\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                \`active\` tinyint NOT NULL DEFAULT 1,
                PRIMARY KEY (\`id\`)
            ) ENGINE=InnoDB
        `);

        // 6. Crear foreign keys
        await queryRunner.query(`
            ALTER TABLE \`project_versions\` 
            ADD CONSTRAINT \`FK_project_versions_project\` 
            FOREIGN KEY (\`project_id\`) 
            REFERENCES \`projects\`(\`id\`) 
            ON DELETE CASCADE ON UPDATE NO ACTION
        `);

        await queryRunner.query(`
            ALTER TABLE \`rule_change_logs\` 
            ADD CONSTRAINT \`FK_rule_change_logs_rule_set\` 
            FOREIGN KEY (\`ruleSetId\`) 
            REFERENCES \`rule_sets\`(\`id\`) 
            ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Eliminar foreign keys en orden inverso
        await queryRunner.query(`ALTER TABLE \`rule_change_logs\` DROP FOREIGN KEY \`FK_rule_change_logs_rule_set\``);
        await queryRunner.query(`ALTER TABLE \`project_versions\` DROP FOREIGN KEY \`FK_project_versions_project\``);
        
        // Eliminar tablas en orden inverso
        await queryRunner.query(`DROP TABLE \`rule_change_logs\``);
        await queryRunner.query(`DROP TABLE \`rule_sets\``);
        await queryRunner.query(`DROP TABLE \`project_versions\``);
        await queryRunner.query(`DROP TABLE \`projects\``);
        await queryRunner.query(`DROP TABLE \`users\``);
    }
}
