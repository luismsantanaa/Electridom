import { Entity, Column, PrimaryGeneratedColumn, Index } from 'typeorm';
import { BaseAuditEntity } from '../../../common/entities/base-audit.entity';

@Entity('ampacity')
@Index('IDX_AMPACITY_MATERIAL_INSULATION', [
  'material',
  'insulation',
  'tempC',
  'active',
])
@Index('IDX_AMPACITY_AWG', ['calibreAwg', 'active'])
@Index('IDX_AMPACITY_AMP', ['amp', 'active'])
export class Ampacity extends BaseAuditEntity {
  @PrimaryGeneratedColumn('uuid')
  declare id: string;

  @Column({
    type: 'varchar',
    length: 10,
    comment: 'Material del conductor (Cu, Al)',
  })
  material: string;

  @Column({
    type: 'varchar',
    length: 20,
    comment: 'Tipo de aislación (THHN, THWN, etc.)',
  })
  insulation: string;

  @Column({
    name: 'temp_c',
    type: 'int',
    comment: 'Temperatura de operación en Celsius',
  })
  tempC: number;

  @Column({
    name: 'calibre_awg',
    type: 'int',
    comment: 'Calibre en AWG',
  })
  calibreAwg: number;

  @Column({
    name: 'seccion_mm2',
    type: 'decimal',
    precision: 8,
    scale: 3,
    comment: 'Sección transversal en mm²',
  })
  seccionMm2: number;

  @Column({
    type: 'decimal',
    precision: 8,
    scale: 2,
    comment: 'Capacidad de corriente en amperios',
  })
  amp: number;
}
