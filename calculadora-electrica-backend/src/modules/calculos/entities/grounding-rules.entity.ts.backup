import { Entity, Column, PrimaryGeneratedColumn, Index } from 'typeorm';
import { BaseAuditEntity } from '../../../common/entities/base-audit.entity';

@Entity('grounding_rules')
@Index('IDX_GROUNDING_RULES_BREAKER_AMP', ['mainBreakerAmp', 'active'])
export class GroundingRules extends BaseAuditEntity {
  @PrimaryGeneratedColumn('uuid')
  declare id: string;

  @Column({
    name: 'main_breaker_amp',
    type: 'int',
    comment: 'Amperaje del breaker principal',
  })
  mainBreakerAmp: number;

  @Column({
    name: 'egc_mm2',
    type: 'decimal',
    precision: 8,
    scale: 3,
    comment: 'Conductor de protección (EGC) en mm²',
  })
  egcMm2: number;

  @Column({
    name: 'gec_mm2',
    type: 'decimal',
    precision: 8,
    scale: 3,
    comment: 'Conductor de tierra (GEC) en mm²',
  })
  gecMm2: number;

  @Column({
    type: 'text',
    nullable: true,
    comment: 'Notas y observaciones de la regla',
  })
  notes?: string;
}
