import {
  Entity,
  Column,
  OneToMany,
} from 'typeorm';
import { BaseAuditEntity } from '../../../common/entities/base-audit.entity';
import { EnvironmentType } from '../../environment-types/entities/environment-type.entity';

@Entity('tipos_instalaciones')
export class InstallationType extends BaseAuditEntity {
  // id ya viene de BaseAuditEntity

  @Column({ length: 100 })
  name: string;

  @Column({ length: 255, nullable: true })
  description: string;

  // Relación con EnvironmentType
  @OneToMany(() => EnvironmentType, environmentType => environmentType.installationType)
  environmentTypes: EnvironmentType[];

  // Los campos de auditoría ya vienen de BaseAuditEntity:
  // - active (antes activo)
  // - creationDate (antes fechaCreacion)
  // - updateDate (antes fechaActualizacion)
  // - usrCreate (antes creadoPor)
  // - usrUpdate (antes actualizadoPor)
}

