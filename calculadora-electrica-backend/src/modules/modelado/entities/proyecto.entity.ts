import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { Ambiente } from './ambiente.entity';
import { Circuito } from './circuito.entity';

@Entity('proyectos')
@Index(['nombre'])
export class Proyecto {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ type: 'varchar', length: 150, nullable: false })
  nombre: string;

  @Column({ type: 'text', nullable: true })
  descripcion?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  tipo_instalacion?: string; // residencial, comercial, industrial

  @Column({ type: 'varchar', length: 50, nullable: true })
  tension_sistema?: string; // 120V, 208V, 480V, etc.

  @Column({ type: 'int', nullable: true })
  fases?: number; // 1, 3

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  factor_potencia?: number;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @UpdateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updated_at: Date;

  // Relaciones
  @OneToMany(() => Ambiente, (ambiente) => ambiente.proyecto, { cascade: true })
  ambientes: Ambiente[];

  @OneToMany(() => Circuito, (circuito) => circuito.proyecto, { cascade: true })
  circuitos: Circuito[];
}
