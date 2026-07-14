import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CaidaTensionCircuitoDto {
  @ApiProperty({ description: 'ID del circuit' })
  id_circuito: string;

  @ApiProperty({ description: 'name del circuit' })
  name: string;

  @ApiProperty({ description: 'Corriente del circuit en amperios' })
  current_a: number;

  @ApiProperty({ description: 'Longitud del circuit en metros' })
  length_m: number;

  @ApiProperty({ description: 'Caída de tensión del ramal en voltios' })
  caida_tension_ramal_v: number;

  @ApiProperty({ description: 'Caída de tensión del ramal en porcentaje' })
  caida_tension_ramal_pct: number;

  @ApiProperty({ description: 'Estado del circuit (OK, WARNING, ERROR)' })
  estado: string;

  @ApiPropertyOptional({ description: 'Observaciones del circuit' })
  observaciones?: string[];
}

export class FeederDto {
  @ApiProperty({ description: 'Corriente total del feeder en amperios' })
  corriente_total_a: number;

  @ApiProperty({ description: 'Longitud del feeder en metros' })
  length_m: number;

  @ApiProperty({ description: 'material del conductor seleccionado' })
  material: string;

  @ApiProperty({ description: 'Sección del conductor en mm²' })
  section_mm2: number;

  @ApiProperty({ description: 'Resistencia por km en Ohm/km' })
  resistencia_ohm_km: number;

  @ApiProperty({ description: 'Caída de tensión del feeder en voltios' })
  caida_tension_alimentador_v: number;

  @ApiProperty({
    description: 'Caída de tensión del feeder en porcentaje',
  })
  caida_tension_alimentador_pct: number;

  @ApiProperty({
    description: 'Caída de tensión total máxima del system en porcentaje',
  })
  caida_tension_total_max_pct: number;

  @ApiProperty({ description: 'Longitud crítica máxima en metros' })
  longitud_critica_m: number;

  @ApiProperty({ description: 'Estado del feeder (OK, WARNING, ERROR)' })
  estado: string;

  @ApiPropertyOptional({ description: 'Observaciones del feeder' })
  observaciones?: string[];
}

export class ResumenCaidaTensionDto {
  @ApiProperty({ description: 'Tensión nominal del system en voltios' })
  tension_nominal_v: number;

  @ApiProperty({ description: 'Número de fases del system' })
  phases: number;

  @ApiProperty({ description: 'Límite de caída en ramal en porcentaje' })
  limite_caida_ramal_pct: number;

  @ApiProperty({ description: 'Límite de caída total en porcentaje' })
  limite_caida_total_pct: number;

  @ApiProperty({ description: 'Caída total máxima encontrada en porcentaje' })
  caida_total_maxima_pct: number;

  @ApiProperty({ description: 'Número de circuits que superan límites' })
  circuitos_fuera_limite: number;

  @ApiProperty({ description: 'Estado general del system' })
  estado_general: string;

  @ApiProperty({
    description: 'Calibre mínimo recomendado para el feeder (mm²)',
  })
  calibre_minimo_recomendado_mm2: number;
}

export class CalcFeederResponseDto {
  @ApiProperty({
    type: [CaidaTensionCircuitoDto],
    description: 'Análisis de caída de tensión por circuit',
  })
  circuitos_analisis: CaidaTensionCircuitoDto[];

  @ApiProperty({
    type: FeederDto,
    description: 'Análisis del feeder principal',
  })
  feeder: FeederDto;

  @ApiProperty({
    type: ResumenCaidaTensionDto,
    description: 'Resumen del análisis de caída de tensión',
  })
  resumen: ResumenCaidaTensionDto;

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
