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
  Put,
  Delete,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ProjectsAppService } from '../services/projects-app.service';
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
import { ProjectInputDto, ProjectResponseDto } from '../dtos/project-crud.dto';
import { Roles, UserRole } from '../../../common/decorators/roles.decorator';
import { RolesGuard } from '../../../common/guards/roles.guard';

@ApiTags('projects Eléctricos')
@Controller('v1/projects')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
// @UseGuards(RolesGuard)
// @ApiBearerAuth()
export class ProjectsController {
  constructor(private readonly projectsAppService: ProjectsAppService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crear un nuevo project eléctrico',
    description:
      'Crea un nuevo project y opcionalmente ejecuta el cálculo inicial para generar la primera versión',
  })
  @ApiBody({
    type: CreateProjectRequestDto,
    description: 'Datos del project y cálculo inicial',
    examples: {
      ejemplo1: {
        summary: 'project con cálculo inmediato',
        description: 'Crea project y ejecuta cálculo para versión 1',
        value: {
          projectName: 'Residencia García',
          description: 'Unifamiliar 2 plantas',
          surfaces: [
            { environment: 'Sala', areaM2: 18.5 },
            { environment: 'Dormitorio 1', areaM2: 12.0 },
          ],
          consumptions: [
            { name: 'Televisor', environment: 'Sala', watts: 120 },
            { name: 'Lámpara', environment: 'Dormitorio 1', watts: 60 },
          ],
          opciones: { tensionV: 120, monofasico: true },
          computeNow: true,
        },
      },
      ejemplo2: {
        summary: 'project sin cálculo inicial',
        description: 'Crea project sin ejecutar cálculo',
        value: {
          projectName: 'project Futuro',
          description: 'project para cálculo posterior',
          surfaces: [],
          consumptions: [],
          computeNow: false,
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'project creado exitosamente',
    type: ProjectSummaryDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Datos de entrada inválidos',
  })
  @ApiResponse({
    status: 409,
    description: 'Ya existe un project con ese name',
  })
  async createProject(
    @Body() request: CreateProjectRequestDto,
  ): Promise<ProjectSummaryDto> {
    return this.projectsAppService.createProject(request);
  }

  @Post(':projectId/versions')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crear nueva versión de un project',
    description:
      'Crea una nueva versión de un project existente ejecutando el cálculo con los datos proporcionados',
  })
  @ApiParam({
    name: 'projectId',
    description: 'ID del project',
    example: 'uuid',
  })
  @ApiBody({
    type: CreateVersionRequestDto,
    description: 'Datos para la nueva versión',
    examples: {
      ejemplo1: {
        summary: 'Nueva versión con ajustes',
        description: 'Crea versión con modificaciones en consumptions',
        value: {
          surfaces: [
            { environment: 'Sala', areaM2: 18.5 },
            { environment: 'Cocina', areaM2: 15.0 },
          ],
          consumptions: [
            { name: 'Televisor', environment: 'Sala', watts: 120 },
            { name: 'Refrigerador', environment: 'Cocina', watts: 800 },
          ],
          opciones: { tensionV: 120, monofasico: true },
          note: 'Ajuste de consumptions cocina',
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
    description: 'Datos inválidos o project archivado',
  })
  @ApiResponse({
    status: 404,
    description: 'project no encontrado',
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
    summary: 'Obtener project con resumen',
    description:
      'Obtiene los metadatos del project y información de la última versión',
  })
  @ApiParam({
    name: 'projectId',
    description: 'ID del project',
    example: 'uuid',
  })
  @ApiQuery({
    name: 'includeArchived',
    description: 'Incluir projects archivados',
    required: false,
    type: Boolean,
  })
  @ApiResponse({
    status: 200,
    description: 'project obtenido exitosamente',
    type: ProjectSummaryDto,
  })
  @ApiResponse({
    status: 404,
    description: 'project no encontrado',
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
    description:
      'Obtiene el detalle completo de una versión específica del project',
  })
  @ApiParam({
    name: 'projectId',
    description: 'ID del project',
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
    description: 'project o versión no encontrada',
  })
  async getVersion(
    @Param('projectId') projectId: string,
    @Param('versionId') versionId: string,
  ): Promise<ProjectVersionDetailDto> {
    return this.projectsAppService.getVersion(projectId, versionId);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar projects',
    description: 'Lista projects con paginación y filtros de búsqueda',
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
    name: 'sort',
    description: 'Campo para ordenar',
    required: false,
    type: String,
  })
  @ApiQuery({
    name: 'order',
    description: 'Orden ascendente o descendente',
    required: false,
    enum: ['asc', 'desc'],
    example: 'asc',
  })
  @ApiQuery({
    name: 'q',
    description: 'Término de búsqueda en name o descripción',
    required: false,
    type: String,
  })
  @ApiQuery({
    name: 'includeArchived',
    description: 'Incluir projects archivados',
    required: false,
    type: Boolean,
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de projects obtenida exitosamente',
    type: ProjectListResponseDto,
  })
  async listProjects(
    @Query('page') page = 1,
    @Query('pageSize') pageSize = 20,
    @Query('sort') sort?: string,
    @Query('order') order: 'asc' | 'desc' = 'asc',
    @Query('q') q?: string,
    @Query('includeArchived') includeArchived = false,
  ): Promise<ProjectListResponseDto> {
    return this.projectsAppService.listProjects(
      page,
      pageSize,
      q,
      includeArchived,
      sort,
      order,
    );
  }

  @Patch(':projectId')
  @ApiOperation({
    summary: 'Actualizar estado del project',
    description: 'Archiva o restaura un project',
  })
  @ApiParam({
    name: 'projectId',
    description: 'ID del project',
    example: 'uuid',
  })
  @ApiBody({
    type: UpdateProjectStatusDto,
    description: 'Nuevo estado del project',
    examples: {
      archivar: {
        summary: 'Archivar project',
        value: { status: 'ARCHIVED' },
      },
      restaurar: {
        summary: 'Restaurar project',
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
    description: 'project no encontrado',
  })
  async updateProjectStatus(
    @Param('projectId') projectId: string,
    @Body() request: UpdateProjectStatusDto,
  ): Promise<ProjectSummaryDto> {
    return this.projectsAppService.updateProjectStatus(projectId, request);
  }

  @Get(':projectId/export')
  @ApiOperation({
    summary: 'Exportar project completo',
    description: 'Exporta un project con todas sus versiones en formato JSON',
  })
  @ApiParam({
    name: 'projectId',
    description: 'ID del project',
    example: 'uuid',
  })
  @ApiResponse({
    status: 200,
    description: 'project exportado exitosamente',
    type: ProjectExportDto,
  })
  @ApiResponse({
    status: 404,
    description: 'project no encontrado',
  })
  async exportProject(
    @Param('projectId') projectId: string,
  ): Promise<ProjectExportDto> {
    return this.projectsAppService.exportProject(projectId);
  }

  // ===== SPRINT 9: CRUD COMPLETO =====

  @Post('simple')
  @HttpCode(HttpStatus.CREATED)
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @ApiOperation({
    summary: 'Crear proyecto simple',
    description: 'Crea un nuevo proyecto con datos básicos (Sprint 9)',
  })
  @ApiBody({
    type: ProjectInputDto,
    description: 'Datos del proyecto',
  })
  @ApiResponse({
    status: 201,
    description: 'Proyecto creado exitosamente',
    type: ProjectResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Datos de entrada inválidos',
  })
  @ApiResponse({
    status: 409,
    description: 'Ya existe un proyecto con ese nombre',
  })
  async createSimpleProject(
    @Body() request: ProjectInputDto,
  ): Promise<ProjectResponseDto> {
    return this.projectsAppService.createSimpleProject(request);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @ApiOperation({
    summary: 'Editar proyecto',
    description: 'Actualiza un proyecto existente (Sprint 9)',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del proyecto',
    example: 'uuid',
  })
  @ApiBody({
    type: ProjectInputDto,
    description: 'Datos actualizados del proyecto',
  })
  @ApiResponse({
    status: 200,
    description: 'Proyecto actualizado exitosamente',
    type: ProjectResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Proyecto no encontrado',
  })
  async updateProject(
    @Param('id') id: string,
    @Body() request: ProjectInputDto,
  ): Promise<ProjectResponseDto> {
    return this.projectsAppService.updateProject(id, request);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Eliminar proyecto',
    description: 'Elimina un proyecto (solo admin, Sprint 9)',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del proyecto',
    example: 'uuid',
  })
  @ApiResponse({
    status: 204,
    description: 'Proyecto eliminado exitosamente',
  })
  @ApiResponse({
    status: 404,
    description: 'Proyecto no encontrado',
  })
  @ApiResponse({
    status: 409,
    description: 'No se puede eliminar proyecto con exportaciones activas',
  })
  async deleteProject(@Param('id') id: string): Promise<void> {
    return this.projectsAppService.deleteProject(id);
  }
}
