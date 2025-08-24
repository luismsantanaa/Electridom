import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateAllTables1755797078019 implements MigrationInterface {
    name = 'CreateAllTables1755797078019'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`cargas\` (\`id\` uuid NOT NULL, \`voltaje\` int NULL, \`horasUso\` int NULL, \`kwhMensual\` float NULL, \`observaciones\` varchar(255) NULL, \`proyecto_id\` varchar(255) NOT NULL, \`activo\` tinyint NOT NULL DEFAULT 1, \`fechaCreacion\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`fechaActualizacion\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`creadoPor\` varchar(255) NULL, \`actualizadoPor\` varchar(255) NULL, \`tipo_ambiente_id\` uuid NULL, \`tipo_artefacto_id\` uuid NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`ambiente\` (\`id\` uuid NOT NULL, \`nombre\` varchar(100) NOT NULL, \`descripcion\` varchar(255) NULL, \`tipo_ambiente_id\` uuid NOT NULL, \`tipoSuperficie\` enum ('Rectangular', 'Circular', 'Triangular', 'Irregular') NOT NULL DEFAULT 'Rectangular', \`largo\` float NULL, \`ancho\` float NULL, \`area\` float NULL, \`altura\` float NULL, \`nivel\` varchar(255) NULL, \`proyecto_id\` varchar(255) NOT NULL, \`activo\` tinyint NOT NULL DEFAULT 1, \`fechaCreacion\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`fechaActualizacion\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`creadoPor\` varchar(255) NULL, \`actualizadoPor\` varchar(255) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`norm_rules\` DROP COLUMN \`code\``);
        await queryRunner.query(`ALTER TABLE \`norm_rules\` ADD \`code\` varchar(255) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`norm_rules\` ADD UNIQUE INDEX \`IDX_81229b6937ad7be4bac537b312\` (\`code\`)`);
        await queryRunner.query(`ALTER TABLE \`norm_rules\` DROP COLUMN \`description\``);
        await queryRunner.query(`ALTER TABLE \`norm_rules\` ADD \`description\` varchar(255) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`norm_rules\` DROP COLUMN \`unit\``);
        await queryRunner.query(`ALTER TABLE \`norm_rules\` ADD \`unit\` varchar(255) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`norm_rules\` DROP COLUMN \`category\``);
        await queryRunner.query(`ALTER TABLE \`norm_rules\` ADD \`category\` varchar(255) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`norm_rules\` DROP COLUMN \`source\``);
        await queryRunner.query(`ALTER TABLE \`norm_rules\` ADD \`source\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`norm_rules\` CHANGE \`isDefault\` \`isDefault\` tinyint NOT NULL DEFAULT 1`);
        await queryRunner.query(`ALTER TABLE \`norm_rules\` DROP COLUMN \`updatedAt\``);
        await queryRunner.query(`ALTER TABLE \`norm_rules\` ADD \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)`);
        await queryRunner.query(`ALTER TABLE \`tipos_ambientes\` ADD CONSTRAINT \`FK_34de0aa2c907e3c253d842d5148\` FOREIGN KEY (\`tipoInstalacion_Id\`) REFERENCES \`tipos_instalaciones\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`tipos_artefactos\` ADD CONSTRAINT \`FK_46d19cb1f926335efbe76890a46\` FOREIGN KEY (\`tipoAmbiente_id\`) REFERENCES \`tipos_ambientes\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`cargas\` ADD CONSTRAINT \`FK_2fd25202f4542073677c451d9bd\` FOREIGN KEY (\`tipo_ambiente_id\`) REFERENCES \`tipos_ambientes\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`cargas\` ADD CONSTRAINT \`FK_fa27c9568f9cc6a40e5d70040ba\` FOREIGN KEY (\`tipo_artefacto_id\`) REFERENCES \`tipos_artefactos\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`ambiente\` ADD CONSTRAINT \`FK_e247dfac4e068b2266e787354a7\` FOREIGN KEY (\`tipo_ambiente_id\`) REFERENCES \`tipos_ambientes\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`ambiente\` DROP FOREIGN KEY \`FK_e247dfac4e068b2266e787354a7\``);
        await queryRunner.query(`ALTER TABLE \`cargas\` DROP FOREIGN KEY \`FK_fa27c9568f9cc6a40e5d70040ba\``);
        await queryRunner.query(`ALTER TABLE \`cargas\` DROP FOREIGN KEY \`FK_2fd25202f4542073677c451d9bd\``);
        await queryRunner.query(`ALTER TABLE \`tipos_artefactos\` DROP FOREIGN KEY \`FK_46d19cb1f926335efbe76890a46\``);
        await queryRunner.query(`ALTER TABLE \`tipos_ambientes\` DROP FOREIGN KEY \`FK_34de0aa2c907e3c253d842d5148\``);
        await queryRunner.query(`ALTER TABLE \`norm_rules\` DROP COLUMN \`updatedAt\``);
        await queryRunner.query(`ALTER TABLE \`norm_rules\` ADD \`updatedAt\` timestamp(0) NOT NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP()`);
        await queryRunner.query(`ALTER TABLE \`norm_rules\` CHANGE \`isDefault\` \`isDefault\` tinyint(1) NOT NULL DEFAULT 1`);
        await queryRunner.query(`ALTER TABLE \`norm_rules\` DROP COLUMN \`source\``);
        await queryRunner.query(`ALTER TABLE \`norm_rules\` ADD \`source\` text NULL`);
        await queryRunner.query(`ALTER TABLE \`norm_rules\` DROP COLUMN \`category\``);
        await queryRunner.query(`ALTER TABLE \`norm_rules\` ADD \`category\` varchar(100) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`norm_rules\` DROP COLUMN \`unit\``);
        await queryRunner.query(`ALTER TABLE \`norm_rules\` ADD \`unit\` varchar(50) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`norm_rules\` DROP COLUMN \`description\``);
        await queryRunner.query(`ALTER TABLE \`norm_rules\` ADD \`description\` text NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`norm_rules\` DROP INDEX \`IDX_81229b6937ad7be4bac537b312\``);
        await queryRunner.query(`ALTER TABLE \`norm_rules\` DROP COLUMN \`code\``);
        await queryRunner.query(`ALTER TABLE \`norm_rules\` ADD \`code\` varchar(100) NOT NULL`);
        await queryRunner.query(`DROP TABLE \`ambiente\``);
        await queryRunner.query(`DROP TABLE \`cargas\``);
    }

}
