import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('normativas_ampacidad')
@Index(['calibre_awg', 'material'])
export class NormativaAmpacidad {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ type: 'varchar', length: 10, nullable: false })
  calibre_awg: string; // 14, 12, 10, 8, 6, etc.

  @Column({ type: 'varchar', length: 20, nullable: false })
  material: string; // Cu, Al

  @Column({ type: 'int', nullable: false })
  capacidad_a: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  tipo_aislamiento?: string; // THHN, THW, XHHW, etc.

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  temperatura_ambiente?: number; // Temperatura de referencia (30°C por defecto)

  @Column({ type: 'varchar', length: 100, nullable: true })
  descripcion?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  normativa?: string; // NEC 2020, RIE RD, etc.

  @Column({ type: 'varchar', length: 20, nullable: true })
  tabla_referencia?: string; // Tabla 310.16(B)(16), etc.

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @UpdateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updated_at: Date;
}
