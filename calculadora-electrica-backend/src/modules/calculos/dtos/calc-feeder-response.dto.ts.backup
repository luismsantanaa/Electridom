import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CaidaTensionCircuitoDto {
  @ApiProperty({ description: 'ID del circuito' })
  id_circuito: string;

  @ApiProperty({ description: 'Nombre del circuito' })
  nombre: string;

  @ApiProperty({ description: 'Corriente del circuito en amperios' })
  corriente_a: number;

  @ApiProperty({ description: 'Longitud del circuito en metros' })
  longitud_m: number;

  @ApiProperty({ description: 'Caída de tensión del ramal en voltios' })
  caida_tension_ramal_v: number;

  @ApiProperty({ description: 'Caída de tensión del ramal en porcentaje' })
  caida_tension_ramal_pct: number;

  @ApiProperty({ description: 'Estado del circuito (OK, WARNING, ERROR)' })
  estado: string;

  @ApiPropertyOptional({ description: 'Observaciones del circuito' })
  observaciones?: string[];
}

export class AlimentadorDto {
  @ApiProperty({ description: 'Corriente total del alimentador en amperios' })
  corriente_total_a: number;

  @ApiProperty({ description: 'Longitud del alimentador en metros' })
  longitud_m: number;

  @ApiProperty({ description: 'Material del conductor seleccionado' })
  material: string;

  @ApiProperty({ description: 'Sección del conductor en mm²' })
  seccion_mm2: number;

  @ApiProperty({ description: 'Resistencia por km en Ohm/km' })
  resistencia_ohm_km: number;

  @ApiProperty({ description: 'Caída de tensión del alimentador en voltios' })
  caida_tension_alimentador_v: number;

  @ApiProperty({
    description: 'Caída de tensión del alimentador en porcentaje',
  })
  caida_tension_alimentador_pct: number;

  @ApiProperty({
    description: 'Caída de tensión total máxima del sistema en porcentaje',
  })
  caida_tension_total_max_pct: number;

  @ApiProperty({ description: 'Longitud crítica máxima en metros' })
  longitud_critica_m: number;

  @ApiProperty({ description: 'Estado del alimentador (OK, WARNING, ERROR)' })
  estado: string;

  @ApiPropertyOptional({ description: 'Observaciones del alimentador' })
  observaciones?: string[];
}

export class ResumenCaidaTensionDto {
  @ApiProperty({ description: 'Tensión nominal del sistema en voltios' })
  tension_nominal_v: number;

  @ApiProperty({ description: 'Número de fases del sistema' })
  phases: number;

  @ApiProperty({ description: 'Límite de caída en ramal en porcentaje' })
  limite_caida_ramal_pct: number;

  @ApiProperty({ description: 'Límite de caída total en porcentaje' })
  limite_caida_total_pct: number;

  @ApiProperty({ description: 'Caída total máxima encontrada en porcentaje' })
  caida_total_maxima_pct: number;

  @ApiProperty({ description: 'Número de circuitos que superan límites' })
  circuitos_fuera_limite: number;

  @ApiProperty({ description: 'Estado general del sistema' })
  estado_general: string;

  @ApiProperty({
    description: 'Calibre mínimo recomendado para el alimentador (mm²)',
  })
  calibre_minimo_recomendado_mm2: number;
}

export class CalcFeederResponseDto {
  @ApiProperty({
    type: [CaidaTensionCircuitoDto],
    description: 'Análisis de caída de tensión por circuito',
  })
  circuitos_analisis: CaidaTensionCircuitoDto[];

  @ApiProperty({
    type: AlimentadorDto,
    description: 'Análisis del alimentador principal',
  })
  alimentador: AlimentadorDto;

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
