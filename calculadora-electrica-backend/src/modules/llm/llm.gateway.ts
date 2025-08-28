import { Injectable, Logger, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ProviderStrategy, PromptInput, PromptResponse, StreamResponse } from './interfaces/provider.interface';
import { OllamaProvider } from './providers/ollama.provider';
import { OpenAiProvider } from './providers/openai.provider';

@Injectable()
export class LlmGateway {
  private readonly logger = new Logger(LlmGateway.name);
  private currentProvider: ProviderStrategy;
  private readonly providers: Map<string, ProviderStrategy>;

  constructor(
    private configService: ConfigService,
    @Inject('OllamaProvider') private ollamaProvider: OllamaProvider,
    @Inject('OpenAiProvider') private openaiProvider: OpenAiProvider,
  ) {
    this.providers = new Map<string, ProviderStrategy>([
      ['ollama', this.ollamaProvider],
      ['openai', this.openaiProvider],
    ]);
    
    this.initializeProvider();
  }

  private async initializeProvider(): Promise<void> {
    const configuredProvider = this.configService.get<string>('LLM_PROVIDER', 'ollama');
    
    // Intentar usar el proveedor configurado
    if (this.providers.has(configuredProvider)) {
      const provider = this.providers.get(configuredProvider)!;
      if (await provider.isAvailable()) {
        this.currentProvider = provider;
        this.logger.log(`Using LLM provider: ${configuredProvider}`);
        return;
      }
    }

    // Fallback: intentar Ollama primero, luego OpenAI
    if (await this.ollamaProvider.isAvailable()) {
      this.currentProvider = this.ollamaProvider;
      this.logger.log('Using fallback provider: ollama');
    } else if (await this.openaiProvider.isAvailable()) {
      this.currentProvider = this.openaiProvider;
      this.logger.log('Using fallback provider: openai');
    } else {
      this.logger.error('No LLM providers available');
      throw new Error('No LLM providers available');
    }
  }

  async generate<T = any>(prompt: PromptInput): Promise<PromptResponse> {
    if (!this.currentProvider) {
      await this.initializeProvider();
    }

    const startTime = Date.now();
    const correlationId = this.generateCorrelationId();

    this.logger.log(`[${correlationId}] Generating response with ${this.currentProvider.getProviderName()}`);

    try {
      const response = await this.currentProvider.generate(prompt);
      
      const duration = Date.now() - startTime;
      this.logger.log(`[${correlationId}] Generation completed in ${duration}ms`);

      return response;
    } catch (error) {
      this.logger.error(`[${correlationId}] Generation failed: ${error.message}`);
      
      // Intentar fallback si el proveedor actual falla
      if (this.currentProvider.getProviderName() === 'ollama' && await this.openaiProvider.isAvailable()) {
        this.logger.log(`[${correlationId}] Attempting fallback to OpenAI`);
        this.currentProvider = this.openaiProvider;
        return await this.currentProvider.generate(prompt);
      }
      
      throw error;
    }
  }

  async *generateStream(prompt: PromptInput): AsyncGenerator<StreamResponse> {
    if (!this.currentProvider) {
      await this.initializeProvider();
    }

    const correlationId = this.generateCorrelationId();
    this.logger.log(`[${correlationId}] Starting stream generation with ${this.currentProvider.getProviderName()}`);

    try {
      for await (const chunk of this.currentProvider.generateStream(prompt)) {
        yield chunk;
      }
      
      this.logger.log(`[${correlationId}] Stream generation completed`);
    } catch (error) {
      this.logger.error(`[${correlationId}] Stream generation failed: ${error.message}`);
      throw error;
    }
  }

  async getAvailableProviders(): Promise<{ name: string; available: boolean; models: string[] }[]> {
    const providers: { name: string; available: boolean; models: string[] }[] = [];
    
    for (const [name, provider] of this.providers) {
      const available = await provider.isAvailable();
      const models = available ? await provider.getModels() : [];
      
      providers.push({
        name,
        available,
        models,
      });
    }
    
    return providers;
  }

  async getCurrentProvider(): Promise<{ name: string; models: string[] }> {
    if (!this.currentProvider) {
      await this.initializeProvider();
    }
    
    return {
      name: this.currentProvider.getProviderName(),
      models: await this.currentProvider.getModels(),
    };
  }

  private generateCorrelationId(): string {
    return `llm-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
