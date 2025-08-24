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
  @ApiProperty({ description: 'Categoría de carga' })
  categoria: string;

  @ApiProperty({
    description: 'Carga total en VA para esta categoría',
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  carga_va: number;

  @ApiPropertyOptional({ description: 'Descripción de la categoría' })
  @IsOptional()
  descripcion?: string;
}

export class TotalesInputDto {
  @ApiProperty({ description: 'Carga total sin diversificar en VA' })
  @IsNumber()
  @Min(0)
  carga_total_va: number;

  @ApiProperty({ description: 'Tensión del sistema en voltios' })
  @IsNumber()
  @Min(1)
  tension_v: number;

  @ApiProperty({ description: 'Número de fases' })
  @IsNumber()
  phases: number;
}

export class CalcDemandRequestDto {
  @ApiProperty({
    type: [CargaPorCategoriaDto],
    description: 'Cargas agrupadas por categoría desde CE-01',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CargaPorCategoriaDto)
  cargas_por_categoria: CargaPorCategoriaDto[];

  @ApiProperty({ type: TotalesInputDto, description: 'Totales del sistema' })
  @ValidateNested()
  @Type(() => TotalesInputDto)
  totales: TotalesInputDto;

  @ApiPropertyOptional({ description: 'Observaciones adicionales' })
  @IsOptional()
  observaciones?: string[];
}
