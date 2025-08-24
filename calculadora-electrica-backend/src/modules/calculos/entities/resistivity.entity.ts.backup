import { Entity, Column, PrimaryGeneratedColumn, Index } from 'typeorm';
import { BaseAuditEntity } from '../../../common/entities/base-audit.entity';

@Entity('resistivity')
@Index('IDX_RESISTIVITY_MATERIAL_SECTION', ['material', 'seccionMm2', 'active'])
@Index('IDX_RESISTIVITY_SECTION', ['seccionMm2', 'active'])
export class Resistivity extends BaseAuditEntity {
  @PrimaryGeneratedColumn('uuid')
  declare id: string;

  @Column({
    type: 'varchar',
    length: 10,
    comment: 'Material del conductor (Cu, Al)',
  })
  material: string;

  @Column({
    name: 'seccion_mm2',
    type: 'decimal',
    precision: 8,
    scale: 3,
    comment: 'Sección transversal en mm²',
  })
  seccionMm2: number;

  @Column({
    name: 'ohm_km',
    type: 'decimal',
    precision: 10,
    scale: 6,
    comment: 'Resistencia en Ohm por kilómetro',
  })
  ohmKm: number;

  @Column({
    type: 'text',
    nullable: true,
    comment: 'Notas y observaciones de la resistividad',
  })
  notes?: string;
}
