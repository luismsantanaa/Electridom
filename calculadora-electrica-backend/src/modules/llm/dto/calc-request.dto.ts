import { ApiProperty } from '@nestjs/swagger';
import {
  IsObject,
  IsOptional,
  IsString,
  IsNumber,
  IsArray,
} from 'class-validator';

export class SystemConfigDto {
  @ApiProperty({ description: 'Tensión del sistema en voltios', example: 120 })
  @IsNumber()
  voltage: number;

  @ApiProperty({ description: 'Número de fases', example: 1, enum: [1, 3] })
  @IsNumber()
  phases: number;

  @ApiProperty({ description: 'Frecuencia en Hz', example: 60 })
  @IsNumber()
  frequency: number;
}

export class EnvironmentDto {
  @ApiProperty({ description: 'Nombre del ambiente', example: 'Sala de estar' })
  @IsString()
  nombre: string;

  @ApiProperty({ description: 'Área en metros cuadrados', example: 25.5 })
  @IsNumber()
  area_m2: number;

  @ApiProperty({ description: 'Tipo de ambiente', example: 'residencial' })
  @IsString()
  tipo: string;
}

export class ConsumptionDto {
  @ApiProperty({ description: 'Nombre del consumo', example: 'Lámpara LED' })
  @IsString()
  nombre: string;

  @ApiProperty({
    description: 'Ambiente donde se ubica',
    example: 'Sala de estar',
  })
  @IsString()
  ambiente: string;

  @ApiProperty({ description: 'Potencia en vatios', example: 15 })
  @IsNumber()
  potencia_w: number;

  @ApiProperty({ description: 'Tipo de consumo', example: 'iluminacion' })
  @IsString()
  tipo: string;
}

export class CalcRequestDto {
  @ApiProperty({ description: 'Configuración del sistema eléctrico' })
  @IsObject()
  system: SystemConfigDto;

  @ApiProperty({ description: 'Lista de ambientes', type: [EnvironmentDto] })
  @IsArray()
  superficies: EnvironmentDto[];

  @ApiProperty({ description: 'Lista de consumos', type: [ConsumptionDto] })
  @IsArray()
  consumos: ConsumptionDto[];

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
