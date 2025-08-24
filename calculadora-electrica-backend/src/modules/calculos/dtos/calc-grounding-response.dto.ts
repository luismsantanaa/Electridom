import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ConductorProteccionDto {
  @ApiProperty({ description: 'Tipo de conductor (EGC, GEC)' })
  tipo: string;

  @ApiProperty({ description: 'Sección del conductor en mm²' })
  seccion_mm2: number;

  @ApiProperty({ description: 'Calibre AWG equivalente' })
  calibre_awg: string;

  @ApiProperty({ description: 'Material recomendado' })
  material: string;

  @ApiProperty({ description: 'Longitud mínima requerida en metros' })
  longitud_minima_m: number;

  @ApiPropertyOptional({ description: 'Observaciones del conductor' })
  observaciones?: string[];
}

export class SistemaTierraDto {
  @ApiProperty({ description: 'Tipo de sistema de tierra' })
  tipo_sistema: string;

  @ApiProperty({ description: 'Resistencia máxima permitida en Ohm' })
  resistencia_maxima_ohm: number;

  @ApiProperty({ description: 'Número de electrodos requeridos' })
  numero_electrodos: number;

  @ApiProperty({ description: 'Tipo de electrodo recomendado' })
  tipo_electrodo: string;

  @ApiProperty({ description: 'Longitud mínima del electrodo en metros' })
  longitud_electrodo_m: number;

  @ApiProperty({ description: 'Separación mínima entre electrodos en metros' })
  separacion_electrodos_m: number;

  @ApiPropertyOptional({ description: 'Observaciones del sistema' })
  observaciones?: string[];
}

export class ResumenGroundingDto {
  @ApiProperty({ description: 'Amperaje del breaker principal' })
  main_breaker_amp: number;

  @ApiProperty({ description: 'Tipo de instalación' })
  tipo_instalacion: string;

  @ApiProperty({ description: 'Tipo de sistema de tierra' })
  tipo_sistema_tierra: string;

  @ApiProperty({ description: 'Conductor de protección (EGC) en mm²' })
  egc_mm2: number;

  @ApiProperty({ description: 'Conductor de tierra (GEC) en mm²' })
  gec_mm2: number;

  @ApiProperty({ description: 'Resistencia máxima del sistema en Ohm' })
  resistencia_maxima_ohm: number;

  @ApiProperty({ description: 'Estado del sistema de tierra' })
  estado: string;

  @ApiProperty({ description: 'Cumplimiento de normas' })
  cumplimiento_normas: string;
}

export class CalcGroundingResponseDto {
  @ApiProperty({
    type: ConductorProteccionDto,
    description: 'Especificaciones del conductor de protección (EGC)',
  })
  conductor_proteccion: ConductorProteccionDto;

  @ApiProperty({
    type: ConductorProteccionDto,
    description: 'Especificaciones del conductor de tierra (GEC)',
  })
  conductor_tierra: ConductorProteccionDto;

  @ApiProperty({
    type: SistemaTierraDto,
    description: 'Configuración del sistema de puesta a tierra',
  })
  sistema_tierra: SistemaTierraDto;

  @ApiProperty({
    type: ResumenGroundingDto,
    description: 'Resumen del sistema de puesta a tierra',
  })
  resumen: ResumenGroundingDto;

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
