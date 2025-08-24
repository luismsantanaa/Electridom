import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectsController } from './controllers/projects.controller';
import { ProjectsAppService } from './services/projects-app.service';
import { Project } from './entities/project.entity';
import { ProjectVersion } from './entities/project-version.entity';
import { CalculosModule } from '../calculos/calculos.module';
import { RulesModule } from '../rules/rules.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Project, ProjectVersion]),
    CalculosModule, // Para usar CalculationAppService
    RulesModule, // Para usar RuleSignatureService
  ],
  controllers: [ProjectsController],
  providers: [ProjectsAppService],
  exports: [ProjectsAppService],
})
export class ProjectsModule {}
