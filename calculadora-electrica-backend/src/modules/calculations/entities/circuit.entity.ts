import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Protection } from './protection.entity';

@Entity('circuit')
export class Circuit {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'projectId', type: 'int', nullable: false })
  projectId: number;

  @Column({ name: 'loadVA', type: 'int', nullable: false })
  loadVA: number;

  @Column({ name: 'conductorGauge', type: 'varchar', length: 20, nullable: false })
  conductorGauge: string; // 1.5 mm2, 2.0 mm2, etc.

  @Column({ name: 'areaType', type: 'varchar', length: 50, nullable: false })
  areaType: string; // banio, cocina, lavanderia, exteriores, dormitorio, estudio, sala

  @Column({ name: 'phase', type: 'int', nullable: false, default: 1 })
  phase: number; // 1, 2, 3

  @Column({ name: 'voltage', type: 'int', nullable: false, default: 120 })
  voltage: number; // 120V, 240V

  @Column({ name: 'currentA', type: 'decimal', precision: 10, scale: 2, nullable: false })
  currentA: number; // Corriente calculada

  @Column({ name: 'notes', type: 'varchar', length: 255, nullable: true })
  notes: string;

  @CreateDateColumn({ name: 'createdAt', type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt', type: 'datetime' })
  updatedAt: Date;

  // Relaciones
  @OneToMany(() => Protection, protection => protection.circuit)
  protections: Protection[];
}
