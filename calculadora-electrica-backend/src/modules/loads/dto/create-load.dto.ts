import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateLoadDto {
  @IsNotEmpty()
  @IsUUID()
  environmentType: string;

  @IsNotEmpty()
  @IsUUID()
  artifactType: string;

  @IsNotEmpty()
  @IsNumber()
  voltage: number;

  @IsNotEmpty()
  @IsNumber()
  usageHours: number;

  @IsOptional()
  @IsString()
  observations?: string;

  @IsNotEmpty()
  @IsUUID()
  projectId: string;
}
