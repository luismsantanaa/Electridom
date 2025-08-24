import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsUUID, IsBoolean } from 'class-validator';

export class CreateTipoInstalacionDto {
  @IsUUID()
  @ApiProperty()
  id: string;

  @IsString()
  @ApiProperty({
    example: 'oficina',
    description: 'name del type de instalación',
  })
  name: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    example: 'espacio para trabajo',
    description: 'Descripción del type de instalación',
  })
  description?: string;

  @IsBoolean()
  @IsOptional()
  @ApiProperty({
    example: true,
    description: 'Activo',
  })
  activo?: boolean;

  @IsString()
  @IsOptional()
  @ApiProperty({
    example: 'user@ejemplo.com',
    description: 'Creado por',
  })
  creadoPor?: string;
}

