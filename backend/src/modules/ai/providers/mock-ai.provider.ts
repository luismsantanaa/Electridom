import { Injectable } from '@nestjs/common';
import { AiProvider } from '../interfaces/ai-provider.interface';
import { AiEvaluationDto, AlertDto } from '../dto/ai-evaluation.dto';
import { AiSuggestionDto } from '../dto/ai-suggestion.dto';

@Injectable()
export class MockAiProvider implements AiProvider {
  async evaluateProject(projectId: string): Promise<AiEvaluationDto> {
    // Simular delay de procesamiento
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Generar evaluación mock basada en el projectId
    const score = this.generateMockScore(projectId);
    const alerts = this.generateMockAlerts(score);
    const hints = this.generateMockHints(score);

    return {
      score,
      alerts,
      hints,
    };
  }

  async getSuggestions(projectId: string): Promise<AiSuggestionDto[]> {
    // Simular delay de procesamiento
    await new Promise((resolve) => setTimeout(resolve, 800));

    return this.generateMockSuggestions(projectId);
  }

  async isHealthy(): Promise<boolean> {
    return true;
  }

  getProviderInfo(): { name: string; model?: string } {
    return {
      name: 'mock-ai',
      model: 'mock-model-v1',
    };
  }

  private generateMockScore(projectId: string): number {
    // Generar score basado en el hash del projectId
    const hash = projectId.split('').reduce((a, b) => {
      a = (a << 5) - a + b.charCodeAt(0);
      return a & a;
    }, 0);
    return Math.abs(hash) % 100;
  }

  private generateMockAlerts(score: number): AlertDto[] {
    const alerts: AlertDto[] = [];

    if (score < 50) {
      alerts.push({
        code: 'LOW_SCORE',
        severity: 'error',
        message: 'Puntuación muy baja. Revisar configuración del proyecto.',
      });
    }

    if (score < 70) {
      alerts.push({
        code: 'OPTIMIZATION_NEEDED',
        severity: 'warn',
        message: 'Se recomienda optimizar la configuración eléctrica.',
      });
    }

    if (score > 80) {
      alerts.push({
        code: 'GOOD_SCORE',
        severity: 'info',
        message: 'Proyecto bien configurado. Mantener estándares.',
      });
    }

    return alerts;
  }

  private generateMockHints(score: number): string[] {
    const hints: string[] = [];

    if (score < 60) {
      hints.push('Considerar aumentar la capacidad de los conductores');
      hints.push('Verificar la selección de protecciones eléctricas');
      hints.push('Revisar el cálculo de caída de tensión');
    }

    if (score >= 60 && score < 80) {
      hints.push('Optimizar la distribución de cargas');
      hints.push('Considerar factores de demanda más precisos');
    }

    if (score >= 80) {
      hints.push('Excelente configuración. Considerar certificaciones');
      hints.push('Documentar las mejores prácticas implementadas');
    }

    return hints;
  }

  private generateMockSuggestions(projectId: string): AiSuggestionDto[] {
    const suggestions: AiSuggestionDto[] = [
      {
        id: 'sug-001',
        title: 'Optimización de Conductores',
        description:
          'Considerar usar conductores de mayor calibre para reducir pérdidas',
        type: 'optimization',
        priority: 'medium',
        impact: 'Reducción del 5% en pérdidas de energía',
      },
      {
        id: 'sug-002',
        title: 'Mejora de Protecciones',
        description: 'Implementar protecciones diferenciales adicionales',
        type: 'safety',
        priority: 'high',
        impact: 'Aumento del 15% en seguridad eléctrica',
      },
      {
        id: 'sug-003',
        title: 'Factor de Demanda',
        description: 'Ajustar el factor de demanda según uso real',
        type: 'efficiency',
        priority: 'low',
        impact: 'Optimización del 3% en dimensionamiento',
      },
    ];

    // Filtrar sugerencias basadas en el projectId para simular personalización
    const hash = projectId.split('').reduce((a, b) => {
      a = (a << 5) - a + b.charCodeAt(0);
      return a & a;
    }, 0);

    return suggestions.slice(0, (Math.abs(hash) % 3) + 1);
  }
}
