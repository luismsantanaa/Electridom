import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ReportMetadataDto {
  @ApiProperty({ description: 'Hash MD5 del archivo PDF' })
  pdfHash: string;

  @ApiProperty({ description: 'Hash MD5 del archivo Excel' })
  excelHash: string;

  @ApiProperty({ description: 'Fecha de generación del reporte' })
  calculationDate: string;

  @ApiProperty({ description: 'Versión de norms utilizadas' })
  normsVersion: string;

  @ApiProperty({ description: 'Hash de las semillas de norms' })
  normsHash: string;

  @ApiProperty({ description: 'Versión del system' })
  systemVersion: string;

  @ApiProperty({ description: 'type de instalación' })
  installationType: string;

  @ApiProperty({ description: 'system eléctrico' })
  electricalSystem: string;

  @ApiProperty({ description: 'Corriente total del system' })
  totalCurrent: number;

  @ApiProperty({ description: 'load total del system' })
  totalLoad: number;

  @ApiProperty({ description: 'Número de circuits' })
  circuitCount: number;

  @ApiProperty({ description: 'Estado general del system' })
  generalStatus: string;

  @ApiProperty({ description: 'Observaciones del reporte' })
  observations: string[];
}

export class CalcReportResponseDto {
  @ApiProperty({
    description: 'Archivo PDF como base64',
    example: 'JVBERi0xLjQKJcOkw7zDtsO...',
  })
  pdfBase64: string;

  @ApiProperty({
    description: 'Archivo Excel como base64',
    example: 'UEsDBBQAAAAIAA...',
  })
  excelBase64: string;

  @ApiProperty({
    description: 'Metadatos del reporte',
    type: ReportMetadataDto,
  })
  metadata: ReportMetadataDto;

  @ApiPropertyOptional({
    description: 'Mensaje de éxito',
    example: 'Reporte generado exitosamente',
  })
  message?: string;
}

