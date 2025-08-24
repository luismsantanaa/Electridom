import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AmbienteService } from './ambiente.service';
import { AmbienteController } from './ambiente.controller';
import { Ambiente } from './entities/ambiente.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Ambiente])],
  controllers: [AmbienteController],
  providers: [AmbienteService],
  exports: [AmbienteService],
})
export class AmbienteModule {}
