import {
  IsString,
  IsNotEmpty,
  MaxLength,
  IsOptional,
  IsNumber,
  IsEnum,
  IsUUID,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum ProjectSource {
  RIE = 'RIE',
  NEC = 'NEC',
  REBT = 'REBT',
}

// DTO para crear/editar proyecto (simplificado para Sprint 9)
export class ProjectInputDto {
  @ApiProperty({
    example: 'Residencia García',
    description: 'Nombre del proyecto',
    maxLength: 120,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name: string;

  @ApiProperty({
    example: 'Juan García',
    description: 'Propietario del proyecto',
    maxLength: 100,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  owner?: string;

  @ApiProperty({
    example: 'Santo Domingo Este',
    description: 'Ubicación del proyecto',
    maxLength: 200,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  location?: string;

  @ApiProperty({
    example: 120,
    description: 'Tensión en voltios',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  voltage?: number;

  @ApiProperty({
    example: 60,
    description: 'Frecuencia en Hz',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  frequency?: number;

  @ApiProperty({
    example: 'Proyecto residencial con instalación monofásica',
    description: 'Notas adicionales',
    maxLength: 1000,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}

// DTO para validar ID de proyecto
export class ProjectIdParamDto {
  @ApiProperty({
    example: 'uuid',
    description: 'ID del proyecto',
  })
  @IsUUID()
  @IsNotEmpty()
  id: string;
}

// DTO para respuesta de proyecto
export class ProjectResponseDto {
  @ApiProperty({ example: 'uuid' })
  id: string;

  @ApiProperty({ example: 'Residencia García' })
  name: string;

  @ApiProperty({ example: 'Juan García', required: false })
  owner?: string;

  @ApiProperty({ example: 'Santo Domingo Este', required: false })
  location?: string;

  @ApiProperty({ example: 120, required: false })
  voltage?: number;

  @ApiProperty({ example: 60, required: false })
  frequency?: number;

  @ApiProperty({ example: 'Proyecto residencial...', required: false })
  notes?: string;

  @ApiProperty({ example: '2025-01-15T10:30:00Z' })
  createdAt: string;

  @ApiProperty({ example: '2025-01-15T10:30:00Z' })
  updatedAt: string;

  @ApiProperty({ example: 'ACTIVE' })
  status: string;
}
