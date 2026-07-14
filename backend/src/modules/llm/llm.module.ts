import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LlmGateway } from './llm.gateway';
import { OllamaProvider } from './providers/ollama.provider';
import { OpenAiProvider } from './providers/openai.provider';
import { LlmController } from './llm.controller';
import { LlmService } from './llm.service';

@Module({
  imports: [ConfigModule],
  controllers: [LlmController],
  providers: [
    LlmGateway,
    LlmService,
    {
      provide: 'OllamaProvider',
      useClass: OllamaProvider,
    },
    {
      provide: 'OpenAiProvider',
      useClass: OpenAiProvider,
    },
  ],
  exports: [LlmGateway, LlmService],
})
export class LlmModule {}
