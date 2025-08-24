import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, randomBytes } from 'crypto';
import { SessionRepository } from '../repositories/session.repository';
import { Session, SessionStatus } from '../entities/session.entity';
import { User } from '../../users/entities/user.entity';

export interface RefreshTokenPayload {
  sub: string;
  jti: string;
  type: 'refresh';
}

export interface OpaqueRefreshToken {
  sessionId: string;
  random: string;
}

@Injectable()
export class SessionService {
  private readonly logger = new Logger(SessionService.name);

  constructor(
    private readonly sessionRepository: SessionRepository,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Genera un refresh token opaco con formato: base64url("<sessionId>.<random>")
   */
  generateRefreshToken(sessionId: string): string {
    const random = randomBytes(64).toString('base64url');
    const token = `${sessionId}.${random}`;
    return Buffer.from(token).toString('base64url');
  }

  /**
   * Decodifica un refresh token opaco
   */
  decodeRefreshToken(refreshToken: string): OpaqueRefreshToken {
    try {
      if (!refreshToken || typeof refreshToken !== 'string') {
        throw new Error('Refresh token es requerido y debe ser una cadena');
      }

      const decoded = Buffer.from(refreshToken, 'base64url').toString('utf-8');
      
      if (!decoded || !decoded.includes('.')) {
        throw new Error('Formato de refresh token inválido');
      }

      const [sessionId, random] = decoded.split('.');

      if (!sessionId || !random) {
        throw new Error('Refresh token malformado: faltan componentes');
      }

      // Validar que sessionId sea un UUID válido
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(sessionId)) {
        throw new Error('SessionId no es un UUID válido');
      }

      return { sessionId, random };
    } catch (error) {
      this.logger.debug('Error decodificando refresh token:', error.message);
      throw new UnauthorizedException('Refresh token malformado');
    }
  }

  /**
   * Hashea un refresh token usando HMAC-SHA256.
   */
  hashRefreshToken(refreshToken: string): string {
    try {
      if (!refreshToken) {
        throw new Error('Refresh token es requerido para hashear');
      }

      const salt = this.configService.get<string>('REFRESH_SALT');
      if (!salt) {
        throw new Error('REFRESH_SALT no está configurado');
      }

      return createHmac('sha256', salt).update(refreshToken).digest('hex');
    } catch (error) {
      this.logger.error('Error hasheando refresh token:', error.message);
      throw new Error('Error interno al procesar refresh token');
    }
  }

  /**
   * Crea una nueva sesión para un usuario
   */
  async createSession(
    user: User,
    userAgent: string,
    ip: string,
    jti: string,
  ): Promise<{ session: Session; refreshToken: string }> {
    const refreshTtl = this.configService.get<string>('REFRESH_TTL', '30d');
    
    // Convertir TTL a milisegundos
    const ttlMs = this.parseTtl(refreshTtl);
    const expiresAt = new Date(Date.now() + ttlMs);

    const session = this.sessionRepository.create({
      userId: user.id,
      refreshHash: '', // Se actualizará después de generar el token
      userAgent,
      ip,
      expiresAt,
      jti,
      usrCreate: user.username || 'system',
      usrUpdate: user.username || 'system',
    });

    const savedSession = await this.sessionRepository.save(session);
    
    // Generar refresh token opaco usando el ID de la sesión
    const refreshToken = this.generateRefreshToken(savedSession.id);
    
    // Actualizar el hash del refresh token
    const refreshHash = this.hashRefreshToken(refreshToken);
    await this.sessionRepository.update(savedSession.id, { refreshHash });

    return { session: savedSession, refreshToken };
  }

  /**
   * Valida un refresh token y retorna la sesión
   */
  async validateRefreshToken(refreshToken: string): Promise<Session> {
    try {
      // Decodificar el token opaco
      const { sessionId } = this.decodeRefreshToken(refreshToken);
      
      // Buscar la sesión por ID
      const session = await this.sessionRepository.findOne({
        where: { id: sessionId },
        relations: ['user'],
      });

      if (!session) {
        throw new UnauthorizedException('Refresh token inválido o expirado');
      }

      // Verificar el hash del refresh token
      const refreshHash = this.hashRefreshToken(refreshToken);
      if (session.refreshHash !== refreshHash) {
        throw new UnauthorizedException('Refresh token inválido');
      }

      // Verificar el estado de la sesión
      const status = session.getStatus();
      if (status !== SessionStatus.ACTIVE) {
        // Si la sesión expiró, marcarla como revocada
        if (status === SessionStatus.EXPIRED) {
          try {
            await this.sessionRepository.revokeById(sessionId);
          } catch (revokeError) {
            this.logger.warn('Error al revocar sesión expirada:', revokeError.message);
          }
        }
        throw new UnauthorizedException(`Sesión ${status}`);
      }

      return session;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.error('Error validando refresh token:', error);
      throw new UnauthorizedException('Refresh token inválido');
    }
  }

  /**
   * Revoca una sesión por refresh token
   */
  async revokeSession(refreshToken: string): Promise<void> {
    try {
      if (!refreshToken) {
        this.logger.warn('Intento de revocar sesión con refresh token vacío');
        return;
      }

      const { sessionId } = this.decodeRefreshToken(refreshToken);
      await this.sessionRepository.revokeById(sessionId);
    } catch (error) {
      this.logger.debug('Error al revocar sesión:', error.message);
      // No lanzar error para evitar errores internos
    }
  }

  /**
   * Revoca una sesión por JTI
   */
  async revokeSessionByJti(jti: string): Promise<void> {
    await this.sessionRepository.revokeByJti(jti);
  }

  /**
   * Revoca todas las sesiones de un usuario
   */
  async revokeAllUserSessions(userId: string): Promise<void> {
    await this.sessionRepository.revokeByUserId(userId);
  }

  /**
   * Revoca una sesión específica por ID
   */
  async revokeSessionById(sessionId: string): Promise<void> {
    await this.sessionRepository.revokeById(sessionId);
  }

  /**
   * Rota una sesión (one-time-use)
   */
  async rotateSession(
    oldSession: Session,
    user: User,
    userAgent: string,
    ip: string,
    jti: string,
  ): Promise<{ session: Session; refreshToken: string }> {
    // Marcar la sesión anterior como rotada
    await this.sessionRepository.update(oldSession.id, {
      revokedAt: new Date(),
      rotatedTo: null, // Se actualizará después de crear la nueva sesión
    });

    // Crear nueva sesión
    const { session: newSession, refreshToken } = await this.createSession(
      user,
      userAgent,
      ip,
      jti,
    );

    // Actualizar la referencia de rotación en la sesión anterior
    await this.sessionRepository.update(oldSession.id, {
      rotatedTo: newSession.id,
    });

    // Actualizar la referencia de rotación en la nueva sesión
    await this.sessionRepository.update(newSession.id, {
      rotatedFrom: oldSession.id,
    });

    return { session: newSession, refreshToken };
  }

  /**
   * Obtiene todas las sesiones activas de un usuario
   */
  async getUserSessions(userId: string): Promise<Session[]> {
    return this.sessionRepository.findActiveByUserId(userId);
  }

  /**
   * Limpia sesiones expiradas
   */
  async cleanupExpiredSessions(): Promise<number> {
    const deletedCount = await this.sessionRepository.cleanupExpiredSessions();
    this.logger.log(`Limpiadas ${deletedCount} sesiones expiradas`);
    return deletedCount;
  }

  /**
   * Verifica si una sesión está activa por JTI
   */
  async isSessionActive(jti: string): Promise<boolean> {
    const session = await this.sessionRepository.findActiveByJti(jti);
    return !!session && session.isActive();
  }

  /**
   * Convierte TTL string a milisegundos
   */
  private parseTtl(ttl: string): number {
    const unit = ttl.slice(-1);
    const value = parseInt(ttl.slice(0, -1));

    switch (unit) {
      case 's':
        return value * 1000;
      case 'm':
        return value * 60 * 1000;
      case 'h':
        return value * 60 * 60 * 1000;
      case 'd':
        return value * 24 * 60 * 60 * 1000;
      default:
        return parseInt(ttl) * 1000; // Default a segundos
    }
  }
}
