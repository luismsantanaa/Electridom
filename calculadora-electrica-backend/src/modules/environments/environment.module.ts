import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EnvironmentService } from './environment.service';
import { EnvironmentController } from './environment.controller';
import { Environment } from './entities/environment.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Environment])],
  controllers: [EnvironmentController],
  providers: [EnvironmentService],
  exports: [EnvironmentService],
})
export class EnvironmentModule {}

