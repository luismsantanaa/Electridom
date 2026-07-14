import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InstallationTypesService } from './installation-types.service';
import { InstallationTypesController } from './installation-types.controller';
import { InstallationType } from './entities/installation-type.entity';

@Module({
  imports: [TypeOrmModule.forFeature([InstallationType])],
  controllers: [InstallationTypesController],
  providers: [InstallationTypesService],
  exports: [InstallationTypesService],
})
export class InstallationTypesModule {}
