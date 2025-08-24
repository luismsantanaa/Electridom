import {
  IsUUID,
  IsString,
  IsOptional,
  IsNumber,
  IsEnum,
  IsNotEmpty,
} from 'class-validator';
import { tipoSuperficieEnum } from '../../../common/dtos/enums';

export class CreateAmbienteDto {
  @IsNotEmpty()
  @IsString()
  nombre: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsNotEmpty()
  @IsUUID()
  tipoAmbienteId: string;

  @IsNotEmpty()
  @IsEnum(tipoSuperficieEnum)
  tipoSuperficie: tipoSuperficieEnum;

  @IsNumber()
  largo?: number;

  @IsNumber()
  ancho?: number;

  @IsOptional()
  @IsNumber()
  area?: number;

  @IsOptional()
  @IsNumber()
  altura?: number;

  @IsOptional()
  @IsNumber()
  nivel?: number;

  @IsNotEmpty()
  @IsUUID()
  proyectoId: string;
}
