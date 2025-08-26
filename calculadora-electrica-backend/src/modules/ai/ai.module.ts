import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { OpenAIClient } from './openai.client';
import { PromptBuilderHelper } from './helpers/prompt-builder.helper';
import { ExcelIngestService } from './services/excel-ingest.service';

@Module({
  imports: [ConfigModule],
  controllers: [AiController],
  providers: [AiService, OpenAIClient, PromptBuilderHelper, ExcelIngestService],
  exports: [AiService, ExcelIngestService]
})
export class AiModule {}
