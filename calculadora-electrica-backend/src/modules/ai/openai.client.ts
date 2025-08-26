import OpenAI from 'openai';
import { ConfigService } from '@nestjs/config';

export class OpenAIClient {
  private client: OpenAI;

  constructor(private configService: ConfigService) {
    this.client = new OpenAI({
      apiKey: this.configService.get<string>('OPENAI_API_KEY'),
      timeout: this.configService.get<number>('AI_TIMEOUT_MS', 30000),
    });
  }

  getClient(): OpenAI {
    return this.client;
  }

  getModel(): string {
    return this.configService.get<string>('OPENAI_MODEL', 'gpt-4o-mini');
  }
}
