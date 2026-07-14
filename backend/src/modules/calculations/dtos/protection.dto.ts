import { IsNumber, IsString, IsEnum, IsOptional, IsInt, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { BreakerType, DifferentialType } from '../entities/protection.entity';

export class CreateProtectionDto {
  @ApiProperty({ description: 'ID del circuito', example: 1 })
  @IsInt()
  @Min(1)
  circuitId: number;

  @ApiProperty({ description: 'Amperaje del breaker', example: 20 })
  @IsInt()
  @Min(15)
  @Max(100)
  breakerAmp: number;

  @ApiProperty({ description: 'Tipo de breaker', enum: BreakerType, example: BreakerType.MCB })
  @IsEnum(BreakerType)
  breakerType: BreakerType;

  @ApiProperty({ description: 'Tipo de diferencial', enum: DifferentialType, example: DifferentialType.GFCI })
  @IsEnum(DifferentialType)
  differentialType: DifferentialType;

  @ApiProperty({ description: 'Notas adicionales', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateProtectionDto {
  @ApiProperty({ description: 'Amperaje del breaker', example: 25, required: false })
  @IsOptional()
  @IsInt()
  @Min(15)
  @Max(100)
  breakerAmp?: number;

  @ApiProperty({ description: 'Tipo de breaker', enum: BreakerType, required: false })
  @IsOptional()
  @IsEnum(BreakerType)
  breakerType?: BreakerType;

  @ApiProperty({ description: 'Tipo de diferencial', enum: DifferentialType, required: false })
  @IsOptional()
  @IsEnum(DifferentialType)
  differentialType?: DifferentialType;

  @ApiProperty({ description: 'Notas adicionales', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class ProtectionResponseDto {
  @ApiProperty({ description: 'ID de la protección' })
  id: number;

  @ApiProperty({ description: 'ID del circuito' })
  circuitId: number;

  @ApiProperty({ description: 'Amperaje del breaker' })
  breakerAmp: number;

  @ApiProperty({ description: 'Tipo de breaker', enum: BreakerType })
  breakerType: BreakerType;

  @ApiProperty({ description: 'Tipo de diferencial', enum: DifferentialType })
  differentialType: DifferentialType;

  @ApiProperty({ description: 'Notas adicionales' })
  notes: string;

  @ApiProperty({ description: 'Fecha de creación' })
  createdAt: Date;

  @ApiProperty({ description: 'Fecha de actualización' })
  updatedAt: Date;
}

export class RecalculateProtectionsDto {
  @ApiProperty({ description: 'ID del proyecto', example: 1 })
  @IsInt()
  @Min(1)
  projectId: number;
}

export class CircuitProtectionDto {
  @ApiProperty({ description: 'ID del circuito' })
  id: number;

  @ApiProperty({ description: 'Carga en VA' })
  loadVA: number;

  @ApiProperty({ description: 'Calibre del conductor' })
  conductorGauge: string;

  @ApiProperty({ description: 'Tipo de área' })
  areaType: string;

  @ApiProperty({ description: 'Fase' })
  phase: number;

  @ApiProperty({ description: 'Tensión' })
  voltage: number;

  @ApiProperty({ description: 'Corriente en A' })
  currentA: number;

  @ApiProperty({ description: 'Protección asignada' })
  protection?: ProtectionResponseDto;
}
