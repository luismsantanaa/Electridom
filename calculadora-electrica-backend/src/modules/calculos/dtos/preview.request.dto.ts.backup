import {
  IsArray,
  ArrayMinSize,
  IsString,
  IsNotEmpty,
  IsNumber,
  Min,
  IsOptional,
  Max,
  ValidateNested,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class SuperficieDto {
  @ApiProperty({
    description: 'Nombre del ambiente',
    example: 'Sala',
  })
  @IsString()
  @IsNotEmpty()
  ambiente: string;

  @ApiProperty({
    description: 'Área en metros cuadrados',
    example: 18.5,
    minimum: 0.0001,
  })
  @IsNumber()
  @Min(0.0001)
  areaM2: number;
}

export class ConsumoDto {
  @ApiProperty({
    description: 'Nombre del artefacto',
    example: 'Televisor',
  })
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @ApiProperty({
    description: 'Ambiente donde se encuentra el artefacto',
    example: 'Sala',
  })
  @IsString()
  @IsNotEmpty()
  ambiente: string;

  @ApiProperty({
    description: 'Potencia en watts',
    example: 120,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  watts: number;

  @ApiProperty({
    description: 'Factor de uso (opcional)',
    example: 0.8,
    minimum: 0,
    maximum: 1,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  factorUso?: number;
}

export class OpcionesDto {
  @ApiProperty({
    description: 'Tensión en voltios',
    example: 120,
    default: 120,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  tensionV?: number;

  @ApiProperty({
    description: 'Sistema monofásico',
    example: true,
    default: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  monofasico?: boolean;

  @ApiProperty({
    description: 'ID del RuleSet específico a usar para el cálculo',
    example: 'uuid',
    required: false,
  })
  @IsOptional()
  @IsString()
  ruleSetId?: string;

  @ApiProperty({
    description: 'Fecha efectiva para resolver reglas activas (ISO 8601)',
    example: '2025-09-10T00:00:00Z',
    required: false,
  })
  @IsOptional()
  @IsString()
  effectiveDate?: string;
}

export class PreviewRequestDto {
  @ApiProperty({
    description: 'Lista de superficies por ambiente',
    type: [SuperficieDto],
    minItems: 1,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SuperficieDto)
  @ArrayMinSize(1)
  superficies: SuperficieDto[];

  @ApiProperty({
    description: 'Lista de consumos por artefacto',
    type: [ConsumoDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ConsumoDto)
  consumos: ConsumoDto[];

  @ApiProperty({
    description: 'Opciones de cálculo',
    type: OpcionesDto,
    required: false,
  })
  @ValidateNested()
  @Type(() => OpcionesDto)
  @IsOptional()
  opciones?: OpcionesDto;
}
