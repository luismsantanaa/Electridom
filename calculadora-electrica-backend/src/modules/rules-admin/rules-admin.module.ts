import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RulesAdminController, RulesResolverController } from './controllers/rules-admin.controller';
import { RulesAdminService } from './services/rules-admin.service';
import { RuleSet } from '../rules/entities/rule-set.entity';
import { NormRule } from '../rules/entities/norm-rule.entity';
import { RuleChangeLog } from '../rules/entities/rule-change-log.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([RuleSet, NormRule, RuleChangeLog]),
  ],
  controllers: [RulesAdminController, RulesResolverController],
  providers: [RulesAdminService],
  exports: [RulesAdminService],
})
export class RulesAdminModule {}
