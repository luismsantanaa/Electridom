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

@Entity('conductores')
@Index(['circuito_id'])
export class Conductor {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ type: 'bigint', nullable: false })
  circuito_id: number;

  @Column({ type: 'varchar', length: 10, nullable: false })
  calibre_awg: string; // 14, 12, 10, 8, 6, etc.

  @Column({ type: 'varchar', length: 20, nullable: false, default: 'Cu' })
  material: string; // Cu, Al

  @Column({ type: 'int', nullable: false })
  capacidad_a: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  tipo_aislamiento?: string; // THHN, THW, XHHW, etc.

  @Column({ type: 'varchar', length: 50, nullable: true })
  marca?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  descripcion?: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  longitud_m?: number; // Longitud del conductor en metros

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  resistencia_ohm_km?: number; // Resistencia por kilómetro

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  caida_tension?: number; // Caída de tensión calculada

  @Column({ type: 'varchar', length: 20, nullable: true })
  color?: string; // Color del conductor

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updated_at: Date;

  // Relaciones
  @ManyToOne(() => Circuito, (circuito) => circuito.conductores, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'circuito_id' })
  circuito: Circuito;
}
