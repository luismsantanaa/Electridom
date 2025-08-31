import { Injectable, Logger } from '@nestjs/common';
import { LlmGateway } from './llm.gateway';
import { CalcRequestDto } from './dto/calc-request.dto';
import { ExplainRequestDto } from './dto/explain-request.dto';
import { PromptInput, StreamResponse } from './interfaces/provider.interface';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class LlmService {
  private readonly logger = new Logger(LlmService.name);
  private readonly systemPrompt: string;
  private readonly calcTemplate: string;

  constructor(private readonly llmGateway: LlmGateway) {
    this.systemPrompt = this.loadSystemPrompt();
    this.calcTemplate = this.loadCalcTemplate();
  }

  async calculate(request: CalcRequestDto): Promise<any> {
    const startTime = Date.now();
    const correlationId = this.generateCorrelationId();

    this.logger.log(`[${correlationId}] Iniciando cálculo eléctrico`);

    try {
      // Construir el prompt para el cálculo
      const userPrompt = this.buildCalcPrompt(request);

      const promptInput: PromptInput = {
        systemPrompt: this.systemPrompt,
        userPrompt,
        temperature: request.temperature || 0.3, // Baja temperatura para cálculos precisos
        maxTokens: 2000,
        model: request.model,
      };

      const response = await this.llmGateway.generate(promptInput);

      // Intentar parsear la respuesta como JSON
      let result;
      try {
        result = JSON.parse(response.content);
      } catch (error) {
        this.logger.warn(
          `[${correlationId}] Respuesta no es JSON válido, devolviendo texto`,
        );
        result = {
          summary: response.content,
          error: 'Respuesta no estructurada',
          raw_response: response.content,
        };
      }

      const duration = Date.now() - startTime;
      this.logger.log(`[${correlationId}] Cálculo completado en ${duration}ms`);

      return {
        ...result,
        metadata: {
          correlationId,
          provider: response.provider,
          model: response.model,
          duration,
          tokensUsed: response.usage?.totalTokens || 0,
        },
      };
    } catch (error) {
      this.logger.error(
        `[${correlationId}] Error en cálculo: ${error.message}`,
      );
      throw error;
    }
  }

  async *explain(request: ExplainRequestDto): AsyncGenerator<StreamResponse> {
    const correlationId = this.generateCorrelationId();

    this.logger.log(`[${correlationId}] Iniciando explicación técnica`);

    try {
      const userPrompt = this.buildExplainPrompt(request);

      const promptInput: PromptInput = {
        systemPrompt: this.systemPrompt,
        userPrompt,
        temperature: request.temperature || 0.7,
        maxTokens: 1500,
        model: request.model,
      };

      for await (const chunk of this.llmGateway.generateStream(promptInput)) {
        yield {
          ...chunk,
          correlationId: correlationId,
        } as StreamResponse & { correlationId: string };
      }
    } catch (error) {
      this.logger.error(
        `[${correlationId}] Error en explicación: ${error.message}`,
      );
      yield {
        content: `Error: ${error.message}`,
        done: true,
        model: 'unknown',
        provider: 'unknown',
        correlationId: correlationId,
      } as StreamResponse & { correlationId: string };
    }
  }

  private buildCalcPrompt(request: CalcRequestDto): string {
    const systemInfo = `
Sistema eléctrico:
- Tensión: ${request.system.voltage}V
- Fases: ${request.system.phases}
- Frecuencia: ${request.system.frequency}Hz
`;

    const environmentsInfo = request.superficies
      .map((env) => `- ${env.nombre}: ${env.area_m2}m² (${env.tipo})`)
      .join('\n');

    const consumptionsInfo = request.consumos
      .map(
        (cons) =>
          `- ${cons.nombre}: ${cons.potencia_w}W (${cons.tipo}) en ${cons.ambiente}`,
      )
      .join('\n');

    return `
${this.calcTemplate}

DATOS DE LA INSTALACIÓN:

${systemInfo}

AMBIENTES:
${environmentsInfo}

CONSUMOS:
${consumptionsInfo}

Por favor, realiza el análisis completo y responde en formato JSON estricto según la plantilla proporcionada.
`;
  }

  private buildExplainPrompt(request: ExplainRequestDto): string {
    let prompt = `Pregunta: ${request.question}`;

    if (request.context) {
      prompt += `\n\nContexto adicional: ${request.context}`;
    }

    prompt += `\n\nPor favor, proporciona una explicación técnica clara y detallada, incluyendo referencias a las normativas RIE-DO, NEC 2023 y REBT cuando sea apropiado.`;

    return prompt;
  }

  private loadSystemPrompt(): string {
    try {
      const promptPath = path.join(process.cwd(), 'prompts', 'ai', 'system.md');
      return fs.readFileSync(promptPath, 'utf8');
    } catch (error) {
      this.logger.warn(
        'No se pudo cargar el system prompt, usando prompt por defecto',
      );
      return 'Eres Electridom, un asistente especializado en cálculos eléctricos para la República Dominicana.';
    }
  }

  private loadCalcTemplate(): string {
    try {
      const templatePath = path.join(process.cwd(), 'prompts', 'ai', 'calc_cargas.md');
      return fs.readFileSync(templatePath, 'utf8');
    } catch (error) {
      this.logger.warn(
        'No se pudo cargar la plantilla de cálculo, usando template por defecto',
      );
      return 'Realiza un análisis completo de las cargas eléctricas proporcionadas.';
    }
  }

  private generateCorrelationId(): string {
    return `llm-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
