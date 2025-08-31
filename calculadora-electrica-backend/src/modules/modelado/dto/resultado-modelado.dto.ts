import { ApiProperty } from '@nestjs/swagger';

export class ProteccionDto {
  @ApiProperty({ description: 'ID de la protección' })
  id: number;

  @ApiProperty({ description: 'Tipo de protección', example: 'MCB' })
  tipo: string;

  @ApiProperty({ description: 'Capacidad en amperios', example: 15 })
  capacidad_a: number;

  @ApiProperty({ description: 'Curva de disparo', example: 'C' })
  curva?: string;

  @ApiProperty({ description: 'Marca del breaker' })
  marca?: string;

  @ApiProperty({ description: 'Modelo del breaker' })
  modelo?: string;
}

export class ConductorDto {
  @ApiProperty({ description: 'ID del conductor' })
  id: number;

  @ApiProperty({ description: 'Calibre AWG', example: '14' })
  calibre_awg: string;

  @ApiProperty({ description: 'Material del conductor', example: 'Cu' })
  material: string;

  @ApiProperty({ description: 'Capacidad en amperios', example: 15 })
  capacidad_a: number;

  @ApiProperty({ description: 'Tipo de aislamiento', example: 'THHN' })
  tipo_aislamiento?: string;

  @ApiProperty({ description: 'Longitud en metros' })
  longitud_m?: number;

  @ApiProperty({ description: 'Caída de tensión calculada' })
  caida_tension?: number;
}

export class CircuitoDto {
  @ApiProperty({ description: 'ID del circuito' })
  id: number;

  @ApiProperty({ description: 'ID del ambiente' })
  ambiente_id: number;

  @ApiProperty({ description: 'Tipo de circuito', example: 'IUG' })
  tipo: string;

  @ApiProperty({ description: 'Potencia en VA', example: 1800 })
  potencia_va: number;

  @ApiProperty({ description: 'Corriente en amperios', example: 15.0 })
  corriente_a: number;

  @ApiProperty({ description: 'Nombre del circuito' })
  nombre?: string;

  @ApiProperty({ description: 'Número del circuito' })
  numero_circuito?: number;

  @ApiProperty({ description: 'Observaciones' })
  observaciones?: string;

  @ApiProperty({ type: ProteccionDto, description: 'Protección asignada' })
  proteccion: ProteccionDto;

  @ApiProperty({ type: ConductorDto, description: 'Conductor asignado' })
  conductor: ConductorDto;
}

export class ResultadoModeladoDto {
  @ApiProperty({ description: 'ID del proyecto' })
  proyecto_id: number;

  @ApiProperty({ description: 'Nombre del proyecto' })
  proyecto_nombre: string;

  @ApiProperty({ description: 'Tensión del sistema' })
  tension_sistema: string;

  @ApiProperty({ description: 'Número de fases' })
  fases: number;

  @ApiProperty({ description: 'Factor de potencia' })
  factor_potencia: number;

  @ApiProperty({ type: [CircuitoDto], description: 'Circuitos generados' })
  circuitos: CircuitoDto[];

  @ApiProperty({ description: 'Total de circuitos' })
  total_circuitos: number;

  @ApiProperty({ description: 'Potencia total en VA' })
  potencia_total_va: number;

  @ApiProperty({ description: 'Corriente total en amperios' })
  corriente_total_a: number;

  @ApiProperty({ description: 'Fecha de generación' })
  fecha_generacion: Date;
}
