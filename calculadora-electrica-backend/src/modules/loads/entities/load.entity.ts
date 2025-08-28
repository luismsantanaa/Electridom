import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseAuditEntity } from '../../../common/entities/base-audit.entity';
import { ArtifactType } from '../../artifact-types/entities/artifact-type.entity';

@Entity('loads')
export class Load extends BaseAuditEntity {
  // id ya viene de BaseAuditEntity

  @Column({ length: 100 })
  name: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  power: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  voltage: number;

  @ManyToOne(() => ArtifactType, { eager: true })
  @JoinColumn({ name: 'tipo_artefacto_id' })
  artifactType: ArtifactType;

  // Los campos de auditoría ya vienen de BaseAuditEntity:
  // - active
  // - creationDate
  // - updateDate
  // - usrCreate
  // - usrUpdate
}
