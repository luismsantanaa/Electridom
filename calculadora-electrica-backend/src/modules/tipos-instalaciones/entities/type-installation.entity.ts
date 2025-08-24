import {
  Entity,
  Column,
} from 'typeorm';
import { BaseAuditEntity } from '../../../common/entities/base-audit.entity';

@Entity('tipos_instalaciones')
export class TipoInstalacion extends BaseAuditEntity {
  // id ya viene de BaseAuditEntity

  @Column({ length: 100 })
  name: string;

  @Column({ length: 255, nullable: true })
  description: string;

  // Los campos de auditoría ya vienen de BaseAuditEntity:
  // - active (antes activo)
  // - creationDate (antes fechaCreacion)
  // - updateDate (antes fechaActualizacion)
  // - usrCreate (antes creadoPor)
  // - usrUpdate (antes actualizadoPor)
}

