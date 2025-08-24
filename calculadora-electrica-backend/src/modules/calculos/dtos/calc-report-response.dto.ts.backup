import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ReportMetadataDto {
  @ApiProperty({ description: 'Hash MD5 del archivo PDF' })
  pdfHash: string;

  @ApiProperty({ description: 'Hash MD5 del archivo Excel' })
  excelHash: string;

  @ApiProperty({ description: 'Fecha de generación del reporte' })
  calculationDate: string;

  @ApiProperty({ description: 'Versión de normas utilizadas' })
  normsVersion: string;

  @ApiProperty({ description: 'Hash de las semillas de normas' })
  normsHash: string;

  @ApiProperty({ description: 'Versión del sistema' })
  systemVersion: string;

  @ApiProperty({ description: 'Tipo de instalación' })
  installationType: string;

  @ApiProperty({ description: 'Sistema eléctrico' })
  electricalSystem: string;

  @ApiProperty({ description: 'Corriente total del sistema' })
  totalCurrent: number;

  @ApiProperty({ description: 'Carga total del sistema' })
  totalLoad: number;

  @ApiProperty({ description: 'Número de circuitos' })
  circuitCount: number;

  @ApiProperty({ description: 'Estado general del sistema' })
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
