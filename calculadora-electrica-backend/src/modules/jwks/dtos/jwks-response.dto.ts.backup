import { ApiProperty } from '@nestjs/swagger';

export class JwkKeyDto {
  @ApiProperty({
    description: 'Tipo de clave (RSA)',
    example: 'RSA',
  })
  kty: string;

  @ApiProperty({
    description: 'Identificador único de la clave',
    example: 'kid-2025-08-22-1234567890',
  })
  kid: string;

  @ApiProperty({
    description: 'Módulo RSA en formato base64url',
    example:
      'n4EPtA4cZTVVXQJd3hGyaag2HHLjKgnC3qKqR9sb5xltFQtJ29sLFQidlJtOhZIcvc2TW68eSMOZ5S3IxDPic69ld98eJv3w2alux/LF5DNw9Rmt3MzJp1PqE83olHu3c78L1UjL6G5aGXEo0M0wQDnWpqWg0X4KhAOBGhPK1Cb3X16jMx9CFqt0VcjxE',
  })
  n: string;

  @ApiProperty({
    description: 'Exponente público RSA',
    example: 'AQAB',
  })
  e: string;

  @ApiProperty({
    description: 'Algoritmo de firma',
    example: 'RS256',
  })
  alg: string;

  @ApiProperty({
    description: 'Uso de la clave',
    example: 'sig',
  })
  use: string;
}

export class JwksResponseDto {
  @ApiProperty({
    description: 'Array de claves públicas activas',
    type: [JwkKeyDto],
  })
  keys: JwkKeyDto[];
}
