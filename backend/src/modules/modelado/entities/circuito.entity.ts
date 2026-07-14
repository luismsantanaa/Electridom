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
import { Ambiente } from './ambiente.entity';
import { Proteccion } from './proteccion.entity';
import { Conductor } from './conductor.entity';

@Entity('circuitos')
@Index(['proyecto_id', 'ambiente_id', 'tipo'])
export class Circuito {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ type: 'bigint', nullable: false })
  proyecto_id: number;

  @Column({ type: 'bigint', nullable: false })
  ambiente_id: number;

  @Column({ type: 'varchar', length: 20, nullable: false })
  tipo: string; // IUG, TUG, IUE, TUE

  @Column({ type: 'int', nullable: false })
  potencia_va: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: false })
  corriente_a: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  observaciones?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  nombre?: string; // Nombre del circuito

  @Column({ type: 'int', nullable: true })
  numero_circuito?: number; // Número secuencial del circuito

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  factor_potencia?: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  longitud_m?: number; // Longitud del circuito en metros

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updated_at: Date;

  // Relaciones
  @ManyToOne(() => Proyecto, (proyecto) => proyecto.circuitos, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'proyecto_id' })
  proyecto: Proyecto;

  @ManyToOne(() => Ambiente, (ambiente) => ambiente.circuitos, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ambiente_id' })
  ambiente: Ambiente;

  @OneToMany(() => Proteccion, (proteccion) => proteccion.circuito, { cascade: true })
  protecciones: Proteccion[];

  @OneToMany(() => Conductor, (conductor) => conductor.circuito, { cascade: true })
  conductores: Conductor[];
}
