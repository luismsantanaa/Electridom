import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ProviderStrategy, PromptInput, PromptResponse, StreamResponse } from '../interfaces/provider.interface';

@Injectable()
export class OpenAiProvider implements ProviderStrategy {
  private readonly logger = new Logger(OpenAiProvider.name);
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly defaultModel: string;

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('OPENAI_API_KEY', '');
    this.baseUrl = this.configService.get<string>('OPENAI_BASE_URL', 'https://api.openai.com/v1');
    this.defaultModel = this.configService.get<string>('OPENAI_MODEL', 'gpt-4o-mini');
  }

  async generate(prompt: PromptInput): Promise<PromptResponse> {
    if (!this.apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const model = prompt.model || this.defaultModel;
    
    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: prompt.systemPrompt },
            { role: 'user', content: prompt.userPrompt },
          ],
          temperature: prompt.temperature || 0.7,
          max_tokens: prompt.maxTokens || 1000,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        content: data.choices[0]?.message?.content || '',
        usage: {
          promptTokens: data.usage?.prompt_tokens || 0,
          completionTokens: data.usage?.completion_tokens || 0,
          totalTokens: data.usage?.total_tokens || 0,
        },
        model,
        provider: 'openai',
      };
    } catch (error) {
      this.logger.error(`Error generating with OpenAI: ${error.message}`);
      throw error;
    }
  }

  async *generateStream(prompt: PromptInput): AsyncGenerator<StreamResponse> {
    if (!this.apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const model = prompt.model || this.defaultModel;
    
    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: prompt.systemPrompt },
            { role: 'user', content: prompt.userPrompt },
          ],
          temperature: prompt.temperature || 0.7,
          max_tokens: prompt.maxTokens || 1000,
          stream: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
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
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            
            if (data === '[DONE]') {
              yield {
                content: '',
                done: true,
                model,
                provider: 'openai',
              };
              return;
            }

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices[0]?.delta?.content || '';
              
              if (content) {
                yield {
                  content,
                  done: false,
                  model,
                  provider: 'openai',
                };
              }
            } catch (error) {
              this.logger.warn(`Error parsing OpenAI stream line: ${line}`);
            }
          }
        }
      }
    } catch (error) {
      this.logger.error(`Error streaming with OpenAI: ${error.message}`);
      throw error;
    }
  }

  async isAvailable(): Promise<boolean> {
    return !!this.apiKey;
  }

  async getModels(): Promise<string[]> {
    if (!this.apiKey) {
      return [];
    }

    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      return data.data?.map((model: any) => model.id) || [];
    } catch (error) {
      this.logger.error(`Error getting OpenAI models: ${error.message}`);
      return [];
    }
  }

  getProviderName(): string {
    return 'openai';
  }
}
