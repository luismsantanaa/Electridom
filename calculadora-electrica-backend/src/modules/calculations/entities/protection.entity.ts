import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Circuit } from './circuit.entity';

export enum BreakerType {
  MCB = 'MCB',
  MCCB = 'MCCB',
  GFCI = 'GFCI',
  AFCI = 'AFCI'
}

export enum DifferentialType {
  NONE = 'NONE',
  GFCI = 'GFCI',
  AFCI = 'AFCI'
}

@Entity('protection')
export class Protection {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'circuitId', type: 'int', nullable: false })
  circuitId: number;

  @Column({ name: 'breakerAmp', type: 'int', nullable: false })
  breakerAmp: number;

  @Column({ 
    name: 'breakerType', 
    type: 'varchar', 
    length: 16, 
    nullable: false, 
    default: BreakerType.MCB 
  })
  breakerType: BreakerType;

  @Column({ 
    name: 'differentialType', 
    type: 'varchar', 
    length: 8, 
    nullable: false, 
    default: DifferentialType.NONE 
  })
  differentialType: DifferentialType;

  @Column({ name: 'notes', type: 'varchar', length: 255, nullable: true })
  notes: string;

  @CreateDateColumn({ name: 'createdAt', type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt', type: 'datetime' })
  updatedAt: Date;

  // Relaciones
  @ManyToOne(() => Circuit, circuit => circuit.protections)
  @JoinColumn({ name: 'circuitId' })
  circuit: Circuit;
}
