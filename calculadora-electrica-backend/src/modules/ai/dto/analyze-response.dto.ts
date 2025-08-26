import { ApiProperty } from '@nestjs/swagger';

export class RecommendationDto {
  @ApiProperty({
    description: 'Título de la recomendación',
    example: 'Optimización del alimentador'
  })
  title: string;

  @ApiProperty({
    description: 'Descripción detallada de la recomendación',
    example: 'Considerar usar un alimentador #4 AWG para mayor margen de seguridad'
  })
  description: string;

  @ApiProperty({
    description: 'Prioridad de la recomendación (high, medium, low)',
    example: 'medium'
  })
  priority: 'high' | 'medium' | 'low';

  @ApiProperty({
    description: 'Categoría de la recomendación',
    example: 'safety'
  })
  category: string;
}

export class AnalyzeResponseDto {
  @ApiProperty({
    description: 'Resumen del análisis realizado',
    example: 'El cálculo muestra una instalación residencial básica con 1 circuito y demanda de 100W'
  })
  summary: string;

  @ApiProperty({
    description: 'Lista de recomendaciones',
    type: [RecommendationDto]
  })
  recommendations: RecommendationDto[];

  @ApiProperty({
    description: 'Tokens utilizados en la consulta',
    example: 150
  })
  tokensUsed: number;

  @ApiProperty({
    description: 'Tiempo de respuesta en milisegundos',
    example: 2500
  })
  responseTime: number;
}
