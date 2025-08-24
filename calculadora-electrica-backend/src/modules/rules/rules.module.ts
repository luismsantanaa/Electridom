import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NormRule } from './entities/norm-rule.entity';
import { RuleSet } from './entities/rule-set.entity';
import { RuleChangeLog } from './entities/rule-change-log.entity';
import { RulesService } from './rules.service';
import { RuleProviderService } from './rule-provider.service';
import { RuleSignatureService } from './services/rule-signature.service';
import { RulesAdminModule } from '../rules-admin/rules-admin.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([NormRule, RuleSet, RuleChangeLog]),
    RulesAdminModule,
  ],
  providers: [RulesService, RuleProviderService, RuleSignatureService],
  exports: [RulesService, RuleProviderService, RuleSignatureService],
})
export class RulesModule {}
