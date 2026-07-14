import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtAuthMiddleware implements NestMiddleware {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  use(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // Para endpoints públicos, continuar sin autenticación
      if (this.isPublicEndpoint(req.path)) {
        return next();
      }
      throw new UnauthorizedException('Token de autenticación requerido');
    }

    const token = authHeader.substring(7);

    try {
      const payload = this.jwtService.verify(token, {
        secret: this.configService.get('jwt.secret'),
      });

      // Agregar usuario al request
      req.user = {
        id: payload.sub,
        email: payload.email,
        roles: payload.roles || ['viewer'], // Rol por defecto
      };

      next();
    } catch (error) {
      throw new UnauthorizedException('Token inválido');
    }
  }

  private isPublicEndpoint(path: string): boolean {
    const publicPaths = [
      '/health',
      '/metrics',
      '/docs',
      '/docs-json',
      '/docs-yaml',
      '/auth/login',
      '/auth/register',
    ];

    return publicPaths.some((publicPath) => path.startsWith(publicPath));
  }
}
