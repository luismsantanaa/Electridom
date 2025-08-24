import { IsArray, IsNumber, IsOptional, IsString, Min, ValidateNested, IsEnum, MinLength } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SystemConfigDto {
  @ApiPropertyOptional({ default: 120, description: 'Tensión del sistema en voltios' })
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

export class SuperficieDto {
  @ApiProperty({ description: 'Nombre del ambiente' })
  @IsString()
  @MinLength(1)
  nombre: string;

  @ApiProperty({ description: 'Área en metros cuadrados', minimum: 0.1 })
  @IsNumber()
  @Min(0.1)
  area_m2: number;
}

export class ConsumoDto {
  @ApiProperty({ description: 'Nombre del artefacto' })
  @IsString()
  nombre: string;

  @ApiProperty({ description: 'Nombre del ambiente donde se encuentra' })
  @IsString()
  ambiente: string;

  @ApiProperty({ description: 'Potencia en watts', minimum: 1 })
  @IsNumber()
  @Min(1)
  potencia_w: number;

  @ApiPropertyOptional({ description: 'Factor de potencia', minimum: 0.1, maximum: 1.0 })
  @IsOptional()
  @IsNumber()
  @Min(0.1)
  fp?: number;

  @ApiPropertyOptional({ 
    enum: ['iluminacion', 'toma_general', 'electrodomestico', 'climatizacion', 'especial'],
    default: 'electrodomestico',
    description: 'Tipo de carga'
  })
  @IsOptional()
  @IsEnum(['iluminacion', 'toma_general', 'electrodomestico', 'climatizacion', 'especial'])
  tipo?: string = 'electrodomestico';
}

export class CalcRoomsRequestDto {
  @ApiPropertyOptional({ type: SystemConfigDto, description: 'Configuración del sistema' })
  @IsOptional()
  @ValidateNested()
  @Type(() => SystemConfigDto)
  system?: SystemConfigDto;

  @ApiProperty({ type: [SuperficieDto], description: 'Lista de ambientes y sus áreas' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SuperficieDto)
  superficies: SuperficieDto[];

  @ApiProperty({ type: [ConsumoDto], description: 'Lista de consumos por ambiente' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ConsumoDto)
  consumos: ConsumoDto[];
}
