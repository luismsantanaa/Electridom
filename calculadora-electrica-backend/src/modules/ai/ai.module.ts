import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { PromptBuilderHelper } from './helpers/prompt-builder.helper';
import { ExcelIngestService } from './services/excel-ingest.service';

@Module({
  imports: [ConfigModule],
  controllers: [AiController],
  providers: [
    AiService, 
    PromptBuilderHelper, 
    ExcelIngestService,
    {
      provide: 'OpenAIClient',
      useFactory: () => {
        try {
          const { OpenAIClient } = require('./openai.client');
          return new OpenAIClient();
        } catch (error) {
          console.warn('OpenAI client not available:', error.message);
          return null;
        }
      }
    }
  ],
  exports: [AiService, ExcelIngestService]
})
export class AiModule {}
