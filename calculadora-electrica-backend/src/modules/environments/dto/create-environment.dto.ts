import {
  IsUUID,
  IsString,
  IsOptional,
  IsNumber,
  IsEnum,
  IsNotEmpty,
} from 'class-validator';
import { tipoSuperficieEnum } from '../../../common/dtos/enums';

export class CreateEnvironmentDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNotEmpty()
  @IsUUID()
  environmentTypeId: string;

  @IsNotEmpty()
  @IsEnum(tipoSuperficieEnum)
  surfaceType: tipoSuperficieEnum;

  @IsNumber()
  length?: number;

  @IsNumber()
  width?: number;

  @IsOptional()
  @IsNumber()
  area?: number;

  @IsOptional()
  @IsNumber()
  height?: number;

  @IsOptional()
  @IsNumber()
  level?: number;

  @IsNotEmpty()
  @IsUUID()
  projectId: string;
}

