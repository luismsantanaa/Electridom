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
  @ApiProperty({ description: 'Tensión del system en voltios' })
  @IsNumber()
  @Min(1)
  voltage_v: number;

  @ApiProperty({ description: 'Número de fases (1 o 3)' })
  @IsNumber()
  phases: number;

  @ApiProperty({ description: 'Corriente total del system en amperios' })
  @IsNumber()
  @Min(0)
  corriente_total_a: number;

  @ApiProperty({ description: 'load total del system en VA' })
  @IsNumber()
  @Min(0)
  carga_total_va: number;
}

export class AlimentadorGroundingDto {
  @ApiProperty({ description: 'Corriente del feeder en amperios' })
  @IsNumber()
  @Min(0)
  current_a: number;

  @ApiProperty({ description: 'Sección del feeder en mm²' })
  @IsNumber()
  @Min(0)
  section_mm2: number;

  @ApiProperty({ description: 'material del feeder' })
  @IsString()
  material: string;

  @ApiProperty({ description: 'Longitud del feeder en metros' })
  @IsNumber()
  @Min(0)
  length_m: number;
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
    description: 'type de instalación (residencial, comercial, industrial)',
    default: 'residencial',
  })
  @IsOptional()
  @IsString()
  tipo_instalacion?: string;

  @ApiPropertyOptional({
    description: 'type de system de tierra (TN-S, TN-C-S, TT, IT)',
    default: 'TN-S',
  })
  @IsOptional()
  @IsString()
  tipo_sistema_tierra?: string;

  @ApiPropertyOptional({
    description: 'resistivity del suelo en Ohm·m',
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
    description: 'Configuración del system eléctrico',
  })
  @ValidateNested()
  @Type(() => SistemaElectricoGroundingDto)
  system: SistemaElectricoGroundingDto;

  @ApiProperty({
    type: AlimentadorGroundingDto,
    description: 'Configuración del feeder principal',
  })
  @ValidateNested()
  @Type(() => AlimentadorGroundingDto)
  feeder: AlimentadorGroundingDto;

  @ApiProperty({
    type: ParametrosGroundingDto,
    description: 'Parámetros de puesta a tierra',
  })
  @ValidateNested()
  @Type(() => ParametrosGroundingDto)
  parameters: ParametrosGroundingDto;

  @ApiPropertyOptional({ description: 'Observaciones adicionales' })
  @IsOptional()
  observaciones?: string[];
}

