import { IsString, IsUUID } from 'class-validator';

export class CreateEnvironmentTypeDto {
  @IsString()
  name: string;

  @IsUUID()
  installationTypeId: string;
}
