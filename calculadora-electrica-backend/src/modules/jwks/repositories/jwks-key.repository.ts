import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { JwksKey, JwksKeyType } from '../entities/jwks-key.entity';

@Injectable()
export class JwksKeyRepository extends Repository<JwksKey> {
  constructor(private dataSource: DataSource) {
    super(JwksKey, dataSource.createEntityManager());
  }

  async findActiveKey(): Promise<JwksKey | null> {
    return this.findOne({
      where: { isActive: true },
      order: { creationDate: 'DESC' },
    });
  }

  async findActivePublicKeys(): Promise<JwksKey[]> {
    return this.find({
      where: { isActive: true },
      select: ['id', 'kid', 'type', 'publicPem', 'creationDate', 'rotatedAt'],
      order: { creationDate: 'DESC' },
    });
  }

  async findActivePrivateKey(): Promise<JwksKey | null> {
    return this.createQueryBuilder('key')
      .where('key.isActive = :isActive', { isActive: true })
      .andWhere('key.privatePem IS NOT NULL')
      .orderBy('key.creationDate', 'DESC')
      .getOne();
  }

  async deactivatePreviousKeys(): Promise<void> {
    await this.update(
      { isActive: true },
      { isActive: false, rotatedAt: new Date() },
    );
  }

  async countActiveKeys(): Promise<number> {
    return this.count({ where: { isActive: true } });
  }

  async findByKid(kid: string): Promise<JwksKey | null> {
    return this.findOne({ where: { kid } });
  }
}
