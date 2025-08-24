import { IsString, IsNumber, IsUUID, Min } from 'class-validator';

export class CreateTipoArtefactoDto {
  @IsString()
  nombre: string;

  @IsNumber()
  @Min(0)
  potencia: number;

  @IsNumber()
  @Min(0)
  voltaje: number;

  @IsUUID()
  tipoAmbiente_Id: string;
}
