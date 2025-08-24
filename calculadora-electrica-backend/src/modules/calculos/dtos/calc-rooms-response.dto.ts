import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AmbienteResultDto {
  @ApiProperty({ description: 'Nombre del ambiente' })
  nombre: string;

  @ApiProperty({ description: 'Área en metros cuadrados' })
  area_m2: number;

  @ApiProperty({ description: 'Carga total en VA' })
  carga_va: number;

  @ApiProperty({ description: 'Factor de potencia efectivo' })
  fp: number;

  @ApiPropertyOptional({ description: 'Observaciones del cálculo' })
  observaciones?: string;
}

export class TotalesDto {
  @ApiProperty({ description: 'Carga total en VA' })
  carga_total_va: number;

  @ApiProperty({ description: 'Carga diversificada en VA' })
  carga_diversificada_va: number;

  @ApiProperty({ description: 'Corriente total en amperios' })
  corriente_total_a: number;

  @ApiProperty({ description: 'Tensión del sistema en voltios' })
  tension_v: number;

  @ApiProperty({ description: 'Número de fases' })
  phases: number;
}

export class CalcRoomsResponseDto {
  @ApiProperty({ type: [AmbienteResultDto], description: 'Resultados por ambiente' })
  ambientes: AmbienteResultDto[];

  @ApiProperty({ type: TotalesDto, description: 'Totales del cálculo' })
  totales: TotalesDto;

  @ApiPropertyOptional({ description: 'Circuito ramales (para futuras historias)' })
  circuits?: any[];

  @ApiPropertyOptional({ description: 'Alimentador (para futuras historias)' })
  feeder?: any;

  @ApiPropertyOptional({ description: 'Puesta a tierra (para futuras historias)' })
  grounding?: any;
}
