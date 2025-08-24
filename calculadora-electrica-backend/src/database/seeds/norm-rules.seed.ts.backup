import { DataSource } from 'typeorm';
import { NormRule } from '../../modules/rules/entities/norm-rule.entity';
import { normRulesSeed } from '../../modules/rules/seeds/norm-rules.seed';

export async function seedNormRules(dataSource: DataSource): Promise<void> {
  const normRuleRepository = dataSource.getRepository(NormRule);

  // Verificar si ya existen reglas
  const existingRules = await normRuleRepository.count();
  if (existingRules > 0) {
    console.log('Las reglas normativas ya están sembradas. Saltando...');
    return;
  }

  console.log('Sembrando reglas normativas...');

  for (const ruleData of normRulesSeed) {
    const rule = normRuleRepository.create(ruleData);
    await normRuleRepository.save(rule);
    console.log(`Regla sembrada: ${rule.code}`);
  }

  console.log(
    `✅ ${normRulesSeed.length} reglas normativas sembradas exitosamente`,
  );
}
