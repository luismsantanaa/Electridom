import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseAuditEntity } from '../../../common/entities/base-audit.entity';
import { TipoAmbiente } from '../../tipos-ambientes/entities/tipo-ambiente.entity';

@Entity('ambiente')
export class Ambiente extends BaseAuditEntity {
  // id ya viene de BaseAuditEntity

  @Column({ length: 100 })
  nombre: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  area: number;

  @ManyToOne(() => TipoAmbiente, { eager: true })
  @JoinColumn({ name: 'tipo_ambiente_id' })
  tipoAmbiente: TipoAmbiente;

  // Los campos de auditoría ya vienen de BaseAuditEntity:
  // - active
  // - creationDate
  // - updateDate
  // - usrCreate
  // - usrUpdate
}
