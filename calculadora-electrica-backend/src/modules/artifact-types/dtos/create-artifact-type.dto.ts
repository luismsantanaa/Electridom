import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsUUID, IsNotEmpty } from 'class-validator';

export class CreateArtifactTypeDto {
  @ApiProperty({
    description: 'Name of the artifact type',
    example: 'Light Bulb',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Description of the artifact type',
    example: 'Standard light bulb for residential use',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'ID of the associated environment type',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  environmentTypeId?: string;
}
