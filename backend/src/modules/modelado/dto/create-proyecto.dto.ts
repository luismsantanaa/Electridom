import { IsString, IsOptional, IsNumber, IsIn, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProyectoDto {
  @ApiProperty({ description: 'Nombre del proyecto', example: 'Casa Residencial San Juan' })
  @IsString()
  nombre: string;

  @ApiPropertyOptional({ description: 'Descripción del proyecto' })
  @IsOptional()
  @IsString()
  descripcion?: string;

  @ApiPropertyOptional({ 
    description: 'Tipo de instalación', 
    enum: ['residencial', 'comercial', 'industrial'],
    example: 'residencial'
  })
  @IsOptional()
  @IsIn(['residencial', 'comercial', 'industrial'])
  tipo_instalacion?: string;

  @ApiPropertyOptional({ 
    description: 'Tensión del sistema', 
    example: '120V',
    examples: ['120V', '208V', '480V']
  })
  @IsOptional()
  @IsString()
  tension_sistema?: string;

  @ApiPropertyOptional({ 
    description: 'Número de fases', 
    example: 1,
    minimum: 1,
    maximum: 3
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(3)
  fases?: number;

  @ApiPropertyOptional({ 
    description: 'Factor de potencia', 
    example: 0.9,
    minimum: 0.8,
    maximum: 1.0
  })
  @IsOptional()
  @IsNumber()
  @Min(0.8)
  @Max(1.0)
  factor_potencia?: number;
}
