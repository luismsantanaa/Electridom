import { ApiProperty } from '@nestjs/swagger';

// DTO para resumen de proyecto
export class ProjectSummaryDto {
  @ApiProperty({ example: 'uuid', description: 'ID único del proyecto' })
  projectId: string;

  @ApiProperty({
    example: 'Residencia García',
    description: 'Nombre del proyecto',
  })
  projectName: string;

  @ApiProperty({
    enum: ['ACTIVE', 'ARCHIVED'],
    example: 'ACTIVE',
    description: 'Estado del proyecto',
  })
  status: 'ACTIVE' | 'ARCHIVED';

  @ApiProperty({
    example: '2025-08-19T18:00:00Z',
    description: 'Fecha de creación',
  })
  createdAt: string;

  @ApiProperty({
    example: '2025-08-19T18:00:00Z',
    description: 'Fecha de última actualización',
  })
  updatedAt: string;

  @ApiProperty({
    description: 'Información de la última versión',
    required: false
  })
  latestVersion?: {
    versionId: string;
    versionNumber: number;
    createdAt: string;
    rulesSignature: string;
    totales?: {
      totalConectadaVA: number;
      demandaEstimadaVA: number;
    };
  };
}

// DTO para detalle completo de versión
export class ProjectVersionDetailDto {
  @ApiProperty({ example: 'uuid', description: 'ID del proyecto' })
  projectId: string;

  @ApiProperty({ example: 'uuid', description: 'ID de la versión' })
  versionId: string;

  @ApiProperty({ example: 2, description: 'Número de versión' })
  versionNumber: number;

  @ApiProperty({
    example: '2025-08-19T18:25:00Z',
    description: 'Fecha de creación de la versión',
  })
  createdAt: string;

  @ApiProperty({
    description: 'Datos de entrada de la versión',
    type: 'object',
    properties: {
      superficies: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            ambiente: { type: 'string', example: 'Sala' },
            areaM2: { type: 'number', example: 18.5 },
          },
        },
      },
      consumos: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            nombre: { type: 'string', example: 'Televisor' },
            ambiente: { type: 'string', example: 'Sala' },
            watts: { type: 'number', example: 120 },
          },
        },
      },
      opciones: {
        type: 'object',
        properties: {
          tensionV: { type: 'number', example: 120 },
          monofasico: { type: 'boolean', example: true },
        },
      },
    },
  })
  input: {
    superficies: any[];
    consumos: any[];
    opciones?: any;
  };

  @ApiProperty({
    description: 'Resultados del cálculo',
    type: 'object',
    properties: {
      cargasPorAmbiente: { type: 'array' },
      totales: {
        type: 'object',
        properties: {
          totalConectadaVA: { type: 'number', example: 8120 },
          demandaEstimadaVA: { type: 'number', example: 6120 },
        },
      },
      propuestaCircuitos: { type: 'array' },
      warnings: {
        type: 'array',
        items: { type: 'string' },
        example: ['Reglas cambiaron respecto a la versión 1'],
      },
    },
  })
  output: {
    cargasPorAmbiente: any[];
    totales: any;
    propuestaCircuitos: any[];
    warnings: string[];
  };

  @ApiProperty({
    example: 'sha256:...',
    description: 'Firma de las reglas utilizadas',
  })
  rulesSignature: string;

  @ApiProperty({
    example: true,
    description: 'Si las reglas cambiaron respecto a la versión anterior',
  })
  rulesChangedFromPrevious: boolean;

  @ApiProperty({
    example: 'Ajuste de consumos cocina',
    description: 'Nota de la versión',
    required: false,
  })
  note?: string;

  @ApiProperty({ example: 'trace-id', description: 'ID de trazabilidad' })
  traceId: string;
}

// DTO para listado de proyectos
export class ProjectListResponseDto {
  @ApiProperty({ type: [ProjectSummaryDto], description: 'Lista de proyectos' })
  data: ProjectSummaryDto[];

  @ApiProperty({ example: 1, description: 'Página actual' })
  page: number;

  @ApiProperty({ example: 20, description: 'Tamaño de página' })
  pageSize: number;

  @ApiProperty({ example: 100, description: 'Total de proyectos' })
  total: number;

  @ApiProperty({ example: 5, description: 'Total de páginas' })
  totalPages: number;
}

// DTO para exportar proyecto completo
export class ProjectExportDto {
  @ApiProperty({ description: 'Datos del proyecto' })
  project: ProjectSummaryDto;

  @ApiProperty({
    type: [ProjectVersionDetailDto],
    description: 'Todas las versiones del proyecto',
  })
  versions: ProjectVersionDetailDto[];
}
