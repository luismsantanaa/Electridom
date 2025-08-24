import { IsArray, IsNumber, IsOptional, IsString, Min, ValidateNested, IsEnum, MinLength } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SystemConfigDto {
  @ApiPropertyOptional({ default: 120, description: 'Tensión del system en voltios' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  voltage?: number = 120;

  @ApiPropertyOptional({ enum: [1, 3], default: 1, description: 'Número de fases' })
  @IsOptional()
  @IsNumber()
  phases?: number = 1;

  @ApiPropertyOptional({ default: 60, description: 'Frecuencia en Hz' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  frequency?: number = 60;
}

export class SurfaceDto {
  @ApiProperty({ description: 'name del environment' })
  @IsString()
  @MinLength(1)
  name: string;

  @ApiProperty({ description: 'Área en metros cuadrados', minimum: 0.1 })
  @IsNumber()
  @Min(0.1)
  area_m2: number;
}

export class ConsumptionDto {
  @ApiProperty({ description: 'name del artefacto' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'name del environment donde se encuentra' })
  @IsString()
  environment: string;

  @ApiProperty({ description: 'Potencia en watts', minimum: 1 })
  @IsNumber()
  @Min(1)
  power_w: number;

  @ApiPropertyOptional({ description: 'Factor de potencia', minimum: 0.1, maximum: 1.0 })
  @IsOptional()
  @IsNumber()
  @Min(0.1)
  fp?: number;

  @ApiPropertyOptional({ 
    enum: ['iluminacion', 'toma_general', 'electrodomestico', 'climatizacion', 'especial'],
    default: 'electrodomestico',
    description: 'type de load'
  })
  @IsOptional()
  @IsEnum(['iluminacion', 'toma_general', 'electrodomestico', 'climatizacion', 'especial'])
  type?: string = 'electrodomestico';
}

export class CalcRoomsRequestDto {
  @ApiPropertyOptional({ type: SystemConfigDto, description: 'Configuración del system' })
  @IsOptional()
  @ValidateNested()
  @Type(() => SystemConfigDto)
  system?: SystemConfigDto;

  @ApiProperty({ type: [SurfaceDto], description: 'Lista de environments y sus áreas' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SurfaceDto)
  surfaces: SurfaceDto[];

  @ApiProperty({ type: [ConsumptionDto], description: 'Lista de consumptions por environment' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ConsumptionDto)
  consumptions: ConsumptionDto[];
}

