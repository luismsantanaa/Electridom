import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const adminApiKey = this.configService.get<string>('security.adminApiKey');

    if (!adminApiKey) {
      throw new UnauthorizedException('ADMIN_API_KEY no configurada');
    }

    // Verificar API Key en header x-api-key
    const apiKeyFromHeader = request.headers['x-api-key'];
    if (apiKeyFromHeader === adminApiKey) {
      return true;
    }

    // Verificar API Key en Authorization header
    const authHeader = request.headers.authorization;
    if (authHeader && authHeader.startsWith('ApiKey ')) {
      const apiKeyFromAuth = authHeader.substring(7);
      if (apiKeyFromAuth === adminApiKey) {
        return true;
      }
    }

    throw new UnauthorizedException('API Key inválida o faltante');
  }
}
