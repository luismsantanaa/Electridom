import { Entity, Column, PrimaryGeneratedColumn, Index } from 'typeorm';
import { BaseAuditEntity } from '../../../common/entities/base-audit.entity';

@Entity('demand_factor')
@Index('IDX_DEMAND_FACTOR_CATEGORY', ['category', 'active'])
@Index('IDX_DEMAND_FACTOR_RANGE', ['category', 'rangeMin', 'rangeMax'])
export class DemandFactor extends BaseAuditEntity {
  @PrimaryGeneratedColumn('uuid')
  declare id: string;

  @Column({
    type: 'varchar',
    length: 100,
    comment: 'Categoría de carga (lighting_general, tomas_generales, etc.)',
  })
  category: string;

  @Column({
    name: 'range_min',
    type: 'decimal',
    precision: 10,
    scale: 2,
    comment: 'Rango mínimo de carga en VA',
  })
  rangeMin: number;

  @Column({
    name: 'range_max',
    type: 'decimal',
    precision: 10,
    scale: 2,
    comment: 'Rango máximo de carga en VA',
  })
  rangeMax: number;

  @Column({
    type: 'decimal',
    precision: 5,
    scale: 4,
    comment: 'Factor de demanda a aplicar (0.0 - 1.0)',
  })
  factor: number;

  @Column({
    type: 'text',
    nullable: true,
    comment: 'Notas y observaciones del factor de demanda',
  })
  notes?: string;
}
