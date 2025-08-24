import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { JwtRs256Service } from '../../jwks/services/jwt-rs256.service';
import { UsersService } from '../../users/users.service';
import { RegisterDto } from '../dtos/register.dto';
import { User, UserRole, UserStatus } from '../../users/entities/user.entity';
import { AuditService } from '../../../common/services/audit.service';
import { AuditAction } from '../../../common/types/audit.types';
import { HashService } from '../../../common/services/hash.service';
import { SessionService } from './session.service';
import { LoginResponseDto, RefreshResponseDto } from '../dtos/refresh.dto';
import { randomUUID } from 'crypto';

type UserResponse = Pick<
  User,
  | 'id'
  | 'username'
  | 'email'
  | 'nombre'
  | 'apellido'
  | 'role'
  | 'estado'
  | 'telefono'
  | 'empresa'
  | 'cedula'
  | 'ultimoAcceso'
  | 'creationDate'
  | 'updateDate'
>;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private jwtRs256Service: JwtRs256Service,
    private auditService: AuditService,
    private hashService: HashService,
    private sessionService: SessionService,
  ) {}

  async validateUser(
    email: string,
    password: string,
    ip: string,
    userAgent: string,
    traceId: string,
  ): Promise<UserResponse | null> {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      await this.auditService.log({
        userId: undefined,
        action: AuditAction.LOGIN_FAILED,
        ip,
        userAgent,
        traceId,
        detail: { email, reason: 'user_not_found' },
      });
      return null;
    }

    if (!user.active || user.estado !== UserStatus.ACTIVO) {
      await this.auditService.log({
        userId: user.id,
        action: AuditAction.LOGIN_FAILED,
        ip,
        userAgent,
        traceId,
        detail: { email, reason: 'user_inactive' },
      });
      return null;
    }

    const hashResult = await user.validatePassword(password);
    if (!hashResult.hash) {
      await this.auditService.log({
        userId: user.id,
        action: AuditAction.LOGIN_FAILED,
        ip,
        userAgent,
        traceId,
        detail: { email, reason: 'invalid_password' },
      });
      return null;
    }

    // Log successful login
    await this.auditService.log({
      userId: user.id,
      action: AuditAction.LOGIN_SUCCESS,
      ip,
      userAgent,
      traceId,
      detail: {
        email,
        hashType: hashResult.type,
        migrated: hashResult.needsMigration,
      },
    });

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      nombre: user.nombre,
      apellido: user.apellido,
      role: user.role,
      estado: user.estado,
      telefono: user.telefono,
      empresa: user.empresa,
      cedula: user.cedula,
      ultimoAcceso: user.ultimoAcceso,
      creationDate: user.creationDate,
      updateDate: user.updateDate,
    };
  }

  async login(
    user: UserResponse,
    ip: string,
    userAgent: string,
  ): Promise<LoginResponseDto> {
    const payload = { email: user.email, sub: user.id, role: user.role };

    // Generar JTI único para la sesión
    const jti = `jti-${randomUUID()}`;

    // Usar JwtService estándar para compatibilidad con JwtStrategy
    const access_token = this.jwtService.sign(payload);

    // Crear sesión en la base de datos
    const fullUser = await this.usersService.findById(user.id);
    if (!fullUser) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    const { refreshToken } = await this.sessionService.createSession(
      fullUser,
      userAgent,
      ip,
      jti,
    );

    return {
      access_token,
      refresh_token: refreshToken,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        nombre: user.nombre,
        apellido: user.apellido,
        role: user.role,
      },
    };
  }

  async refresh(
    refreshToken: string,
    ip: string,
    userAgent: string,
  ): Promise<RefreshResponseDto> {
    // Validar refresh token
    const session = await this.sessionService.validateRefreshToken(refreshToken);

    // Verificar que el user agent coincida (opcional, para mayor seguridad)
    if (session.userAgent !== userAgent) {
      this.logger.warn(`User agent mismatch for session ${session.id}`);
    }

    // Obtener usuario
    const user = await this.usersService.findById(session.userId);
    if (!user || !user.active || user.estado !== UserStatus.ACTIVO) {
      throw new UnauthorizedException('Usuario no válido');
    }

    // Generar nuevos tokens
    const payload = { email: user.email, sub: user.id, role: user.role };
    const newJti = `jti-${randomUUID()}`;
    const newAccessToken = this.jwtService.sign(payload);

    // Verificar si REFRESH_ROTATE está habilitado
    const refreshRotate = this.sessionService['configService'].get<boolean>(
      'REFRESH_ROTATE',
      true,
    );

    let newRefreshToken: string;

    if (refreshRotate) {
      // Rotar la sesión (one-time-use)
      const { refreshToken: rotatedToken } = await this.sessionService.rotateSession(
        session,
        user,
        userAgent,
        ip,
        newJti,
      );
      newRefreshToken = rotatedToken;
    } else {
      // Crear nueva sesión sin rotar la anterior
      const { refreshToken: newToken } = await this.sessionService.createSession(
        user,
        userAgent,
        ip,
        newJti,
      );
      newRefreshToken = newToken;
    }

    return {
      access_token: newAccessToken,
      refresh_token: newRefreshToken,
    };
  }

  async logout(
    refreshToken: string,
    ip: string,
    userAgent: string,
  ): Promise<void> {
    try {
      await this.sessionService.revokeSession(refreshToken);
    } catch (error) {
      // Si el refresh token no es válido, no hacer nada
      this.logger.debug('Invalid refresh token during logout');
    }
  }

  async logoutByJti(jti: string): Promise<void> {
    await this.sessionService.revokeSessionByJti(jti);
  }

  async getUserSessions(userId: string): Promise<any[]> {
    const sessions = await this.sessionService.getUserSessions(userId);
    return sessions.map((session) => ({
      id: session.id,
      userAgent: session.userAgent,
      ip: session.ip,
      expiresAt: session.expiresAt,
      creationDate: session.creationDate,
      jti: session.jti,
      status: session.getStatus(),
      rotatedFrom: session.rotatedFrom,
      rotatedTo: session.rotatedTo,
    }));
  }

  async revokeSession(sessionId: string, userId: string): Promise<void> {
    // Verificar que la sesión pertenece al usuario
    const sessions = await this.sessionService.getUserSessions(userId);
    const session = sessions.find((s) => s.id === sessionId);

    if (!session) {
      throw new UnauthorizedException('Sesión no encontrada');
    }

    await this.sessionService.revokeSessionById(sessionId);
  }

  async register(registerDto: RegisterDto): Promise<UserResponse> {
    const existingUser = await this.usersService.findByEmail(registerDto.email);
    if (existingUser) {
      throw new UnauthorizedException(
        'El correo electrónico ya está registrado',
      );
    }

    const hashedPassword = await this.hashService.hashPassword(
      registerDto.password,
    );

    const user = await this.usersService.create({
      ...registerDto,
      password: hashedPassword,
      role: UserRole.CLIENTE,
      estado: UserStatus.ACTIVO,
    });

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      nombre: user.nombre,
      apellido: user.apellido,
      role: user.role,
      estado: user.estado,
      telefono: user.telefono,
      empresa: user.empresa,
      cedula: user.cedula,
      ultimoAcceso: user.ultimoAcceso,
      creationDate: user.creationDate,
      updateDate: user.updateDate,
    };
  }
}
