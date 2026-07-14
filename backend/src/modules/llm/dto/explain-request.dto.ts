import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber } from 'class-validator';

export class ExplainRequestDto {
  @ApiProperty({
    description: 'Pregunta o tema a explicar',
    example:
      '¿Cómo se calcula la demanda eléctrica en una vivienda residencial?',
  })
  @IsString()
  question: string;

  @ApiProperty({ description: 'Contexto adicional', required: false })
  @IsOptional()
  @IsString()
  context?: string;

  @ApiProperty({ description: 'Modelo de LLM a usar', required: false })
  @IsOptional()
  @IsString()
  model?: string;

  @ApiProperty({
    description: 'Temperatura para la generación',
    required: false,
    default: 0.7,
  })
  @IsOptional()
  @IsNumber()
  temperature?: number;
}
