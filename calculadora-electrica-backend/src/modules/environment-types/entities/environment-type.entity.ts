import {
  Entity,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { BaseAuditEntity } from '../../../common/entities/base-audit.entity';
import { InstallationType } from '../../installation-types/entities/installation-type.entity';
import { ArtifactType } from '../../artifact-types/entities/artifact-type.entity';

@Entity('tipos_ambientes')
export class EnvironmentType extends BaseAuditEntity {
  // id ya viene de BaseAuditEntity

  @Column({ length: 100 })
  name: string;

  @Column({ length: 255, nullable: true })
  description: string;

  // Relación con InstallationType
  @ManyToOne(() => InstallationType, installationType => installationType.environmentTypes)
  @JoinColumn({ name: 'installation_type_id' })
  installationType: InstallationType;

  @Column({ type: 'uuid', nullable: true })
  installationTypeId: string;

  // Relación con ArtifactType
  @OneToMany(() => ArtifactType, artifactType => artifactType.environmentType)
  artifactTypes: ArtifactType[];

  // Los campos de auditoría ya vienen de BaseAuditEntity:
  // - active
  // - creationDate
  // - updateDate
  // - usrCreate
  // - usrUpdate
}

