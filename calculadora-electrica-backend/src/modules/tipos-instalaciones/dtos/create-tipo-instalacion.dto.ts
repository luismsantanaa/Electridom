import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsUUID, IsBoolean } from 'class-validator';

export class CreateTipoInstalacionDto {
  @IsUUID()
  @ApiProperty()
  id: string;

  @IsString()
  @ApiProperty({
    example: 'oficina',
    description: 'Nombre del tipo de instalación',
  })
  nombre: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    example: 'espacio para trabajo',
    description: 'Descripción del tipo de instalación',
  })
  descripcion?: string;

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
    example: 'usuario@ejemplo.com',
    description: 'Creado por',
  })
  creadoPor?: string;
}
