import { Injectable } from '@nestjs/common';
import {
  ListNormativesQueryDto,
  NormativeListResponseDto,
  NormativeResponseDto,
} from './dtos/normative.dto';
import { ProjectSource } from '../projects/dtos/project-crud.dto';

@Injectable()
export class NormativesService {
  // Datos mock para Sprint 9 - en producción vendría de una base de datos
  private readonly mockNormatives: NormativeResponseDto[] = [
    {
      id: '1',
      code: 'NEC-210.52',
      description: 'Receptáculos en cocinas',
      source: ProjectSource.NEC,
      lastUpdated: '2025-01-15T10:30:00Z',
      content:
        'Sección que regula la instalación de receptáculos en cocinas residenciales',
    },
    {
      id: '2',
      code: 'NEC-210.11',
      description: 'Circuitos ramales',
      source: ProjectSource.NEC,
      lastUpdated: '2025-01-15T10:30:00Z',
      content:
        'Requisitos para circuitos ramales en instalaciones residenciales',
    },
    {
      id: '3',
      code: 'RIE-Art.30',
      description: 'Instalaciones de baja tensión',
      source: ProjectSource.RIE,
      lastUpdated: '2025-01-15T10:30:00Z',
      content:
        'Artículo que regula las instalaciones de baja tensión en República Dominicana',
    },
    {
      id: '4',
      code: 'REBT-ITC-BT-25',
      description: 'Instalaciones interiores',
      source: ProjectSource.REBT,
      lastUpdated: '2025-01-15T10:30:00Z',
      content:
        'Instrucción técnica complementaria para instalaciones interiores',
    },
    {
      id: '5',
      code: 'NEC-220.12',
      description: 'Cargas de iluminación',
      source: ProjectSource.NEC,
      lastUpdated: '2025-01-15T10:30:00Z',
      content: 'Cálculo de cargas de iluminación en instalaciones',
    },
    {
      id: '6',
      code: 'RIE-Art.45',
      description: 'Protecciones eléctricas',
      source: ProjectSource.RIE,
      lastUpdated: '2025-01-15T10:30:00Z',
      content: 'Artículo sobre protecciones eléctricas obligatorias',
    },
    {
      id: '7',
      code: 'REBT-ITC-BT-28',
      description: 'Instalaciones en locales de pública concurrencia',
      source: ProjectSource.REBT,
      lastUpdated: '2025-01-15T10:30:00Z',
      content:
        'Instrucción para instalaciones en locales de pública concurrencia',
    },
    {
      id: '8',
      code: 'NEC-310.15',
      description: 'Capacidad de corriente de conductores',
      source: ProjectSource.NEC,
      lastUpdated: '2025-01-15T10:30:00Z',
      content: 'Tablas y factores para determinar la capacidad de corriente',
    },
    {
      id: '9',
      code: 'RIE-Art.60',
      description: 'Puesta a tierra',
      source: ProjectSource.RIE,
      lastUpdated: '2025-01-15T10:30:00Z',
      content: 'Requisitos para sistemas de puesta a tierra',
    },
    {
      id: '10',
      code: 'REBT-ITC-BT-19',
      description: 'Instalaciones de enlace',
      source: ProjectSource.REBT,
      lastUpdated: '2025-01-15T10:30:00Z',
      content:
        'Instrucción para instalaciones de enlace con la red de distribución',
    },
  ];

  async listNormatives(
    query: ListNormativesQueryDto,
  ): Promise<NormativeListResponseDto> {
    const { page = 1, pageSize = 10, q, source } = query;

    // Filtrar normativas
    let filteredNormatives = this.mockNormatives;

    // Filtrar por fuente
    if (source) {
      filteredNormatives = filteredNormatives.filter(
        (n) => n.source === source,
      );
    }

    // Filtrar por término de búsqueda
    if (q) {
      const searchTerm = q.toLowerCase();
      filteredNormatives = filteredNormatives.filter(
        (n) =>
          n.code.toLowerCase().includes(searchTerm) ||
          n.description.toLowerCase().includes(searchTerm) ||
          n.content.toLowerCase().includes(searchTerm),
      );
    }

    // Calcular paginación
    const total = filteredNormatives.length;
    const totalPages = Math.ceil(total / pageSize);
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const data = filteredNormatives.slice(startIndex, endIndex);

    return {
      data,
      total,
      page,
      pageSize,
      totalPages,
    };
  }
}
