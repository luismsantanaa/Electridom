import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class RefreshTokenDto {
  @ApiProperty({
    description: 'Refresh token para renovar la sesión',
    example: 'abc123def456...',
  })
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}

export class LoginResponseDto {
  @ApiProperty({
    description: 'Access token JWT',
    example: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  access_token: string;

  @ApiProperty({
    description: 'Refresh token para renovar la sesión',
    example: 'abc123def456...',
  })
  refresh_token: string;

  @ApiProperty({
    description: 'Información del usuario',
    example: {
      id: '7d4b3e44-e850-43bb-94b4-48ad19a29953',
      email: 'test@example.com',
      username: 'testuser',
      nombre: 'Test',
      apellido: 'User',
      role: 'cliente',
    },
  })
  user: {
    id: string;
    email: string;
    username: string;
    nombre: string;
    apellido: string;
    role: string;
  };
}

export class RefreshResponseDto {
  @ApiProperty({
    description: 'Nuevo access token JWT',
    example: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  access_token: string;

  @ApiProperty({
    description: 'Nuevo refresh token',
    example: 'def456ghi789...',
  })
  refresh_token: string;
}

export class SessionDto {
  @ApiProperty({
    description: 'ID de la sesión',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'User Agent del dispositivo',
    example: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  })
  userAgent: string;

  @ApiProperty({
    description: 'Dirección IP del dispositivo',
    example: '192.168.1.100',
  })
  ip: string;

  @ApiProperty({
    description: 'Fecha de expiración de la sesión',
    example: '2025-09-22T10:30:00.000Z',
  })
  expiresAt: Date;

  @ApiProperty({
    description: 'Fecha de creación de la sesión',
    example: '2025-08-22T10:30:00.000Z',
  })
  creationDate: Date;

  @ApiProperty({
    description: 'JWT ID de la sesión',
    example: 'jti-1234567890',
  })
  jti: string;
}
