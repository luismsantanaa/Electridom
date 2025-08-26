import { Body, Controller, Post } from '@nestjs/common';
import { AiService } from './ai.service';

@Controller('ai')
export class AiController {
  constructor(private readonly ai: AiService) {}
  @Post('analyze') analyze(@Body() payload: any){ return this.ai.analyze(payload); }
}
