import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Project, ProjectStatus } from '../entities/project.entity';
import { ProjectVersion } from '../entities/project-version.entity';
import {
  CreateProjectRequestDto,
  CreateVersionRequestDto,
  UpdateProjectStatusDto,
} from '../dtos/create-project.dto';
import {
  ProjectSummaryDto,
  ProjectVersionDetailDto,
  ProjectListResponseDto,
  ProjectExportDto,
} from '../dtos/project-response.dto';
import { CalculationAppService } from '../../calculos/services/calculation-app.service';
import { RuleSignatureService } from '../../rules/services/rule-signature.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ProjectsAppService {
  private readonly maxVersionsPerProject: number;

  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(ProjectVersion)
    private readonly projectVersionRepository: Repository<ProjectVersion>,
    private readonly calculationAppService: CalculationAppService,
    private readonly ruleSignatureService: RuleSignatureService,
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
  ) {
    this.maxVersionsPerProject = this.configService.get<number>(
      'MAX_VERSIONS_PER_PROJECT',
      100,
    );
  }

  /**
   * Crea un nuevo proyecto y opcionalmente su primera versión
   */
  async createProject(
    dto: CreateProjectRequestDto,
  ): Promise<ProjectSummaryDto> {
    // Validar que no exista un proyecto con el mismo nombre
    const existingProject = await this.projectRepository.findOne({
      where: { name: dto.projectName },
    });

    if (existingProject) {
      throw new ConflictException(
        `Ya existe un proyecto con el nombre "${dto.projectName}"`,
      );
    }

    // Crear el proyecto
    const project = this.projectRepository.create({
      name: dto.projectName,
      description: dto.description,
      status: 'ACTIVE' as ProjectStatus,
    });

    const savedProject = await this.projectRepository.save(project);

    let latestVersion:
      | {
          versionId: string;
          versionNumber: number;
          createdAt: string;
          rulesSignature: string;
          totales: any;
        }
      | undefined = undefined;

    // Si se solicita calcular inmediatamente, crear la primera versión
    if (dto.computeNow !== false) {
      const version = await this.createVersionInternal(
        savedProject[0].id,
        {
          superficies: dto.superficies,
          consumos: dto.consumos,
          opciones: dto.opciones,
        },
        null, // No hay versión anterior
      );

      latestVersion = {
        versionId: version.id,
        versionNumber: version.versionNumber,
        createdAt: version.creationDate.toISOString(),
        rulesSignature: version.rulesSignature,
        totales: version.outputTotales,
      };
    }

    return {
      projectId: savedProject[0].id,
      projectName: savedProject[0].name,
      status: savedProject[0].status,
      createdAt: savedProject[0].creationDate.toISOString(),
      updatedAt: savedProject[0].updateDate.toISOString(),
      latestVersion,
    };
  }

  /**
   * Crea una nueva versión de un proyecto existente
   */
  async createVersion(
    projectId: string,
    dto: CreateVersionRequestDto,
  ): Promise<ProjectVersionDetailDto> {
    // Verificar que el proyecto existe y no esté archivado
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException(`Proyecto con ID ${projectId} no encontrado`);
    }

    if (project.status === 'ARCHIVED') {
      throw new BadRequestException(
        'No se pueden crear versiones en proyectos archivados',
      );
    }

    // Obtener la última versión para el número de versión
    const lastVersion = await this.projectVersionRepository.findOne({
      where: { project: { id: projectId } },
      order: { versionNumber: 'DESC' },
    });

    const newVersionNumber = lastVersion ? lastVersion.versionNumber + 1 : 1;

    // Verificar límite de versiones
    if (newVersionNumber > this.maxVersionsPerProject) {
      throw new BadRequestException(
        `Se ha alcanzado el límite máximo de ${this.maxVersionsPerProject} versiones por proyecto`,
      );
    }

    // Crear la nueva versión
    const version = await this.createVersionInternal(
      projectId,
      dto,
      lastVersion,
    );

    return this.mapVersionToDetailDto(version, project);
  }

  /**
   * Obtiene un proyecto con su última versión
   */
  async getProject(
    projectId: string,
    includeArchived = false,
  ): Promise<ProjectSummaryDto> {
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
    });

    if (!project || (!includeArchived && project.status === 'ARCHIVED')) {
      throw new NotFoundException(`Proyecto con ID ${projectId} no encontrado`);
    }

    // Obtener la última versión
    const latestVersion = await this.projectVersionRepository.findOne({
      where: { project: { id: projectId } },
      order: { versionNumber: 'DESC' },
    });

    return {
      projectId: project.id,
      projectName: project.name,
      status: project.status,
              createdAt: project.creationDate.toISOString(),
              updatedAt: project.updateDate.toISOString(),
      latestVersion: latestVersion
        ? {
            versionId: latestVersion.id,
            versionNumber: latestVersion.versionNumber,
            createdAt: latestVersion.creationDate.toISOString(),
            rulesSignature: latestVersion.rulesSignature,
            totales: latestVersion.outputTotales,
          }
        : undefined,
    };
  }

  /**
   * Obtiene una versión específica de un proyecto
   */
  async getVersion(
    projectId: string,
    versionId: string,
  ): Promise<ProjectVersionDetailDto> {
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException(`Proyecto con ID ${projectId} no encontrado`);
    }

    const version = await this.projectVersionRepository.findOne({
      where: { id: versionId, project: { id: projectId } },
    });

    if (!version) {
      throw new NotFoundException(
        `Versión con ID ${versionId} no encontrada en el proyecto ${projectId}`,
      );
    }

    return this.mapVersionToDetailDto(version, project);
  }

  /**
   * Lista proyectos con paginación y filtros
   */
  async listProjects(
    page = 1,
    pageSize = 20,
    query?: string,
    includeArchived = false,
  ): Promise<ProjectListResponseDto> {
    const skip = (page - 1) * pageSize;

    // Construir query builder
    const queryBuilder = this.projectRepository
      .createQueryBuilder('project')
      .leftJoinAndSelect('project.versions', 'versions')
      .orderBy('project.createdAt', 'DESC');

    // Aplicar filtros
    if (!includeArchived) {
      queryBuilder.andWhere('project.status = :status', { status: 'ACTIVE' });
    }

    if (query) {
      queryBuilder.andWhere(
        'project.projectName LIKE :query OR project.description LIKE :query',
        {
          query: `%${query}%`,
        },
      );
    }

    // Contar total
    const total = await queryBuilder.getCount();

    // Obtener datos paginados
    const projects = await queryBuilder.skip(skip).take(pageSize).getMany();

    // Mapear a DTOs
    const projectDtos = await Promise.all(
      projects.map(async (project) => {
        const latestVersion =
          project.versions.length > 0
            ? project.versions.sort(
                (a, b) => b.versionNumber - a.versionNumber,
              )[0]
            : null;

        return {
          projectId: project.id,
          projectName: project.name,
          status: project.status,
          createdAt: project.creationDate.toISOString(),
          updatedAt: project.updateDate.toISOString(),
          latestVersion: latestVersion
            ? {
                versionId: latestVersion.id,
                versionNumber: latestVersion.versionNumber,
                createdAt: latestVersion.creationDate.toISOString(),
                rulesSignature: latestVersion.rulesSignature,
                totales: latestVersion.outputTotales,
              }
            : undefined,
        };
      }),
    );

    return {
      data: projectDtos,
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  /**
   * Actualiza el estado de un proyecto
   */
  async updateProjectStatus(
    projectId: string,
    dto: UpdateProjectStatusDto,
  ): Promise<ProjectSummaryDto> {
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException(`Proyecto con ID ${projectId} no encontrado`);
    }

    project.status = dto.status;
    const updatedProject = await this.projectRepository.save(project);

    return this.getProject(projectId, true);
  }

  /**
   * Exporta un proyecto completo con todas sus versiones
   */
  async exportProject(projectId: string): Promise<ProjectExportDto> {
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
      relations: ['versions'],
    });

    if (!project) {
      throw new NotFoundException(`Proyecto con ID ${projectId} no encontrado`);
    }

    // Obtener resumen del proyecto
    const projectSummary = await this.getProject(projectId, true);

    // Obtener detalles de todas las versiones
    const versionDetails = await Promise.all(
      project.versions
        .sort((a, b) => a.versionNumber - b.versionNumber)
        .map((version) => this.mapVersionToDetailDto(version, project)),
    );

    return {
      project: projectSummary,
      versions: versionDetails,
    };
  }

  /**
   * Método interno para crear una versión
   */
  private async createVersionInternal(
    projectId: string,
    dto: CreateVersionRequestDto,
    previousVersion: ProjectVersion | null,
  ): Promise<ProjectVersion> {
    // Ejecutar cálculo usando el servicio de HU-001
    const calculationResult = await this.calculationAppService.preview({
      superficies: dto.superficies,
      consumos: dto.consumos,
      opciones: dto.opciones,
    });

    // Generar firma de reglas basada en el RuleSet usado
    let currentRulesSignature: string;
    let warnings = [...(calculationResult.warnings || [])];

    if (dto.opciones?.ruleSetId) {
      // Usar firma del RuleSet específico
      currentRulesSignature =
        await this.ruleSignatureService.getRuleSetSignature(
          dto.opciones.ruleSetId,
        );
      warnings.push(`Usando RuleSet específico: ${dto.opciones.ruleSetId}`);
    } else if (dto.opciones?.effectiveDate) {
      // Usar firma de las reglas activas para la fecha
      currentRulesSignature =
        await this.ruleSignatureService.getActiveRulesSignature(
          dto.opciones.effectiveDate,
        );
      warnings.push(
        `Usando reglas activas para fecha: ${dto.opciones.effectiveDate}`,
      );
    } else {
      // Usar firma legacy (reglas por defecto)
      currentRulesSignature =
        await this.ruleSignatureService.getCurrentSignature();
      warnings.push('Usando reglas legacy (por defecto)');
    }

    // Verificar si las reglas cambiaron
    let rulesChangedFromPrevious = false;

    if (previousVersion) {
      rulesChangedFromPrevious = this.ruleSignatureService.compareSignatures(
        previousVersion.rulesSignature,
        currentRulesSignature,
      );

      if (rulesChangedFromPrevious) {
        warnings.push('Reglas cambiaron respecto a la versión anterior');
      }
    }

    // Crear la versión en una transacción
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Obtener el siguiente número de versión con bloqueo
      const lastVersion = await queryRunner.manager.findOne(ProjectVersion, {
        where: { project: { id: projectId } },
        order: { versionNumber: 'DESC' },
      });

      const versionNumber = lastVersion ? lastVersion.versionNumber + 1 : 1;

      // Crear la nueva versión
      const version = queryRunner.manager.create(ProjectVersion, {
        project: { id: projectId },
        versionNumber,
        inputSuperficies: dto.superficies,
        inputConsumos: dto.consumos,
        inputOpciones: dto.opciones,
        outputCargasPorAmbiente: calculationResult.cargasPorAmbiente,
        outputTotales: calculationResult.totales,
        outputPropuestaCircuitos: calculationResult.propuestaCircuitos,
        outputWarnings: warnings,
        rulesSignature: currentRulesSignature,
        note: dto.note,
      });

      const savedVersion = await queryRunner.manager.save(
        ProjectVersion,
        version,
      );

      await queryRunner.commitTransaction();
      return savedVersion;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Mapea una versión a su DTO de detalle
   */
  private mapVersionToDetailDto(
    version: ProjectVersion,
    project: Project,
  ): ProjectVersionDetailDto {
    return {
      projectId: project.id,
      versionId: version.id,
      versionNumber: version.versionNumber,
      createdAt: version.creationDate.toISOString(),
      input: {
        superficies: version.inputSuperficies,
        consumos: version.inputConsumos,
        opciones: version.inputOpciones,
      },
      output: {
        cargasPorAmbiente: version.outputCargasPorAmbiente,
        totales: version.outputTotales,
        propuestaCircuitos: version.outputPropuestaCircuitos,
        warnings: version.outputWarnings,
      },
      rulesSignature: version.rulesSignature,
      rulesChangedFromPrevious: false, // Se calcula dinámicamente si es necesario
      note: version.note,
      traceId: 'unknown', // Se puede obtener del contexto de la request
    };
  }
}
