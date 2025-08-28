import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ArtifactTypesService } from './artifact-types.service';
import { ArtifactTypesController } from './artifact-types.controller';
import { ArtifactType } from './entities/artifact-type.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ArtifactType])],
  controllers: [ArtifactTypesController],
  providers: [ArtifactTypesService],
  exports: [ArtifactTypesService],
})
export class ArtifactTypesModule {}
