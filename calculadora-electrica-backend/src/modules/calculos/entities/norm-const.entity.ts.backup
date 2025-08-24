import { Entity, Column, Index } from 'typeorm';
import { BaseAuditEntity } from '../../../common/entities/base-audit.entity';

@Entity('norm_const')
@Index('IDX_NORM_CONST_KEY', ['key'], { unique: true })
export class NormConst extends BaseAuditEntity {

  @Column({
    type: 'varchar',
    length: 100,
    unique: true,
    comment: 'Clave del parámetro normativo',
  })
  key: string;

  @Column({ type: 'varchar', length: 255, comment: 'Valor del parámetro' })
  value: string;

  @Column({ type: 'varchar', length: 50, comment: 'Unidad de medida' })
  unit: string;

  @Column({
    type: 'text',
    nullable: true,
    comment: 'Notas y observaciones del parámetro',
  })
  notes?: string;
}
