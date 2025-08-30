import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAuditLogsTable1755816294829 implements MigrationInterface {
  name = 'CreateAuditLogsTable1755816294829';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Eliminar foreign keys de forma segura
    try {
      await queryRunner.query(
        `ALTER TABLE \`tipos_artefactos\` DROP FOREIGN KEY \`FK_46d19cb1f926335efbe76890a46\``,
      );
    } catch (error) {
      console.log(
        'Foreign key FK_46d19cb1f926335efbe76890a46 no existe, continuando...',
      );
    }

    try {
      await queryRunner.query(
        `ALTER TABLE \`tipos_ambientes\` DROP FOREIGN KEY \`FK_34de0aa2c907e3c253d842d5148\``,
      );
    } catch (error) {
      console.log(
        'Foreign key FK_34de0aa2c907e3c253d842d5148 no existe, continuando...',
      );
    }

    try {
      await queryRunner.query(
        `ALTER TABLE \`project_versions\` DROP FOREIGN KEY \`FK_e03248bd62e51cc0dcf7c9712d1\``,
      );
    } catch (error) {
      console.log(
        'Foreign key FK_e03248bd62e51cc0dcf7c9712d1 no existe, continuando...',
      );
    }

    try {
      await queryRunner.query(
        `ALTER TABLE \`loads\` DROP FOREIGN KEY \`FK_2fd25202f4542073677c451d9bd\``,
      );
    } catch (error) {
      console.log(
        'Foreign key FK_2fd25202f4542073677c451d9bd no existe, continuando...',
      );
    }

    // Eliminar índices de forma segura
    try {
      await queryRunner.query(
        `DROP INDEX \`IDX_0729c51a1033ffa5307d800351\` ON \`project_versions\``,
      );
    } catch (error) {
      console.log(
        'Índice IDX_0729c51a1033ffa5307d800351 no existe, continuando...',
      );
    }

    // Crear tabla audit_logs si no existe
    try {
      await queryRunner.query(
        `CREATE TABLE \`audit_logs\` (\`id\` uuid NOT NULL, \`userId\` uuid NULL, \`action\` varchar(64) NOT NULL, \`ip\` varchar(64) NULL, \`userAgent\` varchar(256) NULL, \`detail\` text NULL, \`traceId\` varchar(64) NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), INDEX \`IDX_8873ff53e998ead3c10a6b213b\` (\`traceId\`), INDEX \`IDX_0ec936941eb8556fcd7a1f0eae\` (\`action\`, \`createdAt\`), INDEX \`IDX_99e589da8f9e9326ee0d01a028\` (\`userId\`, \`createdAt\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
      );
    } catch (error) {
      console.log('Tabla audit_logs ya existe, continuando...');
    }
    await queryRunner.query(
      `ALTER TABLE \`tipos_instalaciones\` DROP COLUMN \`activo\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`tipos_instalaciones\` DROP COLUMN \`fechaCreacion\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`tipos_instalaciones\` DROP COLUMN \`creado_por\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`tipos_instalaciones\` DROP COLUMN \`fechaActualizacion\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`tipos_instalaciones\` DROP COLUMN \`actualizado_por\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`users\` DROP COLUMN \`fechaCreacion\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`users\` DROP COLUMN \`fechaActualizacion\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`tipos_artefactos\` DROP COLUMN \`potencia\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`tipos_artefactos\` DROP COLUMN \`voltaje\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`tipos_artefactos\` DROP COLUMN \`activo\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`tipos_artefactos\` DROP COLUMN \`fechaCreacion\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`tipos_artefactos\` DROP COLUMN \`creadoPor\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`tipos_artefactos\` DROP COLUMN \`fechaActualizacion\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`tipos_artefactos\` DROP COLUMN \`actualizadoPor\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`tipos_artefactos\` DROP COLUMN \`tipoAmbiente_id\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`tipos_ambientes\` DROP COLUMN \`activo\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`tipos_ambientes\` DROP COLUMN \`fechaCreacion\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`tipos_ambientes\` DROP COLUMN \`creadoPor\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`tipos_ambientes\` DROP COLUMN \`fechaActualizacion\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`tipos_ambientes\` DROP COLUMN \`actualizadoPor\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`tipos_ambientes\` DROP COLUMN \`tipoInstalacion_Id\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`project_versions\` DROP COLUMN \`projectId\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`project_versions\` DROP COLUMN \`createdAt\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`projects\` DROP COLUMN \`projectName\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`projects\` DROP COLUMN \`createdAt\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`projects\` DROP COLUMN \`updatedAt\``,
    );
    await queryRunner.query(`ALTER TABLE \`loads\` DROP COLUMN \`horasUso\``);
    await queryRunner.query(`ALTER TABLE \`loads\` DROP COLUMN \`kwhMensual\``);
    await queryRunner.query(
      `ALTER TABLE \`loads\` DROP COLUMN \`observaciones\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`loads\` DROP COLUMN \`proyecto_id\``,
    );
    await queryRunner.query(`ALTER TABLE \`loads\` DROP COLUMN \`activo\``);
    await queryRunner.query(
      `ALTER TABLE \`loads\` DROP COLUMN \`fechaCreacion\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`loads\` DROP COLUMN \`fechaActualizacion\``,
    );
    await queryRunner.query(`ALTER TABLE \`loads\` DROP COLUMN \`creadoPor\``);
    await queryRunner.query(
      `ALTER TABLE \`loads\` DROP COLUMN \`actualizadoPor\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`loads\` DROP COLUMN \`tipo_ambiente_id\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`environment\` DROP COLUMN \`description\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`environment\` DROP COLUMN \`tipoSuperficie\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`environment\` DROP COLUMN \`largo\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`environment\` DROP COLUMN \`ancho\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`environment\` DROP COLUMN \`altura\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`environment\` DROP COLUMN \`nivel\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`environment\` DROP COLUMN \`proyecto_id\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`environment\` DROP COLUMN \`activo\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`environment\` DROP COLUMN \`fechaCreacion\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`environment\` DROP COLUMN \`fechaActualizacion\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`environment\` DROP COLUMN \`creadoPor\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`environment\` DROP COLUMN \`actualizadoPor\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`tipos_instalaciones\` ADD \`usr_create\` varchar(100) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`tipos_instalaciones\` ADD \`usr_update\` varchar(100) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`tipos_instalaciones\` ADD \`creation_date\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)`,
    );
    await queryRunner.query(
      `ALTER TABLE \`tipos_instalaciones\` ADD \`update_date\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)`,
    );
    await queryRunner.query(
      `ALTER TABLE \`tipos_instalaciones\` ADD \`active\` tinyint NOT NULL DEFAULT 1`,
    );
    await queryRunner.query(
      `ALTER TABLE \`users\` ADD \`usr_create\` varchar(100) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`users\` ADD \`usr_update\` varchar(100) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`users\` ADD \`creation_date\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)`,
    );
    await queryRunner.query(
      `ALTER TABLE \`users\` ADD \`update_date\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)`,
    );
    await queryRunner.query(
      `ALTER TABLE \`users\` ADD \`active\` tinyint NOT NULL DEFAULT 1`,
    );
    await queryRunner.query(
      `ALTER TABLE \`tipos_artefactos\` ADD \`usr_create\` varchar(100) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`tipos_artefactos\` ADD \`usr_update\` varchar(100) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`tipos_artefactos\` ADD \`creation_date\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)`,
    );
    await queryRunner.query(
      `ALTER TABLE \`tipos_artefactos\` ADD \`update_date\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)`,
    );
    await queryRunner.query(
      `ALTER TABLE \`tipos_artefactos\` ADD \`active\` tinyint NOT NULL DEFAULT 1`,
    );
    await queryRunner.query(
      `ALTER TABLE \`tipos_artefactos\` ADD \`description\` varchar(255) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`tipos_artefactos\` ADD \`potenciaNominal\` decimal(10,2) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`tipos_artefactos\` ADD \`factorDemanda\` decimal(10,2) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`tipos_ambientes\` ADD \`usr_create\` varchar(100) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`tipos_ambientes\` ADD \`usr_update\` varchar(100) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`tipos_ambientes\` ADD \`creation_date\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)`,
    );
    await queryRunner.query(
      `ALTER TABLE \`tipos_ambientes\` ADD \`update_date\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)`,
    );
    await queryRunner.query(
      `ALTER TABLE \`tipos_ambientes\` ADD \`active\` tinyint NOT NULL DEFAULT 1`,
    );
    await queryRunner.query(
      `ALTER TABLE \`tipos_ambientes\` ADD \`description\` varchar(255) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`project_versions\` ADD \`usr_create\` varchar(100) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`project_versions\` ADD \`usr_update\` varchar(100) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`project_versions\` ADD \`creation_date\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)`,
    );
    await queryRunner.query(
      `ALTER TABLE \`project_versions\` ADD \`update_date\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)`,
    );
    await queryRunner.query(
      `ALTER TABLE \`project_versions\` ADD \`active\` tinyint NOT NULL DEFAULT 1`,
    );
    await queryRunner.query(
      `ALTER TABLE \`project_versions\` ADD \`project_id\` uuid NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`projects\` ADD \`usr_create\` varchar(100) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`projects\` ADD \`usr_update\` varchar(100) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`projects\` ADD \`creation_date\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)`,
    );
    await queryRunner.query(
      `ALTER TABLE \`projects\` ADD \`update_date\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)`,
    );
    await queryRunner.query(
      `ALTER TABLE \`projects\` ADD \`active\` tinyint NOT NULL DEFAULT 1`,
    );
    await queryRunner.query(
      `ALTER TABLE \`projects\` ADD \`name\` varchar(255) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`loads\` ADD \`usr_create\` varchar(100) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`loads\` ADD \`usr_update\` varchar(100) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`loads\` ADD \`creation_date\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)`,
    );
    await queryRunner.query(
      `ALTER TABLE \`loads\` ADD \`update_date\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)`,
    );
    await queryRunner.query(
      `ALTER TABLE \`loads\` ADD \`active\` tinyint NOT NULL DEFAULT 1`,
    );
    await queryRunner.query(
      `ALTER TABLE \`loads\` ADD \`name\` varchar(100) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`loads\` ADD \`potencia\` decimal(10,2) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`environment\` ADD \`usr_create\` varchar(100) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`environment\` ADD \`usr_update\` varchar(100) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`environment\` ADD \`creation_date\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)`,
    );
    await queryRunner.query(
      `ALTER TABLE \`environment\` ADD \`update_date\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)`,
    );
    await queryRunner.query(
      `ALTER TABLE \`environment\` ADD \`active\` tinyint NOT NULL DEFAULT 1`,
    );
    await queryRunner.query(`ALTER TABLE \`loads\` DROP COLUMN \`voltaje\``);
    await queryRunner.query(
      `ALTER TABLE \`loads\` ADD \`voltaje\` decimal(10,2) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`environment\` DROP FOREIGN KEY \`FK_e247dfac4e068b2266e787354a7\``,
    );
    await queryRunner.query(`ALTER TABLE \`environment\` DROP COLUMN \`area\``);
    await queryRunner.query(
      `ALTER TABLE \`environment\` ADD \`area\` decimal(10,2) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`environment\` CHANGE \`tipo_ambiente_id\` \`tipo_ambiente_id\` uuid NULL`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX \`IDX_9a5d47486f6e6d997c1fc50b5c\` ON \`project_versions\` (\`project_id\`, \`versionNumber\`)`,
    );
    await queryRunner.query(
      `ALTER TABLE \`project_versions\` ADD CONSTRAINT \`FK_f1deab56bfe3bd92fe174118519\` FOREIGN KEY (\`project_id\`) REFERENCES \`projects\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`environment\` ADD CONSTRAINT \`FK_e247dfac4e068b2266e787354a7\` FOREIGN KEY (\`tipo_ambiente_id\`) REFERENCES \`tipos_ambientes\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`environment\` DROP FOREIGN KEY \`FK_e247dfac4e068b2266e787354a7\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`project_versions\` DROP FOREIGN KEY \`FK_f1deab56bfe3bd92fe174118519\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_9a5d47486f6e6d997c1fc50b5c\` ON \`project_versions\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`environment\` CHANGE \`tipo_ambiente_id\` \`tipo_ambiente_id\` uuid NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE \`environment\` DROP COLUMN \`area\``);
    await queryRunner.query(
      `ALTER TABLE \`environment\` ADD \`area\` float(12) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`environment\` ADD CONSTRAINT \`FK_e247dfac4e068b2266e787354a7\` FOREIGN KEY (\`tipo_ambiente_id\`) REFERENCES \`tipos_ambientes\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(`ALTER TABLE \`loads\` DROP COLUMN \`voltaje\``);
    await queryRunner.query(`ALTER TABLE \`loads\` ADD \`voltaje\` int NULL`);
    await queryRunner.query(
      `ALTER TABLE \`environment\` DROP COLUMN \`active\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`environment\` DROP COLUMN \`update_date\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`environment\` DROP COLUMN \`creation_date\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`environment\` DROP COLUMN \`usr_update\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`environment\` DROP COLUMN \`usr_create\``,
    );
    await queryRunner.query(`ALTER TABLE \`loads\` DROP COLUMN \`potencia\``);
    await queryRunner.query(`ALTER TABLE \`loads\` DROP COLUMN \`name\``);
    await queryRunner.query(`ALTER TABLE \`loads\` DROP COLUMN \`active\``);
    await queryRunner.query(
      `ALTER TABLE \`loads\` DROP COLUMN \`update_date\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`loads\` DROP COLUMN \`creation_date\``,
    );
    await queryRunner.query(`ALTER TABLE \`loads\` DROP COLUMN \`usr_update\``);
    await queryRunner.query(`ALTER TABLE \`loads\` DROP COLUMN \`usr_create\``);
    await queryRunner.query(`ALTER TABLE \`projects\` DROP COLUMN \`name\``);
    await queryRunner.query(`ALTER TABLE \`projects\` DROP COLUMN \`active\``);
    await queryRunner.query(
      `ALTER TABLE \`projects\` DROP COLUMN \`update_date\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`projects\` DROP COLUMN \`creation_date\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`projects\` DROP COLUMN \`usr_update\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`projects\` DROP COLUMN \`usr_create\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`project_versions\` DROP COLUMN \`project_id\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`project_versions\` DROP COLUMN \`active\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`project_versions\` DROP COLUMN \`update_date\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`project_versions\` DROP COLUMN \`creation_date\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`project_versions\` DROP COLUMN \`usr_update\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`project_versions\` DROP COLUMN \`usr_create\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`tipos_ambientes\` DROP COLUMN \`description\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`tipos_ambientes\` DROP COLUMN \`active\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`tipos_ambientes\` DROP COLUMN \`update_date\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`tipos_ambientes\` DROP COLUMN \`creation_date\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`tipos_ambientes\` DROP COLUMN \`usr_update\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`tipos_ambientes\` DROP COLUMN \`usr_create\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`tipos_artefactos\` DROP COLUMN \`factorDemanda\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`tipos_artefactos\` DROP COLUMN \`potenciaNominal\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`tipos_artefactos\` DROP COLUMN \`description\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`tipos_artefactos\` DROP COLUMN \`active\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`tipos_artefactos\` DROP COLUMN \`update_date\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`tipos_artefactos\` DROP COLUMN \`creation_date\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`tipos_artefactos\` DROP COLUMN \`usr_update\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`tipos_artefactos\` DROP COLUMN \`usr_create\``,
    );
    await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`active\``);
    await queryRunner.query(
      `ALTER TABLE \`users\` DROP COLUMN \`update_date\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`users\` DROP COLUMN \`creation_date\``,
    );
    await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`usr_update\``);
    await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`usr_create\``);
    await queryRunner.query(
      `ALTER TABLE \`tipos_instalaciones\` DROP COLUMN \`active\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`tipos_instalaciones\` DROP COLUMN \`update_date\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`tipos_instalaciones\` DROP COLUMN \`creation_date\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`tipos_instalaciones\` DROP COLUMN \`usr_update\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`tipos_instalaciones\` DROP COLUMN \`usr_create\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`environment\` ADD \`actualizadoPor\` varchar(255) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`environment\` ADD \`creadoPor\` varchar(255) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`environment\` ADD \`fechaActualizacion\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)`,
    );
    await queryRunner.query(
      `ALTER TABLE \`environment\` ADD \`fechaCreacion\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)`,
    );
    await queryRunner.query(
      `ALTER TABLE \`environment\` ADD \`activo\` tinyint NOT NULL DEFAULT 1`,
    );
    await queryRunner.query(
      `ALTER TABLE \`environment\` ADD \`proyecto_id\` varchar(255) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`environment\` ADD \`nivel\` varchar(255) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`environment\` ADD \`altura\` float(12) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`environment\` ADD \`ancho\` float(12) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`environment\` ADD \`largo\` float(12) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`environment\` ADD \`tipoSuperficie\` enum ('Rectangular', 'Circular', 'Triangular', 'Irregular') NOT NULL DEFAULT 'Rectangular'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`environment\` ADD \`description\` varchar(255) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`loads\` ADD \`tipo_ambiente_id\` uuid NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`loads\` ADD \`actualizadoPor\` varchar(255) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`loads\` ADD \`creadoPor\` varchar(255) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`loads\` ADD \`fechaActualizacion\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)`,
    );
    await queryRunner.query(
      `ALTER TABLE \`loads\` ADD \`fechaCreacion\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)`,
    );
    await queryRunner.query(
      `ALTER TABLE \`loads\` ADD \`activo\` tinyint NOT NULL DEFAULT 1`,
    );
    await queryRunner.query(
      `ALTER TABLE \`loads\` ADD \`proyecto_id\` varchar(255) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`loads\` ADD \`observaciones\` varchar(255) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`loads\` ADD \`kwhMensual\` float(12) NULL`,
    );
    await queryRunner.query(`ALTER TABLE \`loads\` ADD \`horasUso\` int NULL`);
    await queryRunner.query(
      `ALTER TABLE \`projects\` ADD \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)`,
    );
    await queryRunner.query(
      `ALTER TABLE \`projects\` ADD \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)`,
    );
    await queryRunner.query(
      `ALTER TABLE \`projects\` ADD \`projectName\` varchar(120) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`project_versions\` ADD \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)`,
    );
    await queryRunner.query(
      `ALTER TABLE \`project_versions\` ADD \`projectId\` uuid NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`tipos_ambientes\` ADD \`tipoInstalacion_Id\` uuid NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`tipos_ambientes\` ADD \`actualizadoPor\` varchar(255) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`tipos_ambientes\` ADD \`fechaActualizacion\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)`,
    );
    await queryRunner.query(
      `ALTER TABLE \`tipos_ambientes\` ADD \`creadoPor\` varchar(255) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`tipos_ambientes\` ADD \`fechaCreacion\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)`,
    );
    await queryRunner.query(
      `ALTER TABLE \`tipos_ambientes\` ADD \`activo\` tinyint NOT NULL DEFAULT 1`,
    );
    await queryRunner.query(
      `ALTER TABLE \`tipos_artefactos\` ADD \`tipoAmbiente_id\` uuid NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`tipos_artefactos\` ADD \`actualizadoPor\` varchar(100) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`tipos_artefactos\` ADD \`fechaActualizacion\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)`,
    );
    await queryRunner.query(
      `ALTER TABLE \`tipos_artefactos\` ADD \`creadoPor\` varchar(100) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`tipos_artefactos\` ADD \`fechaCreacion\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)`,
    );
    await queryRunner.query(
      `ALTER TABLE \`tipos_artefactos\` ADD \`activo\` tinyint NOT NULL DEFAULT 1`,
    );
    await queryRunner.query(
      `ALTER TABLE \`tipos_artefactos\` ADD \`voltaje\` decimal(10,2) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`tipos_artefactos\` ADD \`potencia\` decimal(10,2) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`users\` ADD \`fechaActualizacion\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)`,
    );
    await queryRunner.query(
      `ALTER TABLE \`users\` ADD \`fechaCreacion\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)`,
    );
    await queryRunner.query(
      `ALTER TABLE \`tipos_instalaciones\` ADD \`actualizado_por\` varchar(255) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`tipos_instalaciones\` ADD \`fechaActualizacion\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)`,
    );
    await queryRunner.query(
      `ALTER TABLE \`tipos_instalaciones\` ADD \`creado_por\` varchar(255) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`tipos_instalaciones\` ADD \`fechaCreacion\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)`,
    );
    await queryRunner.query(
      `ALTER TABLE \`tipos_instalaciones\` ADD \`activo\` tinyint NOT NULL DEFAULT 1`,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_99e589da8f9e9326ee0d01a028\` ON \`audit_logs\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_0ec936941eb8556fcd7a1f0eae\` ON \`audit_logs\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_8873ff53e998ead3c10a6b213b\` ON \`audit_logs\``,
    );
    await queryRunner.query(`DROP TABLE \`audit_logs\``);
    await queryRunner.query(
      `CREATE UNIQUE INDEX \`IDX_0729c51a1033ffa5307d800351\` ON \`project_versions\` (\`projectId\`, \`versionNumber\`)`,
    );
    await queryRunner.query(
      `ALTER TABLE \`loads\` ADD CONSTRAINT \`FK_2fd25202f4542073677c451d9bd\` FOREIGN KEY (\`tipo_ambiente_id\`) REFERENCES \`tipos_ambientes\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`project_versions\` ADD CONSTRAINT \`FK_e03248bd62e51cc0dcf7c9712d1\` FOREIGN KEY (\`projectId\`) REFERENCES \`projects\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`tipos_ambientes\` ADD CONSTRAINT \`FK_34de0aa2c907e3c253d842d5148\` FOREIGN KEY (\`tipoInstalacion_Id\`) REFERENCES \`tipos_instalaciones\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`tipos_artefactos\` ADD CONSTRAINT \`FK_46d19cb1f926335efbe76890a46\` FOREIGN KEY (\`tipoAmbiente_id\`) REFERENCES \`tipos_ambientes\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}
