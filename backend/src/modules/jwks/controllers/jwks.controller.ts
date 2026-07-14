import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { KeyStoreService } from '../services/key-store.service';
import { JwksResponseDto } from '../dtos/jwks-response.dto';

@ApiTags('JWKS')
@Controller('.well-known')
export class JwksController {
  constructor(private readonly keyStoreService: KeyStoreService) {}

  @Get('jwks.json')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener JWK Set público',
    description:
      'Retorna el conjunto de claves públicas activas en formato JWK Set',
  })
  @ApiResponse({
    status: 200,
    description: 'JWK Set con claves públicas activas',
    type: JwksResponseDto,
  })
  async getJwks(): Promise<JwksResponseDto> {
    const activeKeys = await this.keyStoreService.getActivePublicKeys();

    const keys = activeKeys.map((key) => ({
      kty: 'RSA',
      kid: key.kid,
      n: this.pemToJwkN(key.publicPem),
      e: 'AQAB',
      alg: 'RS256',
      use: 'sig',
    }));

    return { keys };
  }

  private pemToJwkN(pem: string): string {
    // Extraer la clave pública del PEM y convertir a JWK
    const pemContent = pem
      .replace(/-----BEGIN PUBLIC KEY-----/, '')
      .replace(/-----END PUBLIC KEY-----/, '')
      .replace(/\s/g, '');

    // Convertir base64 a buffer y luego a base64url
    const buffer = Buffer.from(pemContent, 'base64');
    return buffer.toString('base64url');
  }
}
