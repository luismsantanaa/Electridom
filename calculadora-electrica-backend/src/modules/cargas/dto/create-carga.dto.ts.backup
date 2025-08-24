import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateCargaDto {
  @IsNotEmpty()
  @IsUUID()
  tipoAmbiente: string;

  @IsNotEmpty()
  @IsUUID()
  tipoArtefacto: string;

  @IsNotEmpty()
  @IsNumber()
  voltaje: number;

  @IsNotEmpty()
  @IsNumber()
  horasUso: number;

  @IsOptional()
  @IsString()
  observaciones?: string;

  @IsNotEmpty()
  @IsUUID()
  proyectoId: string;
}
