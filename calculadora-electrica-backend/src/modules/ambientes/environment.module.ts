import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EnvironmentService } from './environment.service';
import { EnvironmentController } from './environment.controller';
import { environment } from './entities/environment.entity';

@Module({
  imports: [TypeOrmModule.forFeature([environment])],
  controllers: [EnvironmentController],
  providers: [EnvironmentService],
  exports: [EnvironmentService],
})
export class EnvironmentModule {}

