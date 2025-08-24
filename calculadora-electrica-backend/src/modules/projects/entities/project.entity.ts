import { Entity, Column, OneToMany } from 'typeorm';
import { BaseAuditEntity } from '../../../common/entities/base-audit.entity';
import { ProjectVersion } from './project-version.entity';

export type ProjectStatus = 'ACTIVE' | 'ARCHIVED';

@Entity({ name: 'projects' })
export class Project extends BaseAuditEntity {
  // id ya viene de BaseAuditEntity

  @Column({ length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 16, default: 'ACTIVE' })
  status: ProjectStatus;

  @OneToMany(() => ProjectVersion, (version) => version.project)
  versions: ProjectVersion[];

  // Los campos de auditoría ya vienen de BaseAuditEntity:
  // - active
  // - creationDate
  // - updateDate
  // - usrCreate
  // - usrUpdate
}
