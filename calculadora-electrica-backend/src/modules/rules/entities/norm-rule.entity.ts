import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { RuleSet } from './rule-set.entity';
import { BaseAuditEntity } from '../../../common/entities/base-audit.entity';

@Entity({ name: 'norm_rules' })
@Index(['ruleSetId', 'code'], { unique: true })
export class NormRule extends BaseAuditEntity {
  @Column('uuid', { nullable: true })
  ruleSetId?: string;

  @ManyToOne(() => RuleSet, ruleSet => ruleSet.rules, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ruleSetId' })
  ruleSet?: RuleSet;

  @Column({ length: 100 })
  code: string;

  @Column()
  description: string;

  @Column('decimal', { precision: 12, scale: 3 })
  numericValue: string;

  @Column()
  unit: string;

  @Column()
  category: string;

  @Column({ nullable: true })
  source?: string;

  @Column({ default: true })
  isDefault: boolean;
}
