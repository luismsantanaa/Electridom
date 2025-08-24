import { IsString, IsNotEmpty, MaxLength, IsOptional, IsBoolean, ValidateNested, IsArray } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

// DTOs base reutilizables
export class SuperficieDto {
  @ApiProperty({ example: 'Sala', description: 'Nombre del ambiente' })
  @IsString() @IsNotEmpty() 
  ambiente: string;

  @ApiProperty({ example: 18.5, description: 'Área en metros cuadrados' })
  @IsNotEmpty() 
  areaM2: number;
}

export class ConsumoDto {
  @ApiProperty({ example: 'Televisor', description: 'Nombre del artefacto' })
  @IsString() @IsNotEmpty() 
  nombre: string;

  @ApiProperty({ example: 'Sala', description: 'Ambiente donde se ubica' })
  @IsString() @IsNotEmpty() 
  ambiente: string;

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
    description: 'Fecha efectiva para resolver reglas activas (ISO 8601)',
    example: '2025-09-10T00:00:00Z',
    required: false,
  })
  @IsOptional() @IsString() 
  effectiveDate?: string;
}

// DTO base para crear proyecto
export class CreateProjectBaseDto {
  @ApiProperty({ 
    example: 'Residencia García', 
    description: 'Nombre del proyecto',
    maxLength: 120 
  })
  @IsString() @IsNotEmpty() @MaxLength(120) 
  projectName: string;

  @ApiProperty({ 
    example: 'Unifamiliar 2 plantas', 
    description: 'Descripción del proyecto',
    required: false,
    maxLength: 500 
  })
  @IsOptional() @IsString() @MaxLength(500) 
  description?: string;
}

// DTO para crear proyecto con datos de cálculo
export class CreateProjectRequestDto extends CreateProjectBaseDto {
  @ApiProperty({ 
    type: [SuperficieDto],
    example: [{ ambiente: 'Sala', areaM2: 18.5 }],
    description: 'Lista de superficies por ambiente'
  })
  @IsArray() @ValidateNested({ each: true }) @Type(() => SuperficieDto) 
  superficies: SuperficieDto[];

  @ApiProperty({ 
    type: [ConsumoDto],
    example: [{ nombre: 'Televisor', ambiente: 'Sala', watts: 120 }],
    description: 'Lista de consumos por ambiente'
  })
  @IsArray() @ValidateNested({ each: true }) @Type(() => ConsumoDto) 
  consumos: ConsumoDto[];

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
    type: [SuperficieDto],
    example: [{ ambiente: 'Sala', areaM2: 18.5 }],
    description: 'Lista de superficies por ambiente'
  })
  @IsArray() @ValidateNested({ each: true }) @Type(() => SuperficieDto) 
  superficies: SuperficieDto[];

  @ApiProperty({ 
    type: [ConsumoDto],
    example: [{ nombre: 'Televisor', ambiente: 'Sala', watts: 120 }],
    description: 'Lista de consumos por ambiente'
  })
  @IsArray() @ValidateNested({ each: true }) @Type(() => ConsumoDto) 
  consumos: ConsumoDto[];

  @ApiProperty({ 
    type: OpcionesDto,
    example: { tensionV: 120, monofasico: true },
    description: 'Opciones de cálculo',
    required: false
  })
  @ValidateNested() @Type(() => OpcionesDto) @IsOptional() 
  opciones?: OpcionesDto;

  @ApiProperty({ 
    example: 'Ajuste de consumos cocina', 
    description: 'Nota opcional para la versión',
    required: false,
    maxLength: 240
  })
  @IsOptional() @IsString() @MaxLength(240) 
  note?: string;
}

// DTO para actualizar estado del proyecto
export class UpdateProjectStatusDto {
  @ApiProperty({ 
    enum: ['ACTIVE', 'ARCHIVED'],
    example: 'ARCHIVED',
    description: 'Nuevo estado del proyecto'
  })
  @IsString() @IsNotEmpty() 
  status: 'ACTIVE' | 'ARCHIVED';
}
