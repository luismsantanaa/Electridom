import { Module } from '@nestjs/common';
import { NormativesController } from './normatives.controller';
import { NormativesService } from './normatives.service';

@Module({
  controllers: [NormativesController],
  providers: [NormativesService],
  exports: [NormativesService],
})
export class NormativesModule {}
