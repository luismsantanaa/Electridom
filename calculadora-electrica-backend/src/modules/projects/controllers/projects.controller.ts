import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  ValidationPipe,
  UsePipes,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { ProjectsAppService } from '../services/projects-app.service';
import { CreateProjectRequestDto, CreateVersionRequestDto, UpdateProjectStatusDto } from '../dtos/create-project.dto';
import { ProjectSummaryDto, ProjectVersionDetailDto, ProjectListResponseDto, ProjectExportDto } from '../dtos/project-response.dto';

@ApiTags('Proyectos Eléctricos')
@Controller('v1/projects')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class ProjectsController {
  constructor(private readonly projectsAppService: ProjectsAppService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crear un nuevo proyecto eléctrico',
    description: 'Crea un nuevo proyecto y opcionalmente ejecuta el cálculo inicial para generar la primera versión',
  })
  @ApiBody({
    type: CreateProjectRequestDto,
    description: 'Datos del proyecto y cálculo inicial',
    examples: {
      ejemplo1: {
        summary: 'Proyecto con cálculo inmediato',
        description: 'Crea proyecto y ejecuta cálculo para versión 1',
        value: {
          projectName: 'Residencia García',
          description: 'Unifamiliar 2 plantas',
          superficies: [
            { ambiente: 'Sala', areaM2: 18.5 },
            { ambiente: 'Dormitorio 1', areaM2: 12.0 },
          ],
          consumos: [
            { nombre: 'Televisor', ambiente: 'Sala', watts: 120 },
            { nombre: 'Lámpara', ambiente: 'Dormitorio 1', watts: 60 },
          ],
          opciones: { tensionV: 120, monofasico: true },
          computeNow: true,
        },
      },
      ejemplo2: {
        summary: 'Proyecto sin cálculo inicial',
        description: 'Crea proyecto sin ejecutar cálculo',
        value: {
          projectName: 'Proyecto Futuro',
          description: 'Proyecto para cálculo posterior',
          superficies: [],
          consumos: [],
          computeNow: false,
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Proyecto creado exitosamente',
    type: ProjectSummaryDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Datos de entrada inválidos',
  })
  @ApiResponse({
    status: 409,
    description: 'Ya existe un proyecto con ese nombre',
  })
  async createProject(@Body() request: CreateProjectRequestDto): Promise<ProjectSummaryDto> {
    return this.projectsAppService.createProject(request);
  }

  @Post(':projectId/versions')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crear nueva versión de un proyecto',
    description: 'Crea una nueva versión de un proyecto existente ejecutando el cálculo con los datos proporcionados',
  })
  @ApiParam({
    name: 'projectId',
    description: 'ID del proyecto',
    example: 'uuid',
  })
  @ApiBody({
    type: CreateVersionRequestDto,
    description: 'Datos para la nueva versión',
    examples: {
      ejemplo1: {
        summary: 'Nueva versión con ajustes',
        description: 'Crea versión con modificaciones en consumos',
        value: {
          superficies: [
            { ambiente: 'Sala', areaM2: 18.5 },
            { ambiente: 'Cocina', areaM2: 15.0 },
          ],
          consumos: [
            { nombre: 'Televisor', ambiente: 'Sala', watts: 120 },
            { nombre: 'Refrigerador', ambiente: 'Cocina', watts: 800 },
          ],
          opciones: { tensionV: 120, monofasico: true },
          note: 'Ajuste de consumos cocina',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Versión creada exitosamente',
    type: ProjectVersionDetailDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos o proyecto archivado',
  })
  @ApiResponse({
    status: 404,
    description: 'Proyecto no encontrado',
  })
  @ApiResponse({
    status: 422,
    description: 'Límite de versiones alcanzado',
  })
  async createVersion(
    @Param('projectId') projectId: string,
    @Body() request: CreateVersionRequestDto,
  ): Promise<ProjectVersionDetailDto> {
    return this.projectsAppService.createVersion(projectId, request);
  }

  @Get(':projectId')
  @ApiOperation({
    summary: 'Obtener proyecto con resumen',
    description: 'Obtiene los metadatos del proyecto y información de la última versión',
  })
  @ApiParam({
    name: 'projectId',
    description: 'ID del proyecto',
    example: 'uuid',
  })
  @ApiQuery({
    name: 'includeArchived',
    description: 'Incluir proyectos archivados',
    required: false,
    type: Boolean,
  })
  @ApiResponse({
    status: 200,
    description: 'Proyecto obtenido exitosamente',
    type: ProjectSummaryDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Proyecto no encontrado',
  })
  async getProject(
    @Param('projectId') projectId: string,
    @Query('includeArchived') includeArchived?: boolean,
  ): Promise<ProjectSummaryDto> {
    return this.projectsAppService.getProject(projectId, includeArchived);
  }

  @Get(':projectId/versions/:versionId')
  @ApiOperation({
    summary: 'Obtener versión específica',
    description: 'Obtiene el detalle completo de una versión específica del proyecto',
  })
  @ApiParam({
    name: 'projectId',
    description: 'ID del proyecto',
    example: 'uuid',
  })
  @ApiParam({
    name: 'versionId',
    description: 'ID de la versión',
    example: 'uuid',
  })
  @ApiResponse({
    status: 200,
    description: 'Versión obtenida exitosamente',
    type: ProjectVersionDetailDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Proyecto o versión no encontrada',
  })
  async getVersion(
    @Param('projectId') projectId: string,
    @Param('versionId') versionId: string,
  ): Promise<ProjectVersionDetailDto> {
    return this.projectsAppService.getVersion(projectId, versionId);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar proyectos',
    description: 'Lista proyectos con paginación y filtros de búsqueda',
  })
  @ApiQuery({
    name: 'page',
    description: 'Número de página',
    required: false,
    type: Number,
    example: 1,
  })
  @ApiQuery({
    name: 'pageSize',
    description: 'Tamaño de página',
    required: false,
    type: Number,
    example: 20,
  })
  @ApiQuery({
    name: 'query',
    description: 'Término de búsqueda en nombre o descripción',
    required: false,
    type: String,
  })
  @ApiQuery({
    name: 'includeArchived',
    description: 'Incluir proyectos archivados',
    required: false,
    type: Boolean,
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de proyectos obtenida exitosamente',
    type: ProjectListResponseDto,
  })
  async listProjects(
    @Query('page') page = 1,
    @Query('pageSize') pageSize = 20,
    @Query('query') query?: string,
    @Query('includeArchived') includeArchived = false,
  ): Promise<ProjectListResponseDto> {
    return this.projectsAppService.listProjects(page, pageSize, query, includeArchived);
  }

  @Patch(':projectId')
  @ApiOperation({
    summary: 'Actualizar estado del proyecto',
    description: 'Archiva o restaura un proyecto',
  })
  @ApiParam({
    name: 'projectId',
    description: 'ID del proyecto',
    example: 'uuid',
  })
  @ApiBody({
    type: UpdateProjectStatusDto,
    description: 'Nuevo estado del proyecto',
    examples: {
      archivar: {
        summary: 'Archivar proyecto',
        value: { status: 'ARCHIVED' },
      },
      restaurar: {
        summary: 'Restaurar proyecto',
        value: { status: 'ACTIVE' },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Estado actualizado exitosamente',
    type: ProjectSummaryDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Proyecto no encontrado',
  })
  async updateProjectStatus(
    @Param('projectId') projectId: string,
    @Body() request: UpdateProjectStatusDto,
  ): Promise<ProjectSummaryDto> {
    return this.projectsAppService.updateProjectStatus(projectId, request);
  }

  @Get(':projectId/export')
  @ApiOperation({
    summary: 'Exportar proyecto completo',
    description: 'Exporta un proyecto con todas sus versiones en formato JSON',
  })
  @ApiParam({
    name: 'projectId',
    description: 'ID del proyecto',
    example: 'uuid',
  })
  @ApiResponse({
    status: 200,
    description: 'Proyecto exportado exitosamente',
    type: ProjectExportDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Proyecto no encontrado',
  })
  async exportProject(@Param('projectId') projectId: string): Promise<ProjectExportDto> {
    return this.projectsAppService.exportProject(projectId);
  }
}
