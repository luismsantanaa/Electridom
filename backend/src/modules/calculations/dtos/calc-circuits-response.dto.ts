import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CargaEnCircuitoDto {
  @ApiProperty({ description: 'Categoría de la load' })
  category: string;

  @ApiProperty({ description: 'load en VA' })
  carga_va: number;

  @ApiProperty({ description: 'Corriente en amperios' })
  current_a: number;

  @ApiPropertyOptional({ description: 'Descripción de la load' })
  description?: string;

  @ApiPropertyOptional({ description: 'environment donde se ubica' })
  environment?: string;
}

export class ConductorDto {
  @ApiProperty({ description: 'Calibre AWG del conductor' })
  calibre_awg: number;

  @ApiProperty({ description: 'Sección en mm²' })
  section_mm2: number;

  @ApiProperty({ description: 'material del conductor' })
  material: string;

  @ApiProperty({ description: 'type de aislación' })
  insulation: string;

  @ApiProperty({ description: 'capacity de corriente en amperios' })
  ampacity: number;

  @ApiProperty({ description: 'Temperatura de operación' })
  temp_c: number;
}

export class BreakerDto {
  @ApiProperty({ description: 'capacity nominal en amperios' })
  amp: number;

  @ApiProperty({ description: 'Número de polos' })
  poles: number;

  @ApiProperty({ description: 'Curva de disparo' })
  curve: string;

  @ApiProperty({ description: 'Caso de uso típico' })
  use_case: string;

  @ApiPropertyOptional({ description: 'Notas del breaker' })
  notes?: string;
}

export class CircuitoRamalDto {
  @ApiProperty({ description: 'Identificador único del circuit' })
  id_circuito: string;

  @ApiProperty({ description: 'name descriptivo del circuit' })
  name: string;

  @ApiProperty({
    type: [CargaEnCircuitoDto],
    description: 'loads agrupadas en este circuit',
  })
  loads: CargaEnCircuitoDto[];

  @ApiProperty({ description: 'load total del circuit en VA' })
  carga_total_va: number;

  @ApiProperty({ description: 'Corriente total en amperios' })
  corriente_total_a: number;

  @ApiProperty({ type: BreakerDto, description: 'breaker seleccionado' })
  breaker: BreakerDto;

  @ApiProperty({ type: ConductorDto, description: 'conductor seleccionado' })
  conductor: ConductorDto;

  @ApiProperty({ description: 'Porcentaje de utilización del circuit' })
  utilizacion_pct: number;

  @ApiProperty({
    description: 'Margen de seguridad aplicado (125% si corresponde)',
  })
  margen_seguridad_pct: number;

  @ApiProperty({ description: 'Tensión del circuit' })
  voltage_v: number;

  @ApiProperty({ description: 'Número de fases del circuit' })
  phases: number;

  @ApiPropertyOptional({ description: 'Observaciones del circuit' })
  observaciones?: string[];
}

export class ResumenCircuitosDto {
  @ApiProperty({ description: 'Número total de circuits generados' })
  total_circuitos: number;

  @ApiProperty({ description: 'load total agrupada en VA' })
  carga_total_va: number;

  @ApiProperty({ description: 'Corriente total en amperios' })
  corriente_total_a: number;

  @ApiProperty({ description: 'Utilización promedio de circuits' })
  utilizacion_promedio_pct: number;

  @ApiProperty({ description: 'circuits monofásicos' })
  circuitos_monofasicos: number;

  @ApiProperty({ description: 'circuits trifásicos' })
  circuitos_trifasicos: number;

  @ApiProperty({ description: 'Calibre mínimo usado (AWG)' })
  calibre_minimo_awg: number;

  @ApiProperty({ description: 'Calibre máximo usado (AWG)' })
  calibre_maximo_awg: number;
}

export class CalcCircuitsResponseDto {
  @ApiProperty({
    type: [CircuitoRamalDto],
    description: 'circuits ramales generados',
  })
  circuitos_ramales: CircuitoRamalDto[];

  @ApiProperty({
    type: ResumenCircuitosDto,
    description: 'Resumen de los circuits',
  })
  resumen: ResumenCircuitosDto;

  @ApiPropertyOptional({ description: 'Observaciones generales' })
  observaciones_generales?: string[];

  @ApiPropertyOptional({ description: 'Metadatos del cálculo' })
  metadata?: {
    version: string;
    timestamp: string;
    duracion_calculo_ms: number;
    algoritmo_usado: string;
  };
}
