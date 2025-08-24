import { ApiProperty } from '@nestjs/swagger';

export class CargaPorAmbienteDto {
  @ApiProperty({
    description: 'Nombre del ambiente',
    example: 'Sala',
  })
  ambiente: string;

  @ApiProperty({
    description: 'Carga de iluminación en VA',
    example: 1850,
  })
  iluminacionVA: number;

  @ApiProperty({
    description: 'Carga de tomacorrientes en VA',
    example: 1200,
  })
  tomasVA: number;

  @ApiProperty({
    description: 'Carga de artefactos fijos en VA',
    example: 120,
  })
  cargasFijasVA: number;

  @ApiProperty({
    description: 'Carga total del ambiente en VA',
    example: 3170,
  })
  totalVA: number;
}

export class TotalesDto {
  @ApiProperty({
    description: 'Carga conectada total en VA',
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
    description: 'Tipo de circuito',
    example: 'ILU',
    enum: ['ILU', 'TOM'],
  })
  tipo: 'ILU' | 'TOM';

  @ApiProperty({
    description: 'Carga asignada al circuito en VA',
    example: 3200,
  })
  cargaAsignadaVA: number;

  @ApiProperty({
    description: 'Ambientes incluidos en el circuito',
    example: ['Sala', 'Dormitorio 1'],
    type: [String],
  })
  ambientesIncluidos: string[];

  @ApiProperty({
    description: 'Breaker sugerido',
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
    description: 'Cargas calculadas por ambiente',
    type: [CargaPorAmbienteDto],
  })
  cargasPorAmbiente: CargaPorAmbienteDto[];

  @ApiProperty({
    description: 'Totales del cálculo',
    type: TotalesDto,
  })
  totales: TotalesDto;

  @ApiProperty({
    description: 'Propuesta de circuitos',
    type: [PropuestaCircuitoDto],
  })
  propuestaCircuitos: PropuestaCircuitoDto[];

  @ApiProperty({
    description: 'Advertencias del cálculo',
    example: ['Regla LUZ_VA_POR_M2 usa valor por defecto. TODO validar con RIE RD.'],
    type: [String],
  })
  warnings: string[];

  @ApiProperty({
    description: 'ID de trazabilidad',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  traceId: string;
}
