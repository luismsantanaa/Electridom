import {
  Entity,
  Column,
} from 'typeorm';
import { BaseAuditEntity } from '../../../common/entities/base-audit.entity';

@Entity('tipos_ambientes')
export class TipoAmbiente extends BaseAuditEntity {
  // id ya viene de BaseAuditEntity

  @Column({ length: 100 })
  nombre: string;

  @Column({ length: 255, nullable: true })
  descripcion: string;

  // Los campos de auditoría ya vienen de BaseAuditEntity:
  // - active
  // - creationDate
  // - updateDate
  // - usrCreate
  // - usrUpdate
}
