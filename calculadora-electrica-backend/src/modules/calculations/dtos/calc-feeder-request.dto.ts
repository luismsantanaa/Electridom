import {
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CircuitoRamalInputDto {
  @ApiProperty({ description: 'ID del circuit' })
  @IsString()
  id_circuito: string;

  @ApiProperty({ description: 'name del circuit' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Corriente total del circuit en amperios' })
  @IsNumber()
  @Min(0)
  corriente_total_a: number;

  @ApiProperty({ description: 'load total del circuit en VA' })
  @IsNumber()
  @Min(0)
  carga_total_va: number;

  @ApiPropertyOptional({ description: 'Longitud del circuit en metros' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  length_m?: number;
}

export class SistemaElectricoInputDto {
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

export class ParametrosInstalizacionDto {
  @ApiProperty({
    description: 'Longitud del feeder principal en metros',
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  longitud_alimentador_m: number;

  @ApiPropertyOptional({
    description: 'material preferido del conductor (Cu, Al)',
    default: 'Cu',
  })
  @IsOptional()
  @IsString()
  material_conductor?: string;

  @ApiPropertyOptional({
    description: 'Máxima caída de tensión permitida en ramal (%)',
    default: 3,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  max_caida_ramal_pct?: number;

  @ApiPropertyOptional({
    description: 'Máxima caída de tensión total permitida (%)',
    default: 5,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  max_caida_total_pct?: number;
}

export class CalcFeederRequestDto {
  @ApiProperty({
    type: [CircuitoRamalInputDto],
    description: 'circuits ramales desde CE-03',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CircuitoRamalInputDto)
  circuitos_ramales: CircuitoRamalInputDto[];

  @ApiProperty({
    type: SistemaElectricoInputDto,
    description: 'Configuración del system eléctrico',
  })
  @ValidateNested()
  @Type(() => SistemaElectricoInputDto)
  system: SistemaElectricoInputDto;

  @ApiProperty({
    type: ParametrosInstalizacionDto,
    description: 'Parámetros de la instalación',
  })
  @ValidateNested()
  @Type(() => ParametrosInstalizacionDto)
  parameters: ParametrosInstalizacionDto;

  @ApiPropertyOptional({ description: 'Observaciones adicionales' })
  @IsOptional()
  observaciones?: string[];
}
