import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NormRule } from './entities/norm-rule.entity';

@Injectable()
export class RulesService {
  constructor(
    @InjectRepository(NormRule)
    private readonly normRuleRepository: Repository<NormRule>,
  ) {}

  async findByCode(code: string): Promise<NormRule | null> {
    // Buscar reglas sin RuleSet (legacy) primero
    const legacyRule = await this.normRuleRepository
      .createQueryBuilder('rule')
      .where('rule.code = :code', { code })
      .andWhere('rule.ruleSetId IS NULL')
      .getOne();
    
    if (legacyRule) {
      return legacyRule;
    }
    
    // Si no hay regla legacy, buscar en RuleSets activos
    const activeRule = await this.normRuleRepository
      .createQueryBuilder('rule')
      .leftJoin('rule.ruleSet', 'ruleSet')
      .where('rule.code = :code', { code })
      .andWhere('ruleSet.status = :status', { status: 'ACTIVE' })
      .orderBy('ruleSet.effectiveFrom', 'DESC')
      .getOne();
    
    return activeRule;
  }

  async findAll(): Promise<NormRule[]> {
    return this.normRuleRepository.find();
  }

  async create(rule: Partial<NormRule>): Promise<NormRule> {
    const newRule = this.normRuleRepository.create(rule);
    return this.normRuleRepository.save(newRule);
  }

  async update(id: string, rule: Partial<NormRule>): Promise<NormRule | null> {
    await this.normRuleRepository.update(id, rule);
    return this.normRuleRepository.findOne({ where: { id } });
  }

  async delete(id: string): Promise<void> {
    await this.normRuleRepository.delete(id);
  }

  async count(): Promise<number> {
    return this.normRuleRepository.count();
  }
}
