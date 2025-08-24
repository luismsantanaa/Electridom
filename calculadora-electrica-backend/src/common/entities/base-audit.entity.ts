import {
  CreateDateColumn,
  UpdateDateColumn,
  Column,
  PrimaryGeneratedColumn,
} from 'typeorm';

export abstract class BaseAuditEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'usr_create', length: 100, nullable: true })
  usrCreate?: string;

  @Column({ name: 'usr_update', length: 100, nullable: true })
  usrUpdate?: string;

  @CreateDateColumn({ name: 'creation_date', type: 'datetime' })
  creationDate: Date;

  @UpdateDateColumn({ name: 'update_date', type: 'datetime' })
  updateDate: Date;

  @Column({ name: 'active', type: 'boolean', default: true })
  active: boolean;
}
