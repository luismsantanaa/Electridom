import { Controller, Post, Get, Body, Query, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { AiService } from './ai.service';
import { EvaluateProjectDto } from './dto/evaluate-project.dto';
import { AiEvaluationDto } from './dto/ai-evaluation.dto';
import { AiSuggestionDto } from './dto/ai-suggestion.dto';

@ApiTags('AI')
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('evaluate')
  @ApiOperation({ summary: 'Evaluar un proyecto con IA' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Evaluación completada',
    type: AiEvaluationDto,
  })
  async evaluateProject(
    @Body() evaluateDto: EvaluateProjectDto,
  ): Promise<AiEvaluationDto> {
    return this.aiService.evaluateProject(evaluateDto.projectId);
  }

  @Get('suggestions')
  @ApiOperation({ summary: 'Obtener sugerencias de IA para un proyecto' })
  @ApiQuery({ name: 'projectId', description: 'ID del proyecto' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Sugerencias obtenidas',
    schema: {
      type: 'object',
      properties: {
        suggestions: {
          type: 'array',
          items: { $ref: '#/components/schemas/AiSuggestionDto' },
        },
      },
    },
  })
  async getSuggestions(
    @Query('projectId') projectId: string,
  ): Promise<{ suggestions: AiSuggestionDto[] }> {
    const suggestions = await this.aiService.getSuggestions(projectId);
    return { suggestions };
  }

  @Get('health')
  @ApiOperation({ summary: 'Verificar estado de salud del servicio de IA' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Estado de salud',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string' },
        provider: { type: 'string' },
      },
    },
  })
  async getHealth(): Promise<{ status: string; provider: string }> {
    const isHealthy = await this.aiService.isHealthy();
    const providerInfo = this.aiService.getProviderInfo();

    return {
      status: isHealthy ? 'healthy' : 'unhealthy',
      provider: providerInfo.provider,
    };
  }

  @Get('provider')
  @ApiOperation({ summary: 'Obtener información del proveedor de IA' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Información del proveedor',
    schema: {
      type: 'object',
      properties: {
        provider: { type: 'string' },
        model: { type: 'string' },
      },
    },
  })
  async getProvider(): Promise<{ provider: string; model?: string }> {
    return this.aiService.getProviderInfo();
  }
}
