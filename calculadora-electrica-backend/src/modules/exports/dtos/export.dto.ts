import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsDateString,
  IsUUID,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum ExportType {
  PDF = 'PDF',
  EXCEL = 'EXCEL',
  JSON = 'JSON',
}

export enum ExportStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

// DTO para listar exportaciones
export class ListExportsQueryDto {
  @ApiProperty({
    example: 1,
    description: 'Número de página',
    required: false,
    default: 1,
  })
  @IsOptional()
  page?: number = 1;

  @ApiProperty({
    example: 10,
    description: 'Tamaño de página',
    required: false,
    default: 10,
  })
  @IsOptional()
  pageSize?: number = 10;
}

// DTO para respuesta de exportación
export class ExportResponseDto {
  @ApiProperty({ example: 'uuid' })
  id: string;

  @ApiProperty({ example: 'uuid' })
  projectId: string;

  @ApiProperty({ example: 'Residencia García' })
  projectName: string;

  @ApiProperty({ enum: ExportType, example: 'PDF' })
  type: ExportType;

  @ApiProperty({ example: 'Cálculo completo con planos' })
  scope: string;

  @ApiProperty({ enum: ExportStatus, example: 'COMPLETED' })
  status: ExportStatus;

  @ApiProperty({ example: '2025-01-15T10:30:00Z' })
  createdAt: string;

  @ApiProperty({ example: '2025-01-15T10:35:00Z', required: false })
  completedAt?: string;

  @ApiProperty({ example: 'residencia-garcia-calculo.pdf', required: false })
  filename?: string;

  @ApiProperty({ example: 1024000, required: false })
  fileSize?: number;
}

// DTO para respuesta paginada de exportaciones
export class ExportListResponseDto {
  @ApiProperty({ type: [ExportResponseDto] })
  data: ExportResponseDto[];

  @ApiProperty({ example: 50 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  pageSize: number;

  @ApiProperty({ example: 5 })
  totalPages: number;
}

// DTO para crear exportación
export class CreateExportDto {
  @ApiProperty({ example: 'uuid' })
  @IsUUID()
  @IsNotEmpty()
  projectId: string;

  @ApiProperty({ example: 'Residencia García', required: false })
  @IsOptional()
  @IsString()
  projectName?: string;

  @ApiProperty({ enum: ExportType, example: 'PDF' })
  @IsEnum(ExportType)
  @IsNotEmpty()
  type: ExportType;

  @ApiProperty({ example: 'Cálculo completo con planos' })
  @IsString()
  @IsNotEmpty()
  scope: string;
}
