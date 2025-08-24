import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CargaEnCircuitoDto {
  @ApiProperty({ description: 'Categoría de la carga' })
  categoria: string;

  @ApiProperty({ description: 'Carga en VA' })
  carga_va: number;

  @ApiProperty({ description: 'Corriente en amperios' })
  corriente_a: number;

  @ApiPropertyOptional({ description: 'Descripción de la carga' })
  descripcion?: string;

  @ApiPropertyOptional({ description: 'Ambiente donde se ubica' })
  ambiente?: string;
}

export class ConductorDto {
  @ApiProperty({ description: 'Calibre AWG del conductor' })
  calibre_awg: number;

  @ApiProperty({ description: 'Sección en mm²' })
  seccion_mm2: number;

  @ApiProperty({ description: 'Material del conductor' })
  material: string;

  @ApiProperty({ description: 'Tipo de aislación' })
  insulation: string;

  @ApiProperty({ description: 'Capacidad de corriente en amperios' })
  ampacity: number;

  @ApiProperty({ description: 'Temperatura de operación' })
  temp_c: number;
}

export class BreakerDto {
  @ApiProperty({ description: 'Capacidad nominal en amperios' })
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
  @ApiProperty({ description: 'Identificador único del circuito' })
  id_circuito: string;

  @ApiProperty({ description: 'Nombre descriptivo del circuito' })
  nombre: string;

  @ApiProperty({
    type: [CargaEnCircuitoDto],
    description: 'Cargas agrupadas en este circuito',
  })
  cargas: CargaEnCircuitoDto[];

  @ApiProperty({ description: 'Carga total del circuito en VA' })
  carga_total_va: number;

  @ApiProperty({ description: 'Corriente total en amperios' })
  corriente_total_a: number;

  @ApiProperty({ type: BreakerDto, description: 'Breaker seleccionado' })
  breaker: BreakerDto;

  @ApiProperty({ type: ConductorDto, description: 'Conductor seleccionado' })
  conductor: ConductorDto;

  @ApiProperty({ description: 'Porcentaje de utilización del circuito' })
  utilizacion_pct: number;

  @ApiProperty({
    description: 'Margen de seguridad aplicado (125% si corresponde)',
  })
  margen_seguridad_pct: number;

  @ApiProperty({ description: 'Tensión del circuito' })
  tension_v: number;

  @ApiProperty({ description: 'Número de fases del circuito' })
  phases: number;

  @ApiPropertyOptional({ description: 'Observaciones del circuito' })
  observaciones?: string[];
}

export class ResumenCircuitosDto {
  @ApiProperty({ description: 'Número total de circuitos generados' })
  total_circuitos: number;

  @ApiProperty({ description: 'Carga total agrupada en VA' })
  carga_total_va: number;

  @ApiProperty({ description: 'Corriente total en amperios' })
  corriente_total_a: number;

  @ApiProperty({ description: 'Utilización promedio de circuitos' })
  utilizacion_promedio_pct: number;

  @ApiProperty({ description: 'Circuitos monofásicos' })
  circuitos_monofasicos: number;

  @ApiProperty({ description: 'Circuitos trifásicos' })
  circuitos_trifasicos: number;

  @ApiProperty({ description: 'Calibre mínimo usado (AWG)' })
  calibre_minimo_awg: number;

  @ApiProperty({ description: 'Calibre máximo usado (AWG)' })
  calibre_maximo_awg: number;
}

export class CalcCircuitsResponseDto {
  @ApiProperty({
    type: [CircuitoRamalDto],
    description: 'Circuitos ramales generados',
  })
  circuitos_ramales: CircuitoRamalDto[];

  @ApiProperty({
    type: ResumenCircuitosDto,
    description: 'Resumen de los circuitos',
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
