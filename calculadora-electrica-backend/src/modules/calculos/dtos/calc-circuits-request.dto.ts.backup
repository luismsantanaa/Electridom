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
  @ApiProperty({ description: 'Categoría de la carga' })
  @IsString()
  categoria: string;

  @ApiProperty({ description: 'Carga diversificada en VA', minimum: 0 })
  @IsNumber()
  @Min(0)
  carga_diversificada_va: number;

  @ApiPropertyOptional({ description: 'Factor de demanda aplicado' })
  @IsOptional()
  @IsNumber()
  factor_demanda?: number;

  @ApiPropertyOptional({ description: 'Descripción de la carga' })
  @IsOptional()
  @IsString()
  descripcion?: string;

  @ApiPropertyOptional({ description: 'Ambiente donde se ubica' })
  @IsOptional()
  @IsString()
  ambiente?: string;
}

export class SistemaElectricoDto {
  @ApiProperty({ description: 'Tensión del sistema en voltios' })
  @IsNumber()
  @Min(1)
  tension_v: number;

  @ApiProperty({ description: 'Número de fases (1 o 3)' })
  @IsNumber()
  phases: number;

  @ApiProperty({ description: 'Tipo de sistema (1=monofásico, 3=trifásico)' })
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
    description: 'Cargas diversificadas desde CE-02',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CargaDiversificadaInputDto)
  cargas_diversificadas: CargaDiversificadaInputDto[];

  @ApiProperty({
    type: SistemaElectricoDto,
    description: 'Configuración del sistema eléctrico',
  })
  @ValidateNested()
  @Type(() => SistemaElectricoDto)
  sistema: SistemaElectricoDto;

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
