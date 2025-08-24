import {
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SistemaElectricoGroundingDto {
  @ApiProperty({ description: 'Tensión del sistema en voltios' })
  @IsNumber()
  @Min(1)
  tension_v: number;

  @ApiProperty({ description: 'Número de fases (1 o 3)' })
  @IsNumber()
  phases: number;

  @ApiProperty({ description: 'Corriente total del sistema en amperios' })
  @IsNumber()
  @Min(0)
  corriente_total_a: number;

  @ApiProperty({ description: 'Carga total del sistema en VA' })
  @IsNumber()
  @Min(0)
  carga_total_va: number;
}

export class AlimentadorGroundingDto {
  @ApiProperty({ description: 'Corriente del alimentador en amperios' })
  @IsNumber()
  @Min(0)
  corriente_a: number;

  @ApiProperty({ description: 'Sección del alimentador en mm²' })
  @IsNumber()
  @Min(0)
  seccion_mm2: number;

  @ApiProperty({ description: 'Material del alimentador' })
  @IsString()
  material: string;

  @ApiProperty({ description: 'Longitud del alimentador en metros' })
  @IsNumber()
  @Min(0)
  longitud_m: number;
}

export class ParametrosGroundingDto {
  @ApiProperty({
    description: 'Amperaje del breaker principal',
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  main_breaker_amp: number;

  @ApiPropertyOptional({
    description: 'Tipo de instalación (residencial, comercial, industrial)',
    default: 'residencial',
  })
  @IsOptional()
  @IsString()
  tipo_instalacion?: string;

  @ApiPropertyOptional({
    description: 'Tipo de sistema de tierra (TN-S, TN-C-S, TT, IT)',
    default: 'TN-S',
  })
  @IsOptional()
  @IsString()
  tipo_sistema_tierra?: string;

  @ApiPropertyOptional({
    description: 'Resistividad del suelo en Ohm·m',
    default: 100,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  resistividad_suelo_ohm_m?: number;
}

export class CalcGroundingRequestDto {
  @ApiProperty({
    type: SistemaElectricoGroundingDto,
    description: 'Configuración del sistema eléctrico',
  })
  @ValidateNested()
  @Type(() => SistemaElectricoGroundingDto)
  sistema: SistemaElectricoGroundingDto;

  @ApiProperty({
    type: AlimentadorGroundingDto,
    description: 'Configuración del alimentador principal',
  })
  @ValidateNested()
  @Type(() => AlimentadorGroundingDto)
  alimentador: AlimentadorGroundingDto;

  @ApiProperty({
    type: ParametrosGroundingDto,
    description: 'Parámetros de puesta a tierra',
  })
  @ValidateNested()
  @Type(() => ParametrosGroundingDto)
  parametros: ParametrosGroundingDto;

  @ApiPropertyOptional({ description: 'Observaciones adicionales' })
  @IsOptional()
  observaciones?: string[];
}
