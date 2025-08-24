import { DataSource } from 'typeorm';
import { NormRule } from '../../modules/rules/entities/norm-rule.entity';
import { normRulesSeed } from '../../modules/rules/seeds/norm-rules.seed';

export async function seedNormRules(dataSource: DataSource): Promise<void> {
  const normRuleRepository = dataSource.getRepository(NormRule);

  // Verificar si ya existen rules
  const existingRules = await normRuleRepository.count();
  if (existingRules > 0) {
    console.log('Las rules normativas ya están sembradas. Saltando...');
    return;
  }

  console.log('Sembrando rules normativas...');

  for (const ruleData of normRulesSeed) {
    const rule = normRuleRepository.create(ruleData);
    await normRuleRepository.save(rule);
    console.log(`rule sembrada: ${rule.code}`);
  }

  console.log(
    `✅ ${normRulesSeed.length} rules normativas sembradas exitosamente`,
  );
}

