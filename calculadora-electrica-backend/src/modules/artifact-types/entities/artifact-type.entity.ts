import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { BaseAuditEntity } from '../../../common/entities/base-audit.entity';
import { EnvironmentType } from '../../environment-types/entities/environment-type.entity';

@Entity('tipos_artefactos')
export class ArtifactType extends BaseAuditEntity {
  // id ya viene de BaseAuditEntity

  @Column({ length: 100 })
  name: string;

  @Column({ length: 255, nullable: true })
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  power: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  voltage: number;

  // Relación con EnvironmentType
  @ManyToOne(() => EnvironmentType, environmentType => environmentType.artifactTypes)
  @JoinColumn({ name: 'environment_type_id' })
  environmentType: EnvironmentType;

  @Column({ type: 'uuid', nullable: true })
  environmentTypeId: string;

  // Los campos de auditoría ya vienen de BaseAuditEntity:
  // - active
  // - creationDate
  // - updateDate
  // - usrCreate
  // - usrUpdate
}
