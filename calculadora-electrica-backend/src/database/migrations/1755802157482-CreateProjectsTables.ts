import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateProjectsTables1755802157482 implements MigrationInterface {
    name = 'CreateProjectsTables1755802157482'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`project_versions\` (\`id\` uuid NOT NULL, \`projectId\` uuid NOT NULL, \`versionNumber\` int NOT NULL, \`inputSuperficies\` json NOT NULL, \`inputConsumos\` json NOT NULL, \`inputOpciones\` json NULL, \`outputCargasPorAmbiente\` json NOT NULL, \`outputTotales\` json NOT NULL, \`outputPropuestaCircuitos\` json NOT NULL, \`outputWarnings\` json NOT NULL DEFAULT '[]', \`rulesSignature\` varchar(200) NOT NULL, \`note\` varchar(240) NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_0729c51a1033ffa5307d800351\` (\`projectId\`, \`versionNumber\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`projects\` (\`id\` uuid NOT NULL, \`projectName\` varchar(120) NOT NULL, \`description\` text NULL, \`status\` varchar(16) NOT NULL DEFAULT 'ACTIVE', \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`project_versions\` ADD CONSTRAINT \`FK_e03248bd62e51cc0dcf7c9712d1\` FOREIGN KEY (\`projectId\`) REFERENCES \`projects\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`project_versions\` DROP FOREIGN KEY \`FK_e03248bd62e51cc0dcf7c9712d1\``);
        await queryRunner.query(`DROP TABLE \`projects\``);
        await queryRunner.query(`DROP INDEX \`IDX_0729c51a1033ffa5307d800351\` ON \`project_versions\``);
        await queryRunner.query(`DROP TABLE \`project_versions\``);
    }

}
