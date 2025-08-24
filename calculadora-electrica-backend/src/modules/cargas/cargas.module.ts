import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CargasService } from './cargas.service';
import { CargasController } from './cargas.controller';
import { Cargas } from './entities/cargas.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Cargas])],
  controllers: [CargasController],
  providers: [CargasService],
  exports: [CargasService],
})
export class CargasModule {}
