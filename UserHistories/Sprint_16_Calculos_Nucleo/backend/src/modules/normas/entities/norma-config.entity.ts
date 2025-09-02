import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'normas_config' })
export class NormaConfig {
  @PrimaryGeneratedColumn('increment')
  id!: number;

  @Column({ type: 'varchar', unique: true })
  key!: string;

  @Column({ type: 'json' })
  data!: Record<string, any>;
}
