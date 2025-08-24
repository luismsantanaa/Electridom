import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService as NestJwtService } from '@nestjs/jwt';
import { KeyStoreService } from './key-store.service';
import { JwksKey } from '../entities/jwks-key.entity';
import * as jwt from 'jsonwebtoken';

export interface JwtPayload {
  sub: number;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtRs256Service {
  private readonly logger = new Logger(JwtRs256Service.name);

  constructor(
    private readonly nestJwtService: NestJwtService,
    private readonly keyStoreService: KeyStoreService,
  ) {}

  /**
   * Firma un token JWT usando RS256 con la clave activa
   */
  async sign(
    payload: JwtPayload,
    options?: { expiresIn?: string },
  ): Promise<string> {
    const activeKey = await this.keyStoreService.getActivePrivateKey();

    if (!activeKey || !activeKey.privatePem) {
      this.logger.error('No se encontró una clave privada activa para firmar');
      throw new UnauthorizedException('Error de configuración de claves');
    }

    const signOptions: jwt.SignOptions = {
      algorithm: 'RS256',
      keyid: activeKey.kid,
      expiresIn: options?.expiresIn || '900s', // 15 minutos por defecto
    };

    try {
      const token = jwt.sign(payload, activeKey.privatePem, signOptions);
      this.logger.debug(`Token JWT firmado con kid: ${activeKey.kid}`);
      return token;
    } catch (error) {
      this.logger.error('Error al firmar token JWT:', error);
      throw new UnauthorizedException('Error al generar token');
    }
  }

  /**
   * Verifica un token JWT usando RS256
   */
  async verify(token: string): Promise<JwtPayload> {
    try {
      // Extraer el kid del header del token
      const decodedHeader = this.nestJwtService.decode(token, {
        complete: true,
      }) as any;
      const kid = decodedHeader?.header?.kid;

      if (!kid) {
        throw new UnauthorizedException('Token no contiene kid');
      }

      // Buscar la clave pública correspondiente
      const key = await this.keyStoreService.getKeyByKid(kid);

      if (!key || !key.publicPem) {
        this.logger.warn(`Clave con kid ${kid} no encontrada`);
        throw new UnauthorizedException('Clave de verificación no encontrada');
      }

      // Verificar el token
      const payload = jwt.verify(token, key.publicPem, {
        algorithms: ['RS256'],
      }) as unknown as JwtPayload;

      this.logger.debug(`Token JWT verificado con kid: ${kid}`);
      return payload;
    } catch (error) {
      this.logger.error('Error al verificar token JWT:', error);
      throw new UnauthorizedException('Token inválido');
    }
  }

  /**
   * Decodifica un token JWT sin verificar (solo para obtener información)
   */
  decode(token: string): JwtPayload | null {
    try {
      return this.nestJwtService.decode(token) as JwtPayload;
    } catch (error) {
      this.logger.error('Error al decodificar token JWT:', error);
      return null;
    }
  }

  /**
   * Obtiene el kid de la clave activa actual
   */
  async getActiveKid(): Promise<string | null> {
    const activeKey = await this.keyStoreService.getActiveKey();
    return activeKey?.kid || null;
  }
}
