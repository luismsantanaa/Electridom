import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { Proyecto } from './proyecto.entity';
import { Carga } from './carga.entity';
import { Circuito } from './circuito.entity';

@Entity('ambientes')
@Index(['proyecto_id', 'nombre'])
export class Ambiente {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ type: 'bigint', nullable: false })
  proyecto_id: number;

  @Column({ type: 'varchar', length: 120, nullable: false })
  nombre: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  superficie_m2: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  nivel?: string; // Planta baja, primer piso, etc.

  @Column({ type: 'varchar', length: 50, nullable: true })
  tipo?: string; // sala, cocina, dormitorio, etc.

  @Column({ type: 'varchar', length: 100, nullable: true })
  descripcion?: string;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updated_at: Date;

  // Relaciones
  @ManyToOne(() => Proyecto, (proyecto) => proyecto.ambientes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'proyecto_id' })
  proyecto: Proyecto;

  @OneToMany(() => Carga, (carga) => carga.ambiente, { cascade: true })
  cargas: Carga[];

  @OneToMany(() => Circuito, (circuito) => circuito.ambiente, { cascade: true })
  circuitos: Circuito[];
}
