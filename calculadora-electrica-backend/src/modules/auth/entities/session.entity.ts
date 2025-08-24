import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseAuditEntity } from '../../../common/entities/base-audit.entity';
import { User } from '../../users/entities/user.entity';

export enum SessionStatus {
  ACTIVE = 'active',
  REVOKED = 'revoked',
  EXPIRED = 'expired',
  ROTATED = 'rotated',
}

@Entity('sessions')
@Index(['userId'])
@Index(['refreshHash'], { unique: true })
@Index(['expiresAt'])
@Index(['revokedAt'])
@Index(['rotatedFrom'])
@Index(['rotatedTo'])
export class Session extends BaseAuditEntity {
  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'varchar', length: 128, unique: true })
  refreshHash: string;

  @Column({ type: 'text' })
  userAgent: string;

  @Column({ type: 'varchar', length: 64 })
  ip: string;

  @Column({ type: 'datetime' })
  expiresAt: Date;

  @Column({ type: 'datetime', nullable: true })
  revokedAt: Date | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  jti: string; // JWT ID para tracking

  @Column({ type: 'uuid', nullable: true })
  rotatedFrom: string | null; // ID de la sesión anterior que fue rotada

  @Column({ type: 'uuid', nullable: true })
  rotatedTo: string | null; // ID de la nueva sesión a la que se rotó

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  // Método para obtener el estado de la sesión
  getStatus(): SessionStatus {
    if (this.revokedAt) {
      return this.rotatedTo ? SessionStatus.ROTATED : SessionStatus.REVOKED;
    }
    if (this.expiresAt < new Date()) {
      return SessionStatus.EXPIRED;
    }
    return SessionStatus.ACTIVE;
  }

  // Método para verificar si la sesión está activa
  isActive(): boolean {
    return this.getStatus() === SessionStatus.ACTIVE;
  }
}
