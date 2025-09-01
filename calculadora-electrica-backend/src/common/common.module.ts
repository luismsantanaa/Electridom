import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditService } from './services/audit.service';
import { AuditLog } from './entities/audit-log.entity';
import { HashService } from './services/hash.service';
import { JwksModule } from '../modules/jwks/jwks.module';
import { LoggerModule } from './modules/logger.module';

@Module({
  imports: [TypeOrmModule.forFeature([AuditLog]), JwksModule, LoggerModule],
  providers: [AuditService, HashService],
  exports: [AuditService, HashService, JwksModule],
})
export class CommonModule {}
