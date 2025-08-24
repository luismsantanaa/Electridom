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
  @ApiProperty({ description: 'ID del circuito' })
  @IsString()
  id_circuito: string;

  @ApiProperty({ description: 'Nombre del circuito' })
  @IsString()
  nombre: string;

  @ApiProperty({ description: 'Corriente total del circuito en amperios' })
  @IsNumber()
  @Min(0)
  corriente_total_a: number;

  @ApiProperty({ description: 'Carga total del circuito en VA' })
  @IsNumber()
  @Min(0)
  carga_total_va: number;

  @ApiPropertyOptional({ description: 'Longitud del circuito en metros' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  longitud_m?: number;
}

export class SistemaElectricoInputDto {
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

export class ParametrosInstalizacionDto {
  @ApiProperty({
    description: 'Longitud del alimentador principal en metros',
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  longitud_alimentador_m: number;

  @ApiPropertyOptional({
    description: 'Material preferido del conductor (Cu, Al)',
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
    description: 'Circuitos ramales desde CE-03',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CircuitoRamalInputDto)
  circuitos_ramales: CircuitoRamalInputDto[];

  @ApiProperty({
    type: SistemaElectricoInputDto,
    description: 'Configuración del sistema eléctrico',
  })
  @ValidateNested()
  @Type(() => SistemaElectricoInputDto)
  sistema: SistemaElectricoInputDto;

  @ApiProperty({
    type: ParametrosInstalizacionDto,
    description: 'Parámetros de la instalación',
  })
  @ValidateNested()
  @Type(() => ParametrosInstalizacionDto)
  parametros: ParametrosInstalizacionDto;

  @ApiPropertyOptional({ description: 'Observaciones adicionales' })
  @IsOptional()
  observaciones?: string[];
}
