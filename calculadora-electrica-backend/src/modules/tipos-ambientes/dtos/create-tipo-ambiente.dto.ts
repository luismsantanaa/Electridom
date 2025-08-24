import { IsString, IsUUID } from 'class-validator';

export class CreateTipoAmbienteDto {
  @IsString()
  nombre: string;

  @IsUUID()
  tipoInstalacion_Id: string;
}
