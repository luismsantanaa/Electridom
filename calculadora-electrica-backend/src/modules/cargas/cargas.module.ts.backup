import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CargasService } from './loads.service';
import { CargasController } from './loads.controller';
import { loads } from './entities/loads.entity';

@Module({
  imports: [TypeOrmModule.forFeature([loads])],
  controllers: [CargasController],
  providers: [CargasService],
  exports: [CargasService],
})
export class CargasModule {}

