import { IsString, IsOptional, IsNumber, IsPositive, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAmbienteDto {
  @ApiProperty({ description: 'ID del proyecto', example: 1 })
  @IsNumber()
  proyecto_id: number;

  @ApiProperty({ description: 'Nombre del ambiente', example: 'Sala de estar' })
  @IsString()
  nombre: string;

  @ApiPropertyOptional({ 
    description: 'Superficie en metros cuadrados', 
    example: 25.5,
    minimum: 0
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  superficie_m2?: number;

  @ApiPropertyOptional({ 
    description: 'Nivel del ambiente', 
    example: 'Planta baja',
    examples: ['Planta baja', 'Primer piso', 'Segundo piso']
  })
  @IsOptional()
  @IsString()
  nivel?: string;

  @ApiPropertyOptional({ 
    description: 'Tipo de ambiente', 
    example: 'sala',
    examples: ['sala', 'cocina', 'dormitorio', 'baño', 'oficina']
  })
  @IsOptional()
  @IsString()
  tipo?: string;

  @ApiPropertyOptional({ description: 'Descripción del ambiente' })
  @IsOptional()
  @IsString()
  descripcion?: string;
}
