import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsUUID, IsBoolean } from 'class-validator';

export class CreateInstallationTypeDto {
  @IsUUID()
  @ApiProperty()
  id: string;

  @IsString()
  @ApiProperty({
    example: 'oficina',
    description: 'name del type de instalación',
  })
  name: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    example: 'espacio para trabajo',
    description: 'Descripción del type de instalación',
  })
  description?: string;

  @IsBoolean()
  @IsOptional()
  @ApiProperty({
    example: true,
    description: 'Active',
  })
  active?: boolean;

  @IsString()
  @IsOptional()
  @ApiProperty({
    example: 'user@example.com',
    description: 'Created by',
  })
  usrCreate?: string;
}
