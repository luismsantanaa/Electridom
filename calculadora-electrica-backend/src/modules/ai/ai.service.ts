import { Injectable } from '@nestjs/common';
import { AiProvider } from './interfaces/ai-provider.interface';
import { MockAiProvider } from './providers/mock-ai.provider';
import { AiEvaluationDto } from './dto/ai-evaluation.dto';
import { AiSuggestionDto } from './dto/ai-suggestion.dto';

@Injectable()
export class AiService {
  private provider: AiProvider;

  constructor() {
    // Por ahora usar el proveedor mock
    this.provider = new MockAiProvider();
  }

  async evaluateProject(projectId: string): Promise<AiEvaluationDto> {
    try {
      return await this.provider.evaluateProject(projectId);
    } catch (error) {
      // En caso de error, devolver evaluación por defecto
      console.error('Error evaluating project with AI:', error);
      return {
        score: 50,
        alerts: [
          {
            code: 'AI_ERROR',
            severity: 'warn',
            message:
              'No se pudo evaluar el proyecto con IA. Usando evaluación por defecto.',
          },
        ],
        hints: ['Revisar la configuración del proyecto manualmente'],
      };
    }
  }

  async getSuggestions(projectId: string): Promise<AiSuggestionDto[]> {
    try {
      return await this.provider.getSuggestions(projectId);
    } catch (error) {
      console.error('Error getting AI suggestions:', error);
      return [];
    }
  }

  async isHealthy(): Promise<boolean> {
    try {
      return await this.provider.isHealthy();
    } catch (error) {
      console.error('Error checking AI health:', error);
      return false;
    }
  }

  getProviderInfo(): { provider: string; model?: string } {
    const info = this.provider.getProviderInfo();
    return {
      provider: info.name,
      model: info.model,
    };
  }
}
