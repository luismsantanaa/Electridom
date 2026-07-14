import { IsString, IsUUID } from 'class-validator';

export class EvaluateProjectDto {
  @IsString()
  @IsUUID()
  projectId: string;
}
