import { Injectable, Logger, HttpException, HttpStatus, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OpenAIClient } from './openai.client';
import { AnalyzeRequestDto } from './dto/analyze-request.dto';
import { AnalyzeResponseDto, RecommendationDto } from './dto/analyze-response.dto';
import { PromptBuilderHelper } from './helpers/prompt-builder.helper';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(
    private configService: ConfigService,
    @Inject('OpenAIClient') private openaiClient: OpenAIClient | null,
    private promptBuilder: PromptBuilderHelper,
  ) {}



  async analyze(payload: AnalyzeRequestDto): Promise<AnalyzeResponseDto> {
    const startTime = Date.now();
    
    try {
      this.logger.log('Iniciando análisis con IA');
      
      // Verificar si OpenAI está disponible
      if (!this.openaiClient) {
        this.logger.warn('OpenAI no está configurado, devolviendo respuesta simulada');
        return {
          summary: 'Análisis simulado - OpenAI no configurado',
          recommendations: [
            {
              title: 'Configuración requerida',
              description: 'Para usar análisis de IA, configure OPENAI_API_KEY en las variables de entorno',
              priority: 'medium',
              category: 'configuration'
            }
          ],
          tokensUsed: 0,
          responseTime: Date.now() - startTime,
        };
      }
      
      // Validar prompts
      if (!this.promptBuilder.validatePrompts()) {
        throw new HttpException(
          'Configuración de prompts incompleta',
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }
      
      // Construir el mensaje para OpenAI usando el helper
      const messages = this.buildMessages(payload);
      
      // Llamar a OpenAI
      const response = await this.openaiClient.getClient().chat.completions.create({
        model: this.openaiClient.getModel(),
        messages,
        temperature: 0.7,
        max_tokens: 1000,
      });

      const responseTime = Date.now() - startTime;
      const tokensUsed = response.usage?.total_tokens || 0;

      // Parsear la respuesta
      const content = response.choices[0]?.message?.content || '';
      const parsedResponse = this.parseAIResponse(content);

      this.logger.log(`Análisis completado en ${responseTime}ms, tokens: ${tokensUsed}, prompt hash: ${this.promptBuilder.getPromptHash()}`);

      return {
        summary: parsedResponse.summary,
        recommendations: parsedResponse.recommendations,
        tokensUsed,
        responseTime,
      };

    } catch (error) {
      this.logger.error(`Error en análisis de IA: ${error.message}`);
      throw new HttpException(
        'Error al procesar la solicitud de IA',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  private buildMessages(payload: AnalyzeRequestDto): any[] {
    // Construir mensajes del sistema
    const messages = this.promptBuilder.buildSystemMessages();
    
    // Construir contexto de análisis
    const context = this.promptBuilder.buildAnalysisContext(
      payload.input,
      payload.output,
      payload.question
    );
    
    // Construir mensaje del usuario
    const userMessage = this.promptBuilder.buildUserMessage(context);
    messages.push(userMessage);
    
    return messages;
  }

  private parseAIResponse(content: string): { summary: string; recommendations: RecommendationDto[] } {
    try {
      // Intentar extraer JSON de la respuesta
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          summary: parsed.summary || 'Análisis completado',
          recommendations: parsed.recommendations || []
        };
      }

      // Fallback: parsear manualmente
      return {
        summary: content.substring(0, 200) + '...',
        recommendations: []
      };
    } catch (error) {
      this.logger.warn(`Error parseando respuesta de IA: ${error.message}`);
      return {
        summary: content,
        recommendations: []
      };
    }
  }
}
