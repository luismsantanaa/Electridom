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

export class CargaDiversificadaInputDto {
  @ApiProperty({ description: 'Categoría de la load' })
  @IsString()
  category: string;

  @ApiProperty({ description: 'load diversificada en VA', minimum: 0 })
  @IsNumber()
  @Min(0)
  carga_diversificada_va: number;

  @ApiPropertyOptional({ description: 'Factor de demanda aplicado' })
  @IsOptional()
  @IsNumber()
  demand_factor?: number;

  @ApiPropertyOptional({ description: 'Descripción de la load' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'environment donde se ubica' })
  @IsOptional()
  @IsString()
  environment?: string;
}

export class SistemaElectricoDto {
  @ApiProperty({ description: 'Tensión del system en voltios' })
  @IsNumber()
  @Min(1)
  voltage_v: number;

  @ApiProperty({ description: 'Número de fases (1 o 3)' })
  @IsNumber()
  phases: number;

  @ApiProperty({ description: 'type de system (1=monofásico, 3=trifásico)' })
  @IsNumber()
  system_type: number;

  @ApiPropertyOptional({ description: 'Frecuencia en Hz' })
  @IsOptional()
  @IsNumber()
  frequency?: number;
}

export class CalcCircuitsRequestDto {
  @ApiProperty({
    type: [CargaDiversificadaInputDto],
    description: 'loads diversificadas desde CE-02',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CargaDiversificadaInputDto)
  cargas_diversificadas: CargaDiversificadaInputDto[];

  @ApiProperty({
    type: SistemaElectricoDto,
    description: 'Configuración del system eléctrico',
  })
  @ValidateNested()
  @Type(() => SistemaElectricoDto)
  system: SistemaElectricoDto;

  @ApiPropertyOptional({ description: 'Observaciones adicionales' })
  @IsOptional()
  observaciones?: string[];

  @ApiPropertyOptional({
    description: 'Configuraciones especiales de agrupación',
  })
  @IsOptional()
  configuraciones?: {
    max_utilizacion_circuito?: number;
    separar_por_ambiente?: boolean;
    preferir_monofasico?: boolean;
  };
}
