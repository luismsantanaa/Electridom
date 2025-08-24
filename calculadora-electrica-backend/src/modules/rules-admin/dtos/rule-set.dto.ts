import { IsString, IsNotEmpty, MaxLength, IsOptional, IsDateString, IsArray, ValidateNested, IsNumber, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

// DTO para crear RuleSet
export class CreateRuleSetDto {
  @ApiProperty({ 
    example: 'RIE-RD Baseline 2025-08', 
    description: 'name del conjunto de rules',
    maxLength: 200 
  })
  @IsString() @IsNotEmpty() @MaxLength(200) 
  name: string;

  @ApiProperty({ 
    example: 'Semilla basada en RIE RD (placeholder)', 
    description: 'Descripción del conjunto de rules',
    required: false,
    maxLength: 500 
  })
  @IsOptional() @IsString() @MaxLength(500) 
  description?: string;

  @ApiProperty({ 
    example: '2025-09-01T00:00:00Z', 
    description: 'Fecha de vigencia desde',
    required: false
  })
  @IsOptional() @IsDateString() 
  effectiveFrom?: string;

  @ApiProperty({ 
    example: '2025-12-31T23:59:59Z', 
    description: 'Fecha de vigencia hasta (null = indefinido)',
    required: false
  })
  @IsOptional() @IsDateString() 
  effectiveTo?: string;
}

// DTO para rule individual
export class RuleDto {
  @ApiProperty({ example: 'LUZ_VA_POR_M2', description: 'Código de la rule' })
  @IsString() @IsNotEmpty() @MaxLength(100) 
  code: string;

  @ApiProperty({ example: 'VA por m² iluminación', description: 'Descripción de la rule' })
  @IsString() @IsNotEmpty() 
  description: string;

  @ApiProperty({ example: 100.0, description: 'value numérico de la rule' })
  @IsNumber() 
  numericValue: number;

  @ApiProperty({ example: 'VA/m2', description: 'Unidad de medida' })
  @IsString() @IsNotEmpty() 
  unit: string;

  @ApiProperty({ example: 'ILU', description: 'Categoría de la rule' })
  @IsString() @IsNotEmpty() 
  category: string;

  @ApiProperty({ 
    example: 'TODO validar RIE RD', 
    description: 'Fuente de la rule',
    required: false
  })
  @IsOptional() @IsString() 
  source?: string;

  @ApiProperty({ 
    example: true, 
    description: 'Si es value por defecto',
    default: true
  })
  @IsOptional() @IsBoolean() 
  isDefault?: boolean;
}

// DTO para bulk upsert de rules
export class BulkUpsertRulesDto {
  @ApiProperty({ 
    type: [RuleDto],
    description: 'Lista de rules a insertar/actualizar'
  })
  @IsArray() @ValidateNested({ each: true }) @Type(() => RuleDto) 
  rules: RuleDto[];

  @ApiProperty({ 
    example: 'lsantana', 
    description: 'Actor que realiza el cambio'
  })
  @IsString() @IsNotEmpty() @MaxLength(100) 
  actor: string;
}

// DTO para respuesta de RuleSet
export class RuleSetResponseDto {
  @ApiProperty({ example: 'uuid', description: 'ID del RuleSet' })
  id: string;

  @ApiProperty({ example: 'RIE-RD Baseline 2025-08', description: 'name del RuleSet' })
  name: string;

  @ApiProperty({ example: 'Semilla basada en RIE RD', description: 'Descripción' })
  description?: string;

  @ApiProperty({ 
    enum: ['DRAFT', 'ACTIVE', 'RETIRED'],
    example: 'DRAFT',
    description: 'Estado del RuleSet'
  })
  status: 'DRAFT' | 'ACTIVE' | 'RETIRED';

  @ApiProperty({ example: '2025-09-01T00:00:00Z', description: 'Fecha de vigencia desde' })
  effectiveFrom?: string;

  @ApiProperty({ example: '2025-12-31T23:59:59Z', description: 'Fecha de vigencia hasta' })
  effectiveTo?: string;

  @ApiProperty({ example: 15, description: 'Número de rules en el conjunto' })
  rulesCount: number;

  @ApiProperty({ example: '2025-08-21T18:00:00Z', description: 'Fecha de creación' })
  createdAt: string;

  @ApiProperty({ example: '2025-08-21T18:00:00Z', description: 'Fecha de última actualización' })
  updatedAt: string;
}

// DTO para respuesta de RuleSet con rules
export class RuleSetDetailResponseDto extends RuleSetResponseDto {
  @ApiProperty({ type: [RuleDto], description: 'Lista de rules del conjunto' })
  rules: RuleDto[];
}

// DTO para diff entre RuleSets
export class RuleSetDiffResponseDto {
  @ApiProperty({ type: [RuleDto], description: 'rules agregadas' })
  added: RuleDto[];

  @ApiProperty({ type: [RuleDto], description: 'rules eliminadas' })
  removed: RuleDto[];

  @ApiProperty({ 
    type: 'array',
    items: {
      type: 'object',
      properties: {
        code: { type: 'string' },
        before: { type: 'object' },
        after: { type: 'object' }
      }
    },
    description: 'rules modificadas'
  })
  changed: Array<{
    code: string;
    before: any;
    after: any;
  }>;
}

// DTO para exportar RuleSet
export class RuleSetExportDto {
  @ApiProperty({ description: 'Metadatos del RuleSet' })
  ruleSet: RuleSetResponseDto;

  @ApiProperty({ type: [RuleDto], description: 'rules del conjunto' })
  rules: RuleDto[];
}

// DTO para importar RuleSet
export class ImportRuleSetDto {
  @ApiProperty({ 
    example: 'RIE-RD Imported 2025-08', 
    description: 'name del RuleSet a importar'
  })
  @IsString() @IsNotEmpty() @MaxLength(200) 
  name: string;

  @ApiProperty({ 
    example: 'RuleSet importado desde archivo', 
    description: 'Descripción del RuleSet',
    required: false
  })
  @IsOptional() @IsString() @MaxLength(500) 
  description?: string;

  @ApiProperty({ 
    type: [RuleDto],
    description: 'rules a importar'
  })
  @IsArray() @ValidateNested({ each: true }) @Type(() => RuleDto) 
  rules: RuleDto[];

  @ApiProperty({ 
    example: 'lsantana', 
    description: 'Actor que realiza la importación'
  })
  @IsString() @IsNotEmpty() @MaxLength(100) 
  actor: string;
}

