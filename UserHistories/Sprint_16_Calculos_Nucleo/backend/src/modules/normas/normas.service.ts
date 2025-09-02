import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NormaConfig } from './entities/norma-config.entity';

@Injectable()
export class NormasService {
  constructor(
    @InjectRepository(NormaConfig)
    private readonly repo: Repository<NormaConfig>,
  ) {}

  async upsert(key: string, data: Record<string, any>) {
    const existing = await this.repo.findOne({ where: { key } });
    if (existing) {
      existing.data = data;
      return this.repo.save(existing);
    }
    return this.repo.save(this.repo.create({ key, data }));
  }

  async get<T = any>(key: string): Promise<T | null> {
    const row = await this.repo.findOne({ where: { key } });
    return (row?.data as T) ?? null;
  }

  async listKeys(): Promise<string[]> {
    const rows = await this.repo.find({ select: { key: true } });
    return rows.map(r => r.key);
  }
}
