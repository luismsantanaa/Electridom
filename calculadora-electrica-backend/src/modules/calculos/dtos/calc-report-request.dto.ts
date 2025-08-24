import {
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CalcRoomsRequestDto } from './calc-rooms-request.dto';
import { CalcDemandRequestDto } from './calc-demand-request.dto';
import { CalcCircuitsRequestDto } from './calc-circuits-request.dto';
import { CalcFeederRequestDto } from './calc-feeder-request.dto';
import { CalcGroundingRequestDto } from './calc-grounding-request.dto';

export class CalcReportRequestDto {
  @ApiPropertyOptional({
    description: 'ID del cálculo (para modo con estado)',
    example: 'calc-12345',
  })
  @IsOptional()
  @IsString()
  calculationId?: string;

  @ApiPropertyOptional({
    description: 'Datos de cálculo de cargas por ambiente',
    type: CalcRoomsRequestDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CalcRoomsRequestDto)
  roomsData?: CalcRoomsRequestDto;

  @ApiPropertyOptional({
    description: 'Datos de análisis de demanda y diversificación',
    type: CalcDemandRequestDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CalcDemandRequestDto)
  demandData?: CalcDemandRequestDto;

  @ApiPropertyOptional({
    description: 'Datos de circuitos ramales y conductores',
    type: CalcCircuitsRequestDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CalcCircuitsRequestDto)
  circuitsData?: CalcCircuitsRequestDto;

  @ApiPropertyOptional({
    description: 'Datos de análisis de caída de tensión y alimentador',
    type: CalcFeederRequestDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CalcFeederRequestDto)
  feederData?: CalcFeederRequestDto;

  @ApiPropertyOptional({
    description: 'Datos de puesta a tierra y conductores de protección',
    type: CalcGroundingRequestDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CalcGroundingRequestDto)
  groundingData?: CalcGroundingRequestDto;

  @ApiPropertyOptional({
    description: 'Tipo de instalación',
    example: 'residencial',
    enum: ['residencial', 'comercial', 'industrial'],
  })
  @IsOptional()
  @IsString()
  installationType?: string;

  @ApiPropertyOptional({
    description: 'Sistema eléctrico',
    example: 'Monofásico 120V',
  })
  @IsOptional()
  @IsString()
  electricalSystem?: string;
}
