import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Ambiente } from './ambiente.entity';

@Entity('cargas')
@Index(['ambiente_id', 'tipo'])
export class Carga {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ type: 'bigint', nullable: false })
  ambiente_id: number;

  @Column({ type: 'varchar', length: 120, nullable: false })
  nombre: string;

  @Column({ type: 'int', nullable: false })
  potencia_w: number;

  @Column({ type: 'varchar', length: 20, nullable: false })
  tipo: string; // IUG, TUG, IUE, TUE

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  factor_uso?: number; // Factor de uso de la carga

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  factor_demanda?: number; // Factor de demanda

  @Column({ type: 'varchar', length: 100, nullable: true })
  descripcion?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  marca?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  modelo?: string;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updated_at: Date;

  // Relaciones
  @ManyToOne(() => Ambiente, (ambiente) => ambiente.cargas, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ambiente_id' })
  ambiente: Ambiente;
}
