import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseAuditEntity } from '../../../common/entities/base-audit.entity';
import { EnvironmentType } from '../../environment-types/entities/environment-type.entity';

@Entity('environment')
export class Environment extends BaseAuditEntity {
  // id ya viene de BaseAuditEntity

  @Column({ length: 100 })
  name: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  area: number;

  @ManyToOne(() => EnvironmentType, { eager: true })
  @JoinColumn({ name: 'tipo_ambiente_id' })
  environmentType: EnvironmentType;

  // Los campos de auditoría ya vienen de BaseAuditEntity:
  // - active
  // - creationDate
  // - updateDate
  // - usrCreate
  // - usrUpdate
}
