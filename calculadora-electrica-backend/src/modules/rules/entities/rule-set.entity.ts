import { Entity, Column, OneToMany, Index } from 'typeorm';
import { NormRule } from './norm-rule.entity';
import { BaseAuditEntity } from '../../../common/entities/base-audit.entity';

export type RuleSetStatus = 'DRAFT' | 'ACTIVE' | 'RETIRED';

@Entity({ name: 'rule_sets' })
@Index(['status', 'effectiveFrom'])
@Index(['effectiveFrom', 'effectiveTo'])
export class RuleSet extends BaseAuditEntity {
  @Column({ length: 200 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'varchar', length: 16, default: 'DRAFT' })
  status: RuleSetStatus;

  @Column({ type: 'datetime', nullable: true })
  effectiveFrom?: Date;

  @Column({ type: 'datetime', nullable: true })
  effectiveTo?: Date;

  @OneToMany(() => NormRule, rule => rule.ruleSet)
  rules: NormRule[];
}
