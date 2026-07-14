import { IsString, IsOptional, IsNumber, IsPositive, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCargaDto {
  @ApiProperty({ description: 'ID del ambiente', example: 1 })
  @IsNumber()
  ambiente_id: number;

  @ApiProperty({ description: 'Nombre de la carga', example: 'Lámpara LED' })
  @IsString()
  nombre: string;

  @ApiProperty({ 
    description: 'Potencia en vatios', 
    example: 15,
    minimum: 1
  })
  @IsNumber()
  @IsPositive()
  potencia_w: number;

  @ApiProperty({ 
    description: 'Tipo de carga', 
    enum: ['IUG', 'TUG', 'IUE', 'TUE'],
    example: 'IUG'
  })
  @IsIn(['IUG', 'TUG', 'IUE', 'TUE'])
  tipo: string;

  @ApiPropertyOptional({ 
    description: 'Factor de uso de la carga', 
    example: 0.8,
    minimum: 0,
    maximum: 1
  })
  @IsOptional()
  @IsNumber()
  factor_uso?: number;

  @ApiPropertyOptional({ 
    description: 'Factor de demanda', 
    example: 0.7,
    minimum: 0,
    maximum: 1
  })
  @IsOptional()
  @IsNumber()
  factor_demanda?: number;

  @ApiPropertyOptional({ description: 'Descripción de la carga' })
  @IsOptional()
  @IsString()
  descripcion?: string;

  @ApiPropertyOptional({ description: 'Marca del equipo' })
  @IsOptional()
  @IsString()
  marca?: string;

  @ApiPropertyOptional({ description: 'Modelo del equipo' })
  @IsOptional()
  @IsString()
  modelo?: string;
}
