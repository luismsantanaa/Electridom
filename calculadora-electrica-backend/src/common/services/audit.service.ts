import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from '../entities/audit-log.entity';
import { AuditAction, AuditLogData } from '../types/audit.types';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
  ) {}

  async log(data: AuditLogData): Promise<void> {
    try {
      // Crear el objeto de auditoría manualmente
      const auditLog = new AuditLog();
      auditLog.userId = data.userId;
      auditLog.action = data.action;
      auditLog.ip = data.ip;
      auditLog.userAgent = data.userAgent;
      auditLog.detail = data.detail ? JSON.stringify(data.detail) : undefined;
      auditLog.traceId = data.traceId;

      await this.auditLogRepository.save(auditLog);

      // Log crítico para eventos de seguridad
      if (this.isSecurityCritical(data.action)) {
        this.logger.warn(`Security Event: ${data.action}`, {
          userId: data.userId,
          ip: data.ip,
          traceId: data.traceId,
          detail: data.detail,
        });
      }
    } catch (error) {
      // No fallar la aplicación si la auditoría falla
      this.logger.error('Error logging audit event', error);
    }
  }

  private isSecurityCritical(action: AuditAction): boolean {
    return [
      AuditAction.LOGIN_FAILED,
      AuditAction.ACCOUNT_LOCKED,
      AuditAction.RATE_LIMIT_EXCEEDED,
      AuditAction.SUSPICIOUS_ACTIVITY,
      AuditAction.ROLE_CHANGE,
      AuditAction.PERMISSION_CHANGE,
    ].includes(action);
  }

  async getAuditLogs(
    userId?: string,
    action?: AuditAction,
    limit = 100,
    offset = 0,
  ): Promise<{ logs: AuditLog[]; total: number }> {
    const queryBuilder = this.auditLogRepository.createQueryBuilder('log');

    if (userId) {
      queryBuilder.andWhere('log.userId = :userId', { userId });
    }

    if (action) {
      queryBuilder.andWhere('log.action = :action', { action });
    }

    const [logs, total] = await queryBuilder
      .orderBy('log.createdAt', 'DESC')
      .skip(offset)
      .take(limit)
      .getManyAndCount();

    return { logs, total };
  }
}
