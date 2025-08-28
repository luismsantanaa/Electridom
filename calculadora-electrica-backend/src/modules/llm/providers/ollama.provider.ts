import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ProviderStrategy, PromptInput, PromptResponse, StreamResponse } from '../interfaces/provider.interface';

@Injectable()
export class OllamaProvider implements ProviderStrategy {
  private readonly logger = new Logger(OllamaProvider.name);
  private readonly baseUrl: string;
  private readonly defaultModel: string;

  constructor(private configService: ConfigService) {
    this.baseUrl = this.configService.get<string>('OLLAMA_URL', 'http://localhost:11434');
    this.defaultModel = this.configService.get<string>('OLLAMA_DEFAULT_MODEL', 'llama3.1:8b-instruct-q4_K_M');
  }

  async generate(prompt: PromptInput): Promise<PromptResponse> {
    const model = prompt.model || this.defaultModel;
    
    try {
      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          prompt: `${prompt.systemPrompt}\n\n${prompt.userPrompt}`,
          stream: false,
          options: {
            temperature: prompt.temperature || 0.7,
            num_predict: prompt.maxTokens || 1000,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        content: data.response,
        usage: {
          promptTokens: data.prompt_eval_count || 0,
          completionTokens: data.eval_count || 0,
          totalTokens: (data.prompt_eval_count || 0) + (data.eval_count || 0),
        },
        model,
        provider: 'ollama',
      };
    } catch (error) {
      this.logger.error(`Error generating with Ollama: ${error.message}`);
      throw error;
    }
  }

  async *generateStream(prompt: PromptInput): AsyncGenerator<StreamResponse> {
    const model = prompt.model || this.defaultModel;
    
    try {
      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          prompt: `${prompt.systemPrompt}\n\n${prompt.userPrompt}`,
          stream: true,
          options: {
            temperature: prompt.temperature || 0.7,
            num_predict: prompt.maxTokens || 1000,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body available');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.trim()) {
            try {
              const data = JSON.parse(line);
              
              yield {
                content: data.response || '',
                done: data.done || false,
                model,
                provider: 'ollama',
              };

              if (data.done) return;
            } catch (error) {
              this.logger.warn(`Error parsing Ollama stream line: ${line}`);
            }
          }
        }
      }
    } catch (error) {
      this.logger.error(`Error streaming with Ollama: ${error.message}`);
      throw error;
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      return response.ok;
    } catch (error) {
      this.logger.warn(`Ollama not available: ${error.message}`);
      return false;
    }
  }

  async getModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status}`);
      }

      const data = await response.json();
      return data.models?.map((model: any) => model.name) || [];
    } catch (error) {
      this.logger.error(`Error getting Ollama models: ${error.message}`);
      return [];
    }
  }

  getProviderName(): string {
    return 'ollama';
  }
}
