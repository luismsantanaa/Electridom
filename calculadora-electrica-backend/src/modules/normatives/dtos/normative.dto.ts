import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsDateString,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ProjectSource } from '../../projects/dtos/project-crud.dto';

// DTO para listar normativas
export class ListNormativesQueryDto {
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

  @ApiProperty({
    example: 'conductor',
    description: 'Término de búsqueda',
    required: false,
  })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiProperty({
    enum: ProjectSource,
    example: 'RIE',
    description: 'Fuente de la normativa',
    required: false,
  })
  @IsOptional()
  @IsEnum(ProjectSource)
  source?: ProjectSource;
}

// DTO para respuesta de normativa
export class NormativeResponseDto {
  @ApiProperty({ example: 'uuid' })
  id: string;

  @ApiProperty({ example: 'NEC-210.52' })
  code: string;

  @ApiProperty({ example: 'Receptáculos en cocinas' })
  description: string;

  @ApiProperty({ enum: ProjectSource, example: 'NEC' })
  source: ProjectSource;

  @ApiProperty({ example: '2025-01-15T10:30:00Z' })
  lastUpdated: string;

  @ApiProperty({
    example:
      'Sección que regula la instalación de receptáculos en cocinas residenciales',
  })
  content: string;
}

// DTO para respuesta paginada de normativas
export class NormativeListResponseDto {
  @ApiProperty({ type: [NormativeResponseDto] })
  data: NormativeResponseDto[];

  @ApiProperty({ example: 100 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  pageSize: number;

  @ApiProperty({ example: 10 })
  totalPages: number;
}
