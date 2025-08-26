import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

export interface PromptContext {
  systemPrompt: string;
  userExamples: string;
  guardrails: string;
  inputData: any;
  outputData: any;
  userQuestion?: string;
  sessionId?: string;
}

export interface MessageBuilder {
  buildSystemMessages(): any[];
  buildUserMessage(context: PromptContext): any;
  validatePrompts(): boolean;
  getPromptHash(): string;
}

@Injectable()
export class PromptBuilderHelper implements MessageBuilder {
  private readonly logger = new Logger(PromptBuilderHelper.name);
  private readonly promptsPath = path.join(
    process.cwd(),
    'UserHistories',
    'prompts',
  );

  constructor() {}

  /**
   * Construye los mensajes del sistema con prompts y guardrails
   */
  buildSystemMessages(): any[] {
    const messages: any[] = [];

    // Cargar prompt del sistema
    const systemPrompt = this.loadPrompt('system.md');
    if (systemPrompt) {
      messages.push({
        role: 'system',
        content: systemPrompt,
      });
    }

    // Cargar guardrails
    const guardrails = this.loadPrompt('guardrails.md');
    if (guardrails) {
      messages.push({
        role: 'system',
        content: `Guardrails y Políticas: ${guardrails}`,
      });
    }

    return messages;
  }

  /**
   * Construye el mensaje del usuario con contexto completo
   */
  buildUserMessage(context: PromptContext): any {
    const userExamples = this.loadPrompt('user_examples.md');

    let content = `# Análisis de Cálculo Eléctrico - Eléctridom

## Contexto del Cálculo

### Datos de Entrada:
\`\`\`json
${JSON.stringify(context.inputData, null, 2)}
\`\`\`

### Resultados del Cálculo:
\`\`\`json
${JSON.stringify(context.outputData, null, 2)}
\`\`\`

`;

    if (context.userQuestion) {
      content += `### Pregunta Específica:
**${context.userQuestion}**

`;
    }

    if (userExamples) {
      content += `## Ejemplos de Referencia:
${userExamples}

`;
    }

    content += `## Instrucciones de Análisis

Por favor proporciona un análisis completo que incluya:

1. **Resumen Ejecutivo**: Descripción clara del cálculo y sus resultados principales
2. **Recomendaciones Técnicas**: Sugerencias específicas basadas en RIE RD y NEC
3. **Consideraciones de Seguridad**: Identificación de riesgos potenciales
4. **Oportunidades de Mejora**: Optimizaciones de eficiencia y costo

### Formato de Respuesta Requerido:
Responde ÚNICAMENTE en formato JSON válido con la siguiente estructura:

\`\`\`json
{
  "summary": "Resumen ejecutivo del análisis en 2-3 oraciones",
  "recommendations": [
    {
      "title": "Título de la recomendación",
      "description": "Descripción detallada con justificación técnica",
      "priority": "high|medium|low",
      "category": "safety|compliance|efficiency|cost"
    }
  ]
}
\`\`\`

### Criterios de Evaluación:
- **Prioridad High**: Seguridad crítica o cumplimiento normativo obligatorio
- **Prioridad Medium**: Mejoras importantes de eficiencia o mantenimiento
- **Prioridad Low**: Optimizaciones menores o consideraciones futuras

- **Categoría Safety**: Protección personal, equipos o instalación
- **Categoría Compliance**: Cumplimiento con RIE RD, NEC o estándares
- **Categoría Efficiency**: Optimización energética o operacional
- **Categoría Cost**: Consideraciones económicas o de mantenimiento

**IMPORTANTE**: Solo usa información verificable de normativas oficiales. No inventes valores o especificaciones técnicas.`;

    return {
      role: 'user',
      content: content.trim(),
    };
  }

  /**
   * Valida que todos los prompts necesarios estén disponibles
   */
  validatePrompts(): boolean {
    const requiredPrompts = ['system.md', 'guardrails.md', 'user_examples.md'];

    for (const prompt of requiredPrompts) {
      if (!this.loadPrompt(prompt)) {
        this.logger.warn(`Prompt requerido no encontrado: ${prompt}`);
        return false;
      }
    }

    return true;
  }

  /**
   * Genera un hash único para los prompts cargados
   */
  getPromptHash(): string {
    const prompts = [
      this.loadPrompt('system.md'),
      this.loadPrompt('guardrails.md'),
      this.loadPrompt('user_examples.md'),
    ].join('|');

    return crypto
      .createHash('sha256')
      .update(prompts)
      .digest('hex')
      .substring(0, 8);
  }

  /**
   * Carga un prompt desde el sistema de archivos
   */
  private loadPrompt(filename: string): string {
    try {
      const promptPath = path.join(this.promptsPath, filename);
      if (fs.existsSync(promptPath)) {
        return fs.readFileSync(promptPath, 'utf8');
      } else {
        this.logger.warn(`Archivo de prompt no encontrado: ${promptPath}`);
        return '';
      }
    } catch (error) {
      this.logger.error(`Error cargando prompt ${filename}: ${error.message}`);
      return '';
    }
  }

  /**
   * Construye el contexto completo para el análisis
   */
  buildAnalysisContext(
    inputData: any,
    outputData: any,
    userQuestion?: string,
  ): PromptContext {
    return {
      systemPrompt: this.loadPrompt('system.md'),
      userExamples: this.loadPrompt('user_examples.md'),
      guardrails: this.loadPrompt('guardrails.md'),
      inputData,
      outputData,
      userQuestion,
      sessionId: this.generateSessionId(),
    };
  }

  /**
   * Genera un ID de sesión único
   */
  private generateSessionId(): string {
    return crypto.randomBytes(8).toString('hex');
  }
}
