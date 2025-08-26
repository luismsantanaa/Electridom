import { IsObject, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AnalyzeRequestDto {
  @ApiProperty({
    description: 'Input original del cálculo',
    example: {
      system: { voltage: 120, phases: 1, frequency: 60 },
      superficies: [{ name: 'Sala', area: 25, type: 'residencial' }],
      consumos: [{ name: 'TV', power: 100, quantity: 1, type: 'iluminacion' }]
    }
  })
  @IsObject()
  input: any;

  @ApiProperty({
    description: 'Output del cálculo realizado',
    example: {
      rooms: { totalArea: 25, totalLoads: 1 },
      demand: { totalDemand: 100, demandFactor: 1.0 },
      circuits: { totalCircuits: 1, maxLoadPerCircuit: 100 }
    }
  })
  @IsObject()
  output: any;

  @ApiProperty({
    description: 'Pregunta específica del usuario (opcional)',
    example: '¿Por qué el alimentador recomendado es #6 AWG?',
    required: false
  })
  @IsOptional()
  @IsString()
  question?: string;
}
