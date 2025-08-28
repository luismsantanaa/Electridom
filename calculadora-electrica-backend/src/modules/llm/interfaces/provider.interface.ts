export interface PromptInput {
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  maxTokens?: number;
  model?: string;
}

export interface PromptResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model: string;
  provider: string;
}

export interface StreamResponse {
  content: string;
  done: boolean;
  model: string;
  provider: string;
}

export interface ProviderStrategy {
  generate(prompt: PromptInput): Promise<PromptResponse>;
  generateStream(prompt: PromptInput): AsyncGenerator<StreamResponse>;
  isAvailable(): Promise<boolean>;
  getModels(): Promise<string[]>;
  getProviderName(): string;
}
