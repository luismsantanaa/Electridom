import { Entity, Column, PrimaryGeneratedColumn, Index } from 'typeorm';
import { BaseAuditEntity } from '../../../common/entities/base-audit.entity';

@Entity('breaker_curve')
@Index('IDX_BREAKER_CURVE_AMP_POLES', ['amp', 'poles', 'active'])
@Index('IDX_BREAKER_CURVE_USE_CASE', ['useCase', 'active'])
@Index('IDX_BREAKER_CURVE_CURVE', ['curve', 'active'])
export class BreakerCurve extends BaseAuditEntity {
  @PrimaryGeneratedColumn('uuid')
  declare id: string;

  @Column({
    type: 'decimal',
    precision: 8,
    scale: 2,
    comment: 'Capacidad nominal del breaker en amperios',
  })
  amp: number;

  @Column({
    type: 'int',
    comment: 'Número de polos (1=monofásico, 2=bifásico, 3=trifásico)',
  })
  poles: number;

  @Column({
    type: 'varchar',
    length: 5,
    comment: 'Curva de disparo (B, C, D)',
  })
  curve: string;

  @Column({
    name: 'use_case',
    type: 'varchar',
    length: 50,
    comment: 'Caso de uso típico (iluminacion, tomas generales, etc.)',
  })
  useCase: string;

  @Column({
    type: 'text',
    nullable: true,
    comment: 'Notas adicionales del breaker',
  })
  notes?: string;
}
