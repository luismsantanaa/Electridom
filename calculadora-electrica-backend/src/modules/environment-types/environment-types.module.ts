import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EnvironmentTypesService } from './environment-types.service';
import { EnvironmentTypesController } from './environment-types.controller';
import { EnvironmentType } from './entities/environment-type.entity';

@Module({
  imports: [TypeOrmModule.forFeature([EnvironmentType])],
  controllers: [EnvironmentTypesController],
  providers: [EnvironmentTypesService],
  exports: [EnvironmentTypesService],
})
export class EnvironmentTypesModule {}
