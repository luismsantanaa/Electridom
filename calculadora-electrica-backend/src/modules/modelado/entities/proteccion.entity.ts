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
import { Circuito } from './circuito.entity';

@Entity('protecciones')
@Index(['circuito_id'])
export class Proteccion {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ type: 'bigint', nullable: false })
  circuito_id: number;

  @Column({ type: 'varchar', length: 30, nullable: false })
  tipo: string; // MCB, MCB-Térmico, Fusible, etc.

  @Column({ type: 'int', nullable: false })
  capacidad_a: number;

  @Column({ type: 'varchar', length: 5, nullable: true })
  curva?: string; // B, C, D, K, Z

  @Column({ type: 'varchar', length: 50, nullable: true })
  marca?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  modelo?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  descripcion?: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  tension_nominal?: number; // Tensión nominal del breaker

  @Column({ type: 'int', nullable: true })
  polos?: number; // 1, 2, 3 polos

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updated_at: Date;

  // Relaciones
  @ManyToOne(() => Circuito, (circuito) => circuito.protecciones, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'circuito_id' })
  circuito: Circuito;
}
