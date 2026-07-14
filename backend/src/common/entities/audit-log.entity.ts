import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { AuditAction } from '../types/audit.types';

@Entity({ name: 'audit_logs' })
@Index(['userId', 'createdAt'])
@Index(['action', 'createdAt'])
@Index(['traceId'])
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true })
  userId?: string;

  @Column({ type: 'varchar', length: 64 })
  action: AuditAction;

  @Column({ type: 'varchar', length: 64, nullable: true })
  ip?: string;

  @Column({ type: 'varchar', length: 256, nullable: true })
  userAgent?: string;

  @Column({ type: 'text', nullable: true })
  detail?: string;

  @Column({ type: 'varchar', length: 64, nullable: true })
  traceId?: string;

  @CreateDateColumn()
  createdAt: Date;
}
