import { ApiProperty } from '@nestjs/swagger';

export class CargaPorAmbienteDto {
  @ApiProperty({
    description: 'name del environment',
    example: 'Sala',
  })
  environment: string;

  @ApiProperty({
    description: 'load de iluminación en VA',
    example: 1850,
  })
  iluminacionVA: number;

  @ApiProperty({
    description: 'load de tomacorrientes en VA',
    example: 1200,
  })
  tomasVA: number;

  @ApiProperty({
    description: 'load de artefactos fijos en VA',
    example: 120,
  })
  cargasFijasVA: number;

  @ApiProperty({
    description: 'load total del environment en VA',
    example: 3170,
  })
  totalVA: number;
}

export class TotalesDto {
  @ApiProperty({
    description: 'load conectada total en VA',
    example: 8120,
  })
  totalConectadaVA: number;

  @ApiProperty({
    description: 'Demanda estimada en VA',
    example: 6120,
  })
  demandaEstimadaVA: number;
}

export class PropuestaCircuitoDto {
  @ApiProperty({
    description: 'type de circuit',
    example: 'ILU',
    enum: ['ILU', 'TOM'],
  })
  type: 'ILU' | 'TOM';

  @ApiProperty({
    description: 'load asignada al circuit en VA',
    example: 3200,
  })
  cargaAsignadaVA: number;

  @ApiProperty({
    description: 'environments incluidos en el circuit',
    example: ['Sala', 'Dormitorio 1'],
    type: [String],
  })
  ambientesIncluidos: string[];

  @ApiProperty({
    description: 'breaker sugerido',
    example: '15A // TODO validar RIE RD',
  })
  breakerSugerido: string;

  @ApiProperty({
    description: 'Calibre sugerido',
    example: 'AWG 14 // TODO validar RIE RD',
  })
  calibreSugerido: string;
}

export class PreviewResponseDto {
  @ApiProperty({
    description: 'loads calculadas por environment',
    type: [CargaPorAmbienteDto],
  })
  cargasPorAmbiente: CargaPorAmbienteDto[];

  @ApiProperty({
    description: 'Totales del cálculo',
    type: TotalesDto,
  })
  totales: TotalesDto;

  @ApiProperty({
    description: 'Propuesta de circuits',
    type: [PropuestaCircuitoDto],
  })
  propuestaCircuitos: PropuestaCircuitoDto[];

  @ApiProperty({
    description: 'Advertencias del cálculo',
    example: ['rule LUZ_VA_POR_M2 usa value por defecto. TODO validar con RIE RD.'],
    type: [String],
  })
  warnings: string[];

  @ApiProperty({
    description: 'ID de trazabilidad',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  traceId: string;
}

