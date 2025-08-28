import { Controller, Post, Get, Body, Res, HttpStatus, HttpException } from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { LlmService } from './llm.service';
import { LlmGateway } from './llm.gateway';
import { CalcRequestDto } from './dto/calc-request.dto';
import { ExplainRequestDto } from './dto/explain-request.dto';

@ApiTags('LLM - Inteligencia Artificial')
@Controller('llm')
export class LlmController {
  constructor(
    private readonly llmService: LlmService,
    private readonly llmGateway: LlmGateway,
  ) {}

  @Post('calc')
  @ApiOperation({ summary: 'Realizar cálculo eléctrico con IA' })
  @ApiBody({ type: CalcRequestDto })
  @ApiResponse({ status: 200, description: 'Cálculo realizado exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor' })
  async calculate(@Body() request: CalcRequestDto) {
    try {
      const result = await this.llmService.calculate(request);
      return result;
    } catch (error) {
      throw new HttpException(
        `Error en cálculo: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('explain')
  @ApiOperation({ summary: 'Explicación técnica con streaming' })
  @ApiBody({ type: ExplainRequestDto })
  @ApiResponse({ status: 200, description: 'Explicación iniciada' })
  async explain(@Body() request: ExplainRequestDto, @Res() res: Response) {
    try {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('Access-Control-Allow-Origin', '*');

      const stream = this.llmService.explain(request);
      
      for await (const chunk of stream) {
        res.write(`data: ${JSON.stringify(chunk)}\n\n`);
      }
      
      res.write('data: [DONE]\n\n');
      res.end();
    } catch (error) {
      res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
      res.end();
    }
  }

  @Get('provider')
  @ApiOperation({ summary: 'Obtener información del proveedor actual' })
  @ApiResponse({ status: 200, description: 'Información del proveedor' })
  async getProvider() {
    try {
      const provider = await this.llmGateway.getCurrentProvider();
      const availableProviders = await this.llmGateway.getAvailableProviders();
      
      return {
        current: provider,
        available: availableProviders,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new HttpException(
        `Error obteniendo proveedor: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('health')
  @ApiOperation({ summary: 'Verificar estado del servicio LLM' })
  @ApiResponse({ status: 200, description: 'Servicio funcionando correctamente' })
  async health() {
    try {
      const provider = await this.llmGateway.getCurrentProvider();
      const availableProviders = await this.llmGateway.getAvailableProviders();
      
      const hasAvailableProvider = availableProviders.some(p => p.available);
      
      return {
        status: hasAvailableProvider ? 'healthy' : 'degraded',
        currentProvider: provider.name,
        availableProviders: availableProviders.length,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }
}
