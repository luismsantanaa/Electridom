import { IsString, IsNotEmpty, MaxLength, IsOptional, IsBoolean, ValidateNested, IsArray } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

// DTOs base reutilizables
export class SurfaceDto {
  @ApiProperty({ example: 'Sala', description: 'name del environment' })
  @IsString() @IsNotEmpty() 
  environment: string;

  @ApiProperty({ example: 18.5, description: 'Área en metros cuadrados' })
  @IsNotEmpty() 
  areaM2: number;
}

export class ConsumptionDto {
  @ApiProperty({ example: 'Televisor', description: 'name del artefacto' })
  @IsString() @IsNotEmpty() 
  name: string;

  @ApiProperty({ example: 'Sala', description: 'environment donde se ubica' })
  @IsString() @IsNotEmpty() 
  environment: string;

  @ApiProperty({ example: 120, description: 'Potencia en watts' })
  @IsNotEmpty() 
  watts: number;
}

export class OpcionesDto {
  @ApiProperty({ example: 120, description: 'Tensión en voltios' })
  @IsOptional() 
  tensionV?: number;

  @ApiProperty({ example: true, description: 'Si es monofásico' })
  @IsOptional() 
  monofasico?: boolean;

  @ApiProperty({
    description: 'ID del RuleSet específico a usar para el cálculo',
    example: 'uuid',
    required: false,
  })
  @IsOptional() @IsString() 
  ruleSetId?: string;

  @ApiProperty({
    description: 'Fecha efectiva para resolver rules activas (ISO 8601)',
    example: '2025-09-10T00:00:00Z',
    required: false,
  })
  @IsOptional() @IsString() 
  effectiveDate?: string;
}

// DTO base para crear project
export class CreateProjectBaseDto {
  @ApiProperty({ 
    example: 'Residencia García', 
    description: 'name del project',
    maxLength: 120 
  })
  @IsString() @IsNotEmpty() @MaxLength(120) 
  projectName: string;

  @ApiProperty({ 
    example: 'Unifamiliar 2 plantas', 
    description: 'Descripción del project',
    required: false,
    maxLength: 500 
  })
  @IsOptional() @IsString() @MaxLength(500) 
  description?: string;
}

// DTO para crear project con datos de cálculo
export class CreateProjectRequestDto extends CreateProjectBaseDto {
  @ApiProperty({ 
    type: [SurfaceDto],
    example: [{ environment: 'Sala', areaM2: 18.5 }],
    description: 'Lista de surfaces por environment'
  })
  @IsArray() @ValidateNested({ each: true }) @Type(() => SurfaceDto) 
  surfaces: SurfaceDto[];

  @ApiProperty({ 
    type: [ConsumptionDto],
    example: [{ name: 'Televisor', environment: 'Sala', watts: 120 }],
    description: 'Lista de consumptions por environment'
  })
  @IsArray() @ValidateNested({ each: true }) @Type(() => ConsumptionDto) 
  consumptions: ConsumptionDto[];

  @ApiProperty({ 
    type: OpcionesDto,
    example: { tensionV: 120, monofasico: true },
    description: 'Opciones de cálculo',
    required: false
  })
  @ValidateNested() @Type(() => OpcionesDto) @IsOptional() 
  opciones?: OpcionesDto;

  @ApiProperty({ 
    example: true, 
    description: 'Si ejecutar cálculo inmediatamente',
    default: true,
    required: false
  })
  @IsOptional() @IsBoolean() 
  computeNow?: boolean;
}

// DTO para crear nueva versión
export class CreateVersionRequestDto {
  @ApiProperty({ 
    type: [SurfaceDto],
    example: [{ environment: 'Sala', areaM2: 18.5 }],
    description: 'Lista de surfaces por environment'
  })
  @IsArray() @ValidateNested({ each: true }) @Type(() => SurfaceDto) 
  surfaces: SurfaceDto[];

  @ApiProperty({ 
    type: [ConsumptionDto],
    example: [{ name: 'Televisor', environment: 'Sala', watts: 120 }],
    description: 'Lista de consumptions por environment'
  })
  @IsArray() @ValidateNested({ each: true }) @Type(() => ConsumptionDto) 
  consumptions: ConsumptionDto[];

  @ApiProperty({ 
    type: OpcionesDto,
    example: { tensionV: 120, monofasico: true },
    description: 'Opciones de cálculo',
    required: false
  })
  @ValidateNested() @Type(() => OpcionesDto) @IsOptional() 
  opciones?: OpcionesDto;

  @ApiProperty({ 
    example: 'Ajuste de consumptions cocina', 
    description: 'Nota opcional para la versión',
    required: false,
    maxLength: 240
  })
  @IsOptional() @IsString() @MaxLength(240) 
  note?: string;
}

// DTO para actualizar estado del project
export class UpdateProjectStatusDto {
  @ApiProperty({ 
    enum: ['ACTIVE', 'ARCHIVED'],
    example: 'ARCHIVED',
    description: 'Nuevo estado del project'
  })
  @IsString() @IsNotEmpty() 
  status: 'ACTIVE' | 'ARCHIVED';
}

