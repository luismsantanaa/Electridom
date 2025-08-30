import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { MockAiProvider } from './providers/mock-ai.provider';

@Module({
  controllers: [AiController],
  providers: [AiService, MockAiProvider],
  exports: [AiService],
})
export class AiModule {}
