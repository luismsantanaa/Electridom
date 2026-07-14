import {
  IsNumber,
  IsOptional,
  IsString,
  IsIn,
  IsPositive,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GenerarCircuitosDto {
  @ApiProperty({ description: 'ID del proyecto', example: 1 })
  @IsNumber()
  proyecto_id: number;

  @ApiPropertyOptional({
    description: 'Tensión del sistema',
    example: '120V',
    examples: ['120V', '208V', '480V'],
  })
  @IsOptional()
  @IsString()
  tension_sistema?: string;

  @ApiPropertyOptional({
    description: 'Número de fases',
    example: 1,
    minimum: 1,
    maximum: 3,
  })
  @IsOptional()
  @IsNumber()
  fases?: number;

  @ApiPropertyOptional({
    description: 'Factor de potencia',
    example: 0.9,
    minimum: 0.8,
    maximum: 1.0,
  })
  @IsOptional()
  @IsNumber()
  factor_potencia?: number;

  @ApiPropertyOptional({
    description: 'Material del conductor',
    enum: ['Cu', 'Al'],
    example: 'Cu',
  })
  @IsOptional()
  @IsIn(['Cu', 'Al'])
  material_conductor?: string;

  @ApiPropertyOptional({
    description: 'Tipo de aislamiento',
    example: 'THHN',
    examples: ['THHN', 'THW', 'XHHW'],
  })
  @IsOptional()
  @IsString()
  tipo_aislamiento?: string;

  @ApiPropertyOptional({
    description: 'Temperatura ambiente en °C',
    example: 30,
    minimum: 20,
    maximum: 50,
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  temperatura_ambiente?: number;
}
