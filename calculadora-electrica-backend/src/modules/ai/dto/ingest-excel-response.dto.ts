import { ApiProperty } from '@nestjs/swagger';

export class IngestExcelResponseDto {
  @ApiProperty({
    description: 'Indica si la ingesta fue exitosa',
    example: true
  })
  success: boolean;

  @ApiProperty({
    description: 'Datos normalizados del archivo Excel',
    example: {
      system: { voltage: 120, phases: 1, frequency: 60 },
      superficies: [{ name: 'Sala', area: 25, type: 'residencial' }],
      consumos: [{ name: 'TV', power: 100, quantity: 1, type: 'iluminacion' }]
    }
  })
  data: any;

  @ApiProperty({
    description: 'Mensaje descriptivo del resultado',
    example: 'Archivo Excel procesado exitosamente'
  })
  message: string;

  @ApiProperty({
    description: 'Errores encontrados durante el procesamiento',
    example: ['Fila 5: Campo "power" debe ser numérico'],
    required: false
  })
  errors?: string[];

  @ApiProperty({
    description: 'Número de filas procesadas',
    example: 10
  })
  rowsProcessed: number;

  @ApiProperty({
    description: 'Número de filas con errores',
    example: 2
  })
  rowsWithErrors: number;
}
