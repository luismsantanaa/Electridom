import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CargaDiversificadaDto {
  @ApiProperty({ description: 'Categoría de load' })
  category: string;

  @ApiProperty({ description: 'load original en VA' })
  carga_original_va: number;

  @ApiProperty({ description: 'Factor de demanda aplicado' })
  demand_factor: number;

  @ApiProperty({ description: 'load diversificada en VA' })
  carga_diversificada_va: number;

  @ApiPropertyOptional({ description: 'Rango aplicado (min-max VA)' })
  rango_aplicado?: string;

  @ApiPropertyOptional({ description: 'Observaciones del cálculo' })
  observaciones?: string;
}

export class TotalesDiversificadosDto {
  @ApiProperty({ description: 'load total original en VA' })
  carga_total_original_va: number;

  @ApiProperty({ description: 'load total diversificada en VA' })
  carga_total_diversificada_va: number;

  @ApiProperty({ description: 'Factor de diversificación efectivo' })
  factor_diversificacion_efectivo: number;

  @ApiProperty({ description: 'Corriente total diversificada en amperios' })
  corriente_total_diversificada_a: number;

  @ApiProperty({ description: 'Ahorro de load en VA' })
  ahorro_carga_va: number;

  @ApiProperty({ description: 'Porcentaje de ahorro' })
  porcentaje_ahorro: number;

  @ApiProperty({ description: 'Tensión del system en voltios' })
  voltage_v: number;

  @ApiProperty({ description: 'Número de fases' })
  phases: number;
}

export class CalcDemandResponseDto {
  @ApiProperty({
    type: [CargaDiversificadaDto],
    description: 'loads diversificadas por categoría',
  })
  cargas_diversificadas: CargaDiversificadaDto[];

  @ApiProperty({
    type: TotalesDiversificadosDto,
    description: 'Totales diversificados',
  })
  totales_diversificados: TotalesDiversificadosDto;

  @ApiPropertyOptional({ description: 'Observaciones generales del cálculo' })
  observaciones_generales?: string[];

  @ApiPropertyOptional({ description: 'Metadatos del cálculo' })
  metadata?: {
    version: string;
    timestamp: string;
    duracion_calculo_ms: number;
  };
}
