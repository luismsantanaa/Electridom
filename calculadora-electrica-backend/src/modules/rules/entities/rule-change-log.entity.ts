import {
  Entity,
  Column,
  Index,
} from 'typeorm';
import { BaseAuditEntity } from '../../../common/entities/base-audit.entity';

export type ChangeType = 'CREATE' | 'UPDATE' | 'DELETE';

@Entity({ name: 'rule_change_logs' })
@Index(['ruleSetId', 'ruleCode'])
@Index(['actor', 'creationDate'])
export class RuleChangeLog extends BaseAuditEntity {
  @Column('uuid')
  ruleSetId: string;

  @Column({ length: 100 })
  ruleCode: string;

  @Column({ type: 'varchar', length: 16 })
  changeType: ChangeType;

  @Column({ length: 100 })
  actor: string;

  @Column('json', { nullable: true })
  beforeValue?: any;

  @Column('json', { nullable: true })
  afterValue?: any;
}
