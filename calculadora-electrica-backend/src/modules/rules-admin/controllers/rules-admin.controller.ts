import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  ValidationPipe,
  UsePipes,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiQuery,
  ApiSecurity,
} from '@nestjs/swagger';
import { RulesAdminService } from '../services/rules-admin.service';
import { ApiKeyGuard } from '../../../common/guards/api-key.guard';
import { 
  CreateRuleSetDto, 
  BulkUpsertRulesDto, 
  RuleSetResponseDto, 
  RuleSetDetailResponseDto,
  RuleSetDiffResponseDto,
  RuleSetExportDto,
  ImportRuleSetDto
} from '../dtos/rule-set.dto';

@ApiTags('Administración de Reglas Normativas')
@Controller('v1/rulesets')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class RulesAdminController {
  constructor(private readonly rulesAdminService: RulesAdminService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(ApiKeyGuard)
  @ApiSecurity('api-key')
  @ApiOperation({
    summary: 'Crear un nuevo conjunto de reglas',
    description: 'Crea un nuevo RuleSet en estado DRAFT',
  })
  @ApiBody({
    type: CreateRuleSetDto,
    description: 'Datos del conjunto de reglas',
    examples: {
      ejemplo1: {
        summary: 'RuleSet básico',
        value: {
          name: 'RIE-RD Baseline 2025-08',
          description: 'Semilla basada en RIE RD (placeholder)',
          effectiveFrom: '2025-09-01T00:00:00Z',
          effectiveTo: null,
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'RuleSet creado exitosamente',
    type: RuleSetResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Datos de entrada inválidos',
  })
  @ApiResponse({
    status: 401,
    description: 'API Key inválida o faltante',
  })
  async createRuleSet(@Body() request: CreateRuleSetDto): Promise<RuleSetResponseDto> {
    return this.rulesAdminService.createRuleSet(request);
  }

  @Put(':ruleSetId/rules')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ApiKeyGuard)
  @ApiSecurity('api-key')
  @ApiOperation({
    summary: 'Cargar/actualizar reglas en un RuleSet',
    description: 'Realiza bulk upsert de reglas en un RuleSet DRAFT',
  })
  @ApiParam({
    name: 'ruleSetId',
    description: 'ID del RuleSet',
    example: 'uuid',
  })
  @ApiBody({
    type: BulkUpsertRulesDto,
    description: 'Reglas a insertar/actualizar',
    examples: {
      ejemplo1: {
        summary: 'Reglas básicas',
        value: {
          rules: [
            {
              code: 'LUZ_VA_POR_M2',
              description: 'VA por m² iluminación',
              numericValue: 100.0,
              unit: 'VA/m2',
              category: 'ILU',
              source: 'TODO validar RIE RD',
            },
            {
              code: 'TOMA_VA_MAX_POR_CIRCUITO',
              description: 'Límite VA por circuito TOM',
              numericValue: 1800.0,
              unit: 'VA',
              category: 'TOM',
            },
          ],
          actor: 'lsantana',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Reglas actualizadas exitosamente',
    type: RuleSetDetailResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'RuleSet no está en estado DRAFT',
  })
  @ApiResponse({
    status: 404,
    description: 'RuleSet no encontrado',
  })
  @ApiResponse({
    status: 401,
    description: 'API Key inválida o faltante',
  })
  async bulkUpsertRules(
    @Param('ruleSetId') ruleSetId: string,
    @Body() request: BulkUpsertRulesDto,
  ): Promise<RuleSetDetailResponseDto> {
    return this.rulesAdminService.bulkUpsertRules(ruleSetId, request);
  }

  @Post(':ruleSetId/publish')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ApiKeyGuard)
  @ApiSecurity('api-key')
  @ApiOperation({
    summary: 'Publicar un RuleSet',
    description: 'Cambia el estado de DRAFT a ACTIVE',
  })
  @ApiParam({
    name: 'ruleSetId',
    description: 'ID del RuleSet',
    example: 'uuid',
  })
  @ApiResponse({
    status: 200,
    description: 'RuleSet publicado exitosamente',
    type: RuleSetResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'RuleSet no está en estado DRAFT o fechas inválidas',
  })
  @ApiResponse({
    status: 404,
    description: 'RuleSet no encontrado',
  })
  @ApiResponse({
    status: 409,
    description: 'Solapamiento con otros RuleSets activos',
  })
  @ApiResponse({
    status: 401,
    description: 'API Key inválida o faltante',
  })
  async publishRuleSet(@Param('ruleSetId') ruleSetId: string): Promise<RuleSetResponseDto> {
    return this.rulesAdminService.publishRuleSet(ruleSetId);
  }

  @Post(':ruleSetId/retire')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ApiKeyGuard)
  @ApiSecurity('api-key')
  @ApiOperation({
    summary: 'Retirar un RuleSet',
    description: 'Cambia el estado de ACTIVE a RETIRED',
  })
  @ApiParam({
    name: 'ruleSetId',
    description: 'ID del RuleSet',
    example: 'uuid',
  })
  @ApiResponse({
    status: 200,
    description: 'RuleSet retirado exitosamente',
    type: RuleSetResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'RuleSet no está en estado ACTIVE',
  })
  @ApiResponse({
    status: 404,
    description: 'RuleSet no encontrado',
  })
  @ApiResponse({
    status: 401,
    description: 'API Key inválida o faltante',
  })
  async retireRuleSet(@Param('ruleSetId') ruleSetId: string): Promise<RuleSetResponseDto> {
    return this.rulesAdminService.retireRuleSet(ruleSetId);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar conjuntos de reglas',
    description: 'Lista RuleSets con paginación y filtros',
  })
  @ApiQuery({
    name: 'page',
    description: 'Número de página',
    required: false,
    type: Number,
    example: 1,
  })
  @ApiQuery({
    name: 'pageSize',
    description: 'Tamaño de página',
    required: false,
    type: Number,
    example: 20,
  })
  @ApiQuery({
    name: 'status',
    description: 'Filtrar por estado',
    required: false,
    enum: ['DRAFT', 'ACTIVE', 'RETIRED'],
  })
  @ApiQuery({
    name: 'query',
    description: 'Término de búsqueda en nombre o descripción',
    required: false,
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de RuleSets obtenida exitosamente',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/RuleSetResponseDto' },
        },
        total: { type: 'number' },
        page: { type: 'number' },
        pageSize: { type: 'number' },
        totalPages: { type: 'number' },
      },
    },
  })
  async listRuleSets(
    @Query('page') page = 1,
    @Query('pageSize') pageSize = 20,
    @Query('status') status?: string,
    @Query('query') query?: string,
  ) {
    return this.rulesAdminService.listRuleSets(page, pageSize, status, query);
  }

  @Get(':ruleSetId')
  @ApiOperation({
    summary: 'Obtener detalle de un RuleSet',
    description: 'Obtiene un RuleSet con todas sus reglas',
  })
  @ApiParam({
    name: 'ruleSetId',
    description: 'ID del RuleSet',
    example: 'uuid',
  })
  @ApiResponse({
    status: 200,
    description: 'RuleSet obtenido exitosamente',
    type: RuleSetDetailResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'RuleSet no encontrado',
  })
  async getRuleSetDetail(@Param('ruleSetId') ruleSetId: string): Promise<RuleSetDetailResponseDto> {
    return this.rulesAdminService.getRuleSetDetail(ruleSetId);
  }

  @Get(':ruleSetIdA/diff/:ruleSetIdB')
  @ApiOperation({
    summary: 'Comparar dos RuleSets',
    description: 'Calcula la diferencia entre dos RuleSets',
  })
  @ApiParam({
    name: 'ruleSetIdA',
    description: 'ID del primer RuleSet',
    example: 'uuid',
  })
  @ApiParam({
    name: 'ruleSetIdB',
    description: 'ID del segundo RuleSet',
    example: 'uuid',
  })
  @ApiResponse({
    status: 200,
    description: 'Diferencia calculada exitosamente',
    type: RuleSetDiffResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Uno o ambos RuleSets no encontrados',
  })
  async getRuleSetDiff(
    @Param('ruleSetIdA') ruleSetIdA: string,
    @Param('ruleSetIdB') ruleSetIdB: string,
  ): Promise<RuleSetDiffResponseDto> {
    return this.rulesAdminService.getRuleSetDiff(ruleSetIdA, ruleSetIdB);
  }

  @Get(':ruleSetId/export')
  @ApiOperation({
    summary: 'Exportar un RuleSet',
    description: 'Exporta un RuleSet completo en formato JSON',
  })
  @ApiParam({
    name: 'ruleSetId',
    description: 'ID del RuleSet',
    example: 'uuid',
  })
  @ApiResponse({
    status: 200,
    description: 'RuleSet exportado exitosamente',
    type: RuleSetExportDto,
  })
  @ApiResponse({
    status: 404,
    description: 'RuleSet no encontrado',
  })
  async exportRuleSet(@Param('ruleSetId') ruleSetId: string): Promise<RuleSetExportDto> {
    return this.rulesAdminService.exportRuleSet(ruleSetId);
  }

  @Post('import')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(ApiKeyGuard)
  @ApiSecurity('api-key')
  @ApiOperation({
    summary: 'Importar un RuleSet',
    description: 'Importa un RuleSet desde formato JSON',
  })
  @ApiBody({
    type: ImportRuleSetDto,
    description: 'Datos del RuleSet a importar',
    examples: {
      ejemplo1: {
        summary: 'Importar RuleSet',
        value: {
          name: 'RIE-RD Imported 2025-08',
          description: 'RuleSet importado desde archivo',
          rules: [
            {
              code: 'LUZ_VA_POR_M2',
              description: 'VA por m² iluminación',
              numericValue: 100.0,
              unit: 'VA/m2',
              category: 'ILU',
              source: 'RIE RD',
            },
          ],
          actor: 'lsantana',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'RuleSet importado exitosamente',
    type: RuleSetResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Datos de entrada inválidos',
  })
  @ApiResponse({
    status: 401,
    description: 'API Key inválida o faltante',
  })
  async importRuleSet(@Body() request: ImportRuleSetDto): Promise<RuleSetResponseDto> {
    return this.rulesAdminService.importRuleSet(request);
  }
}

@ApiTags('Resolución de Reglas')
@Controller('v1/rules')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class RulesResolverController {
  constructor(private readonly rulesAdminService: RulesAdminService) {}

  @Get('active')
  @ApiOperation({
    summary: 'Obtener reglas activas',
    description: 'Resuelve el RuleSet activo para una fecha específica',
  })
  @ApiQuery({
    name: 'at',
    description: 'Fecha para resolver reglas activas (ISO 8601)',
    required: false,
    type: String,
    example: '2025-09-10T00:00:00Z',
  })
  @ApiResponse({
    status: 200,
    description: 'Reglas activas obtenidas exitosamente',
    schema: {
      type: 'object',
      properties: {
        ruleSet: { $ref: '#/components/schemas/RuleSetResponseDto' },
        rules: {
          type: 'array',
          items: { $ref: '#/components/schemas/RuleDto' },
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'No se encontró un RuleSet activo para la fecha especificada',
  })
  async getActiveRules(@Query('at') at?: string) {
    return this.rulesAdminService.getActiveRuleSet(at);
  }

  @Get(':ruleSetId')
  @ApiOperation({
    summary: 'Obtener reglas de un RuleSet específico',
    description: 'Obtiene las reglas de un RuleSet por ID',
  })
  @ApiParam({
    name: 'ruleSetId',
    description: 'ID del RuleSet',
    example: 'uuid',
  })
  @ApiResponse({
    status: 200,
    description: 'Reglas obtenidas exitosamente',
    schema: {
      type: 'object',
      properties: {
        ruleSet: { $ref: '#/components/schemas/RuleSetResponseDto' },
        rules: {
          type: 'array',
          items: { $ref: '#/components/schemas/RuleDto' },
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'RuleSet no encontrado',
  })
  async getRuleSetRules(@Param('ruleSetId') ruleSetId: string) {
    return this.rulesAdminService.getRuleSetById(ruleSetId);
  }
}
