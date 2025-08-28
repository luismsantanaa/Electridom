import {
  IsArray,
  IsNumber,
  IsOptional,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CargaPorCategoriaDto {
  @ApiProperty({ description: 'Categoría de load' })
  category: string;

  @ApiProperty({
    description: 'load total en VA para esta categoría',
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  carga_va: number;

  @ApiPropertyOptional({ description: 'Descripción de la categoría' })
  @IsOptional()
  description?: string;
}

export class TotalesInputDto {
  @ApiProperty({ description: 'load total sin diversificar en VA' })
  @IsNumber()
  @Min(0)
  carga_total_va: number;

  @ApiProperty({ description: 'Tensión del system en voltios' })
  @IsNumber()
  @Min(1)
  voltage_v: number;

  @ApiProperty({ description: 'Número de fases' })
  @IsNumber()
  phases: number;
}

export class CalcDemandRequestDto {
  @ApiProperty({
    type: [CargaPorCategoriaDto],
    description: 'loads agrupadas por categoría desde CE-01',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CargaPorCategoriaDto)
  cargas_por_categoria: CargaPorCategoriaDto[];

  @ApiProperty({ type: TotalesInputDto, description: 'Totales del system' })
  @ValidateNested()
  @Type(() => TotalesInputDto)
  totales: TotalesInputDto;

  @ApiPropertyOptional({ description: 'Observaciones adicionales' })
  @IsOptional()
  observaciones?: string[];
}

