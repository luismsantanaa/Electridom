import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAuditFieldsAndUTF81755810670920 implements MigrationInterface {
    name = 'AddAuditFieldsAndUTF81755810670920'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX \`IDX_cfdaecb0ba714306de46151d9e\` ON \`rule_change_logs\``);
        await queryRunner.query(`ALTER TABLE \`rule_change_logs\` DROP COLUMN \`createdAt\``);
        await queryRunner.query(`ALTER TABLE \`norm_rules\` DROP COLUMN \`updatedAt\``);
        await queryRunner.query(`ALTER TABLE \`rule_sets\` DROP COLUMN \`createdAt\``);
        await queryRunner.query(`ALTER TABLE \`rule_sets\` DROP COLUMN \`updatedAt\``);
        await queryRunner.query(`ALTER TABLE \`rule_change_logs\` ADD \`usr_create\` varchar(100) NULL`);
        await queryRunner.query(`ALTER TABLE \`rule_change_logs\` ADD \`usr_update\` varchar(100) NULL`);
        await queryRunner.query(`ALTER TABLE \`rule_change_logs\` ADD \`creation_date\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)`);
        await queryRunner.query(`ALTER TABLE \`rule_change_logs\` ADD \`update_date\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)`);
        await queryRunner.query(`ALTER TABLE \`rule_change_logs\` ADD \`active\` tinyint NOT NULL DEFAULT 1`);
        await queryRunner.query(`ALTER TABLE \`norm_rules\` ADD \`usr_create\` varchar(100) NULL`);
        await queryRunner.query(`ALTER TABLE \`norm_rules\` ADD \`usr_update\` varchar(100) NULL`);
        await queryRunner.query(`ALTER TABLE \`norm_rules\` ADD \`creation_date\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)`);
        await queryRunner.query(`ALTER TABLE \`norm_rules\` ADD \`update_date\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)`);
        await queryRunner.query(`ALTER TABLE \`norm_rules\` ADD \`active\` tinyint NOT NULL DEFAULT 1`);
        await queryRunner.query(`ALTER TABLE \`rule_sets\` ADD \`usr_create\` varchar(100) NULL`);
        await queryRunner.query(`ALTER TABLE \`rule_sets\` ADD \`usr_update\` varchar(100) NULL`);
        await queryRunner.query(`ALTER TABLE \`rule_sets\` ADD \`creation_date\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)`);
        await queryRunner.query(`ALTER TABLE \`rule_sets\` ADD \`update_date\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)`);
        await queryRunner.query(`ALTER TABLE \`rule_sets\` ADD \`active\` tinyint NOT NULL DEFAULT 1`);
        await queryRunner.query(`CREATE INDEX \`IDX_1656d5c4058a57331d5001c407\` ON \`rule_change_logs\` (\`actor\`, \`creation_date\`)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX \`IDX_1656d5c4058a57331d5001c407\` ON \`rule_change_logs\``);
        await queryRunner.query(`ALTER TABLE \`rule_sets\` DROP COLUMN \`active\``);
        await queryRunner.query(`ALTER TABLE \`rule_sets\` DROP COLUMN \`update_date\``);
        await queryRunner.query(`ALTER TABLE \`rule_sets\` DROP COLUMN \`creation_date\``);
        await queryRunner.query(`ALTER TABLE \`rule_sets\` DROP COLUMN \`usr_update\``);
        await queryRunner.query(`ALTER TABLE \`rule_sets\` DROP COLUMN \`usr_create\``);
        await queryRunner.query(`ALTER TABLE \`norm_rules\` DROP COLUMN \`active\``);
        await queryRunner.query(`ALTER TABLE \`norm_rules\` DROP COLUMN \`update_date\``);
        await queryRunner.query(`ALTER TABLE \`norm_rules\` DROP COLUMN \`creation_date\``);
        await queryRunner.query(`ALTER TABLE \`norm_rules\` DROP COLUMN \`usr_update\``);
        await queryRunner.query(`ALTER TABLE \`norm_rules\` DROP COLUMN \`usr_create\``);
        await queryRunner.query(`ALTER TABLE \`rule_change_logs\` DROP COLUMN \`active\``);
        await queryRunner.query(`ALTER TABLE \`rule_change_logs\` DROP COLUMN \`update_date\``);
        await queryRunner.query(`ALTER TABLE \`rule_change_logs\` DROP COLUMN \`creation_date\``);
        await queryRunner.query(`ALTER TABLE \`rule_change_logs\` DROP COLUMN \`usr_update\``);
        await queryRunner.query(`ALTER TABLE \`rule_change_logs\` DROP COLUMN \`usr_create\``);
        await queryRunner.query(`ALTER TABLE \`rule_sets\` ADD \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)`);
        await queryRunner.query(`ALTER TABLE \`rule_sets\` ADD \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)`);
        await queryRunner.query(`ALTER TABLE \`norm_rules\` ADD \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)`);
        await queryRunner.query(`ALTER TABLE \`rule_change_logs\` ADD \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)`);
        await queryRunner.query(`CREATE INDEX \`IDX_cfdaecb0ba714306de46151d9e\` ON \`rule_change_logs\` (\`actor\`, \`createdAt\`)`);
    }

}
