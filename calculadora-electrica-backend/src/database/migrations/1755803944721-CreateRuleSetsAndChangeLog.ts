import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateRuleSetsAndChangeLog1755803944721 implements MigrationInterface {
    name = 'CreateRuleSetsAndChangeLog1755803944721'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX \`IDX_81229b6937ad7be4bac537b312\` ON \`norm_rules\``);
        await queryRunner.query(`CREATE TABLE \`rule_sets\` (\`id\` uuid NOT NULL, \`name\` varchar(200) NOT NULL, \`description\` text NULL, \`status\` varchar(16) NOT NULL DEFAULT 'DRAFT', \`effectiveFrom\` datetime NULL, \`effectiveTo\` datetime NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), INDEX \`IDX_d6295046fbd05aa5a70283caac\` (\`effectiveFrom\`, \`effectiveTo\`), INDEX \`IDX_0cc73966e03f28e2bbc9588c6f\` (\`status\`, \`effectiveFrom\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`rule_change_logs\` (\`id\` uuid NOT NULL, \`ruleSetId\` uuid NOT NULL, \`ruleCode\` varchar(100) NOT NULL, \`changeType\` varchar(16) NOT NULL, \`actor\` varchar(100) NOT NULL, \`beforeValue\` json NULL, \`afterValue\` json NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), INDEX \`IDX_cfdaecb0ba714306de46151d9e\` (\`actor\`, \`createdAt\`), INDEX \`IDX_c067885c7e7db4809a530a6327\` (\`ruleSetId\`, \`ruleCode\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`norm_rules\` ADD \`ruleSetId\` uuid NULL`);
        await queryRunner.query(`ALTER TABLE \`norm_rules\` DROP COLUMN \`code\``);
        await queryRunner.query(`ALTER TABLE \`norm_rules\` ADD \`code\` varchar(100) NOT NULL`);
        await queryRunner.query(`CREATE UNIQUE INDEX \`IDX_308f3d208a460415bac8f734d9\` ON \`norm_rules\` (\`ruleSetId\`, \`code\`)`);
        await queryRunner.query(`ALTER TABLE \`norm_rules\` ADD CONSTRAINT \`FK_cc17c2122dafe78d7047f085038\` FOREIGN KEY (\`ruleSetId\`) REFERENCES \`rule_sets\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`norm_rules\` DROP FOREIGN KEY \`FK_cc17c2122dafe78d7047f085038\``);
        await queryRunner.query(`DROP INDEX \`IDX_308f3d208a460415bac8f734d9\` ON \`norm_rules\``);
        await queryRunner.query(`ALTER TABLE \`norm_rules\` DROP COLUMN \`code\``);
        await queryRunner.query(`ALTER TABLE \`norm_rules\` ADD \`code\` varchar(255) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`norm_rules\` DROP COLUMN \`ruleSetId\``);
        await queryRunner.query(`DROP INDEX \`IDX_c067885c7e7db4809a530a6327\` ON \`rule_change_logs\``);
        await queryRunner.query(`DROP INDEX \`IDX_cfdaecb0ba714306de46151d9e\` ON \`rule_change_logs\``);
        await queryRunner.query(`DROP TABLE \`rule_change_logs\``);
        await queryRunner.query(`DROP INDEX \`IDX_0cc73966e03f28e2bbc9588c6f\` ON \`rule_sets\``);
        await queryRunner.query(`DROP INDEX \`IDX_d6295046fbd05aa5a70283caac\` ON \`rule_sets\``);
        await queryRunner.query(`DROP TABLE \`rule_sets\``);
        await queryRunner.query(`CREATE UNIQUE INDEX \`IDX_81229b6937ad7be4bac537b312\` ON \`norm_rules\` (\`code\`)`);
    }

}
