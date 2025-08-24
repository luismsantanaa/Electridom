import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { BaseAuditEntity } from '../../../common/entities/base-audit.entity';
import { TipoArtefacto } from '../../tipos-artefactos/entities/tipo-artefacto.entity';

@Entity('cargas')
export class Cargas extends BaseAuditEntity {
  // id ya viene de BaseAuditEntity

  @Column({ length: 100 })
  nombre: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  potencia: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  voltaje: number;

  @ManyToOne(() => TipoArtefacto, { eager: true })
  @JoinColumn({ name: 'tipo_artefacto_id' })
  tipoArtefacto: TipoArtefacto;

  // Los campos de auditoría ya vienen de BaseAuditEntity:
  // - active
  // - creationDate
  // - updateDate
  // - usrCreate
  // - usrUpdate
}
