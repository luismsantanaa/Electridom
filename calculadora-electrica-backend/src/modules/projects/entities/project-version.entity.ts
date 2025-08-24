import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseAuditEntity } from '../../../common/entities/base-audit.entity';
import { Project } from './project.entity';

@Entity({ name: 'project_versions' })
@Index(['project', 'versionNumber'], { unique: true })
export class ProjectVersion extends BaseAuditEntity {
  // id ya viene de BaseAuditEntity

  @Column({ type: 'int' })
  versionNumber: number;

  @ManyToOne(() => Project, (project) => project.versions)
  @JoinColumn({ name: 'project_id' })
  project: Project;

  // Snapshot de entradas
  @Column('json')
  inputSuperficies: any;
  
  @Column('json')
  inputConsumos: any;
  
  @Column('json', { nullable: true })
  inputOpciones?: any;

  // Snapshot de salidas
  @Column('json')
  outputCargasPorAmbiente: any;
  
  @Column('json')
  outputTotales: any;
  
  @Column('json')
  outputPropuestaCircuitos: any;
  
  @Column('json', { default: '[]' })
  outputWarnings: any;

  // Auditoría de reglas
  @Column({ length: 200 })
  rulesSignature: string;

  // Nota opcional del usuario
  @Column({ type: 'varchar', length: 240, nullable: true })
  note?: string;

  // Los campos de auditoría ya vienen de BaseAuditEntity:
  // - active
  // - creationDate
  // - updateDate
  // - usrCreate
  // - usrUpdate
}
