import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { BaseAuditEntity } from '../../../common/entities/base-audit.entity';

export enum JwksKeyType {
  RSA = 'RSA',
}

@Entity('jwks_keys')
@Index(['kid'], { unique: true })
@Index(['isActive'], { where: '"isActive" = true' })
export class JwksKey extends BaseAuditEntity {

  @Column({ type: 'varchar', length: 255, unique: true })
  kid: string;

  @Column({ type: 'enum', enum: JwksKeyType, default: JwksKeyType.RSA })
  type: JwksKeyType;

  @Column({ type: 'text' })
  publicPem: string;

  @Column({ type: 'text', nullable: true })
  privatePem: string;

  @Column({ type: 'boolean', default: false })
  isActive: boolean;

  @Column({ type: 'timestamp', nullable: true })
  rotatedAt: Date;
}
